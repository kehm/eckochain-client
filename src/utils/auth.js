import crypto from 'crypto';
import Sequelize from 'sequelize';
import Token from '../database/models/Token.js';
import User from '../database/models/User.js';
import { sendMail, mailSubject } from './mailer.js';
import { logError, logInfo } from './logger.js';
import Organizations from '../database/models/Organizations.js';
import postgres from '../config/postgres.js';
import { encryptSha256 } from './encryption.js';
import Emails from '../database/models/Emails.js';

/**
 * Find user and default organization
 *
 * @param {string} orcid Orcid ID
 * @returns {Object} User object or null
 */
export const findUser = async (orcid) => {
    const users = await postgres.query(
        'SELECT ecko_user.ecko_user_id as id, ecko_user.user_status_name as status, ecko_user.orcid as orcid, ecko_user.name as name, '
        + 'user_emails.email as email, user_emails.email_status_name as email_status, user_organizations.organization_id as organization, user_organizations.role_name as role '
        + 'FROM ecko_user '
        + 'LEFT JOIN user_organizations '
        + 'ON ecko_user.ecko_user_id = user_organizations.ecko_user_id '
        + 'LEFT JOIN user_emails '
        + 'ON ecko_user.ecko_user_id = user_emails.ecko_user_id '
        + 'WHERE ecko_user.orcid = ?',
        {
            type: Sequelize.QueryTypes.SELECT,
            replacements: [orcid],
            model: User,
            mapToModel: true,
            raw: true,
        },
    );
    if (users.length === 0) return null;
    if (users.length > 1 && users[0].status === 'VERIFIED') {
        return users.find((user) => user.email_status === 'VERIFIED');
    }
    return users[0];
};

/**
 * Find/create user in db and create email verification token if user does not exist
 *
 * @param {string} accessToken Oauth access token
 * @param {string} refreshToken Oauth refresh token
 * @param {*} params Oauth params
 * @returns {Object} User object
 */
export const createUserIfNotExists = async (accessToken, refreshToken, params) => {
    const newUser = {
        orcid: params.orcid,
        name: params.name,
        accessToken: encryptSha256(process.env.OAUTH_TOKEN_SECRET, accessToken).toString('base64'),
        refreshToken: encryptSha256(process.env.OAUTH_TOKEN_SECRET, refreshToken).toString('base64'),
        expiresIn: params.expires_in,
        scope: params.scope,
        status: 'NOT_VERIFIED',
    };
    const existingUser = await findUser(newUser.orcid);
    if (existingUser) return existingUser;
    logInfo('A new user has signed in');
    await User.create(newUser);
    const user = await findUser(newUser.orcid);
    return user;
};

/**
 * Create token for verifying email and send verification email
 *
 * @param {string} userId User ID
 * @param {string} email Email address
 */
export const createEmailToken = async (userId, email) => {
    const expiresAt = new Date();
    expiresAt.setHours(
        expiresAt.getHours() + parseInt(process.env.EMAIL_VERIFICATION_EXPIRES_HOURS, 10),
    );
    const token = await Token.create({
        token: crypto.randomBytes(16).toString('hex'),
        type: 'VERIFY_EMAIL',
        userId,
        expiresAt,
    });
    await sendMail(email, mailSubject.verifyEmail, undefined, 'verify', token.token);
    logInfo('Confirm email notification sent');
};

/**
 * Update user email address, create verification token and send verification link
 *
 * @param {string} userId User ID
 * @param {string} email Email address
 */
export const updateUserEmail = async (userId, email) => {
    await Emails.destroy({
        where: {
            userId,
            status: 'NOT_VERIFIED',
        },
    });
    const token = await Token.findOne({
        where: {
            userId,
            type: 'VERIFY_EMAIL',
        },
    });
    if (token) await token.destroy();
    await Emails.create({
        email,
        userId,
        status: 'NOT_VERIFIED',
    });
    await createEmailToken(userId, email);
};

/**
 * Create an affiliation for the user
 *
 * @param {string} userId User ID
 * @param {string} organizationId Organization ID
 */
export const createAffiliation = async (userId, organizationId) => {
    const response = await Organizations.findOrCreate({
        where: {
            userId,
            organizationId,
        },
        defaults: {
            userId,
            organizationId,
            role: 'NONE',
        },
    });
    if (response[1]) {
        const admins = await postgres.query(
            'SELECT user_emails.email as email '
            + 'FROM user_organizations '
            + 'INNER JOIN user_emails '
            + 'ON user_organizations.ecko_user_id = user_emails.ecko_user_id '
            + 'WHERE user_organizations.organization_id = ? '
            + 'AND user_organizations.role_name = \'ADMIN\' ',
            {
                type: Sequelize.QueryTypes.SELECT,
                replacements: [organizationId],
                model: Organizations,
                mapToModel: true,
                raw: true,
            },
        );
        if (admins && admins.length > 0) {
            try {
                await sendMail(admins.map((admin) => admin.email), mailSubject.newAffiliation, undefined, 'affiliation');
            } catch (err) {
                logError('Could not send email notification to admins', err);
            }
        } else logInfo('Could not find any organization administrators to notify');
    }
};

/**
 * Set 'auth' cookie
 *
 * @param {Object} res Http response
 * @param {Object} user User object
 * @param {string} email User email address
 */
export const setAuthCookie = (res, user, email) => {
    res.cookie('auth', JSON.stringify({
        userId: user.id,
        status: user.status,
        orcid: user.orcid,
        name: user.name,
        email,
        organization: user.organization,
        role: user.role ? user.role : undefined,
    }), { sameSite: 'lax', httpOnly: false });
};
