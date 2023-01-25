import Organization from '../database/models/Organization.js';
import { enrollAdmin, enrollClient } from './enroll.js';

/**
 * Enroll a client identity
 *
 * @param {Object} organization Organization object
 */
const enrollClientIdentity = async (organization) => {
    await enrollAdmin(organization);
    await enrollClient(organization);
};

/**
 * Enroll client identities
 */
const enrollClientIdentities = async () => {
    const organizations = await Organization.findAll({ where: { status: 'ACTIVE' } });
    const promises = [];
    organizations.forEach((organization) => {
        promises.push(enrollClientIdentity(organization));
    });
    await Promise.all(promises);
};

export default enrollClientIdentities;
