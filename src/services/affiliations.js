import Sequelize from 'sequelize';
import User from '../database/models/User.js';
import Organizations from '../database/models/Organizations.js';
import postgres from '../config/postgres.js';
import Emails from '../database/models/Emails.js';
import { sendMail, mailSubject } from '../utils/mailer.js';
import { logError, logInfo } from '../utils/logger.js';

/**
 * Get users that are not assigned a role
 *
 * @param {string} organization Organization ID
 * @returns {Array} Users list
 */
export const getUsersWithoutRole = async (organization) => {
    const users = await postgres.query(
        'SELECT ecko_user.orcid as orcid, ecko_user.name as name, user_emails.email as email, '
        + 'user_organizations.user_organizations_id as id, user_organizations.role_name as role, user_organizations.created_at as createdat '
        + 'FROM user_organizations '
        + 'INNER JOIN ecko_user '
        + 'ON user_organizations.ecko_user_id = ecko_user.ecko_user_id '
        + 'LEFT JOIN user_emails '
        + 'ON user_organizations.ecko_user_id = user_emails.ecko_user_id '
        + 'WHERE user_organizations.organization_id = ? '
        + 'AND user_organizations.role_name = \'NONE\' ',
        {
            type: Sequelize.QueryTypes.SELECT,
            replacements: [organization],
            model: Organizations,
            mapToModel: true,
            raw: true,
        },
    );
    return users;
};

/**
 * Get users that are already assigned a role
 *
 * @param {string} organization Organization ID
 * @returns {Array} Users list
 */
export const getUsersWithRole = async (organization) => {
    const users = await postgres.query(
        'SELECT ecko_user.orcid as orcid, ecko_user.name as name, user_emails.email as email, '
        + 'user_organizations.user_organizations_id as id, user_organizations.role_name as role, user_organizations.created_at as createdat '
        + 'FROM user_organizations '
        + 'INNER JOIN ecko_user '
        + 'ON user_organizations.ecko_user_id = ecko_user.ecko_user_id '
        + 'LEFT JOIN user_emails '
        + 'ON user_organizations.ecko_user_id = user_emails.ecko_user_id '
        + 'WHERE user_organizations.organization_id = ? '
        + 'AND user_organizations.role_name IN (\'ADMIN\', \'MEMBER\', \'MEMBER_LIMITED\', \'EXTERNAL\', \'EXTERNAL_LIMITED\') ',
        {
            type: Sequelize.QueryTypes.SELECT,
            replacements: [organization],
            model: Organizations,
            mapToModel: true,
            raw: true,
        },
    );
    return users;
};

/**
 * Get verified user by ID
 *
 * @param {string} userId User ID
 * @returns {Object} User object
 */
export const getVerifiedUser = async (userId) => {
    const user = await User.findByPk(userId, {
        include: [
            {
                model: Emails,
                where: {
                    status: 'VERIFIED',
                },
            },
        ],
    });
    return user;
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
        } else {
            logInfo('Could not find any organization administrators to notify');
        }
    }
};

/**
 * Removes user affiliation
 *
 * @param {string} userId User ID
 * @param {string} organizationId Organization ID
 */
export const removeUserAffiliation = async (userId, organizationId) => {
    const destroyed = await Organizations.destroy({
        where: {
            userId,
            organizationId,
        },
    });
    return destroyed;
};

/**
 * Removes organization affiliation
 *
 * @param {string} organizationsId Organization ID
 */
export const removeOrganizationAffiliation = async (organizationsId) => {
    const destroyed = await Organizations.destroy({
        where: {
            id: organizationsId,
        },
    });
    return destroyed;
};
