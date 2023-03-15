import crypto from 'crypto';
import Sequelize from 'sequelize';
import User from '../database/models/User.js';
import { logInfo } from '../utils/logger.js';
import Emails from '../database/models/Emails.js';
import Token from '../database/models/Token.js';
import { mailSubject, sendMail } from '../utils/mailer.js';
import postgres from '../config/postgres.js';
import { encryptSha256 } from '../utils/encryption.js';

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
 * @param {Object} params Oauth params
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
 * Verify email address
 *
 * @param {string} tokenId Token
 * @returns {Array} Updated results
 */
export const verifyEmail = async (tokenId) => {
    const token = await Token.findOne({
        where: {
            token: tokenId,
            type: 'VERIFY_EMAIL',
        },
    });
    if (token) {
        if (Date.parse(new Date()) < Date.parse(token.expiresAt)) {
            const email = await Emails.findOne({
                where: {
                    userId: token.userId,
                    status: 'VERIFIED',
                },
            });
            if (email) await email.destroy();
            const updated = await Emails.update({
                status: 'VERIFIED',
            }, {
                where: {
                    userId: token.userId,
                    status: 'NOT_VERIFIED',
                },
            });
            if (updated.length > 0) {
                await User.update({
                    status: 'VERIFIED',
                }, {
                    where: {
                        id: token.userId,
                        status: 'NOT_VERIFIED',
                    },
                });
                await token.destroy();
            }
            return updated;
        }
    }
    return undefined;
};

/**
 * Resets email address for the user
 *
 * @param {string} userId User ID
 * @returns {boolean} True if updated profile
 */
export const resetProfile = async (userId) => {
    const updated = await User.update({
        email: null,
    }, {
        where: {
            id: userId,
            status: 'NOT_VERIFIED',
        },
    });
    if (updated.length > 0) {
        await Emails.destroy({
            where: {
                userId,
            },
        });
        await Token.destroy({
            where: {
                userId,
                type: 'VERIFY_EMAIL',
            },
        });
        return true;
    }
    return false;
};

/**
 * Create token for verifying email and send verification email
 *
 * @param {string} userId User ID
 * @param {string} email Email address
 */
const createEmailToken = async (userId, email) => {
    const expiresAt = new Date();
    expiresAt.setHours(
        expiresAt.getHours() + parseInt(process.env.VERIFICATION_EXPIRES_HOURS, 10),
    );
    const token = await Token.create({
        token: crypto.randomBytes(16).toString('hex'),
        type: 'VERIFY_EMAIL',
        userId,
        expiresAt,
    });
    await sendMail(email, mailSubject.verifyEmail, undefined, 'verify', token.token);
    logInfo('Email notification sent');
};

/**
 * Create email verification token
 *
 * @param {string} userId User ID
 * @param {string} email Email address
 * @returns True if created
 */
export const createToken = async (userId, email) => {
    const emails = await Emails.findAll({
        where: {
            userId,
            status: 'NOT_VERIFIED',
        },
    });
    if (emails.length === 1) {
        const tokens = await Token.findAll({
            where: {
                userId,
                type: 'VERIFY_EMAIL',
            },
        });
        if (tokens.length < 10) {
            await createEmailToken(userId, email);
            return true;
        }
    }
    return false;
};

/**
 * Update user email address, create verification token and send verification link
 *
 * @param {string} userId User ID
 * @param {string} email Email address
 */
const updateUserEmail = async (userId, email) => {
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
 * Add email address to user profile
 *
 * @param {string} userId User ID
 * @param {string} email Email address
 * @returns {Object} User object
 */
export const addEmail = async (userId, email) => {
    const user = await User.findByPk(userId, {
        include: [{ model: Emails }],
    });
    if (user) {
        await updateUserEmail(userId, email);
    }
    return user;
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
        role: user.role,
    }), { sameSite: 'lax', httpOnly: false });
};
