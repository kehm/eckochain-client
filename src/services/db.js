import Organization from '../database/models/Organization.js';
import { sendMail, mailSubject } from '../utils/mailer.js';

/**
 * Get all organizations
 *
 * @returns {Array} Organizations
 */
export const getOrganizations = async () => {
    const orgs = await Organization.findAll({
        attributes: ['id', 'name', 'abbreviation', 'homeUrl'],
        where: {
            status: 'ACTIVE',
        },
    });
    return orgs;
};

/**
 * Get organization by ID
 *
 * @param {string} id Organization ID
 * @returns {Object} Organization
 */
export const getOrganization = async (id) => {
    const org = await Organization.findOne({
        attributes: ['id', 'name', 'abbreviation', 'homeUrl'],
        where: {
            id,
            status: 'ACTIVE',
        },
    });
    return org;
};

/**
 * Send feedback confirmation email
 *
 * @param {string} type Feedback type
 * @param {string} email Email address
 * @param {string} message Message
 */
export const sendFeedbackConfirmation = async (type, email, message) => {
    const htmlBody = '<h1>Feedback submission</h1>'
        + '<dl>'
        + '<dt>Type: </dt>'
        + `<dd>${type}</dd>`
        + '</dl>'
        + '<dl>'
        + '<dt>Email: </dt>'
        + `<dd>${email}</dd>`
        + '</dl>'
        + '<dl>'
        + '<dt>Message: </dt>'
        + `<dd>${message}</dd>`
        + '</dl>';
    await sendMail(process.env.EMAIL_ECKO_CONTACT, mailSubject.feedback, htmlBody);
};
