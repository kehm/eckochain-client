import Organization from '../database/models/Organization.js';
import { enrollAdmin, enrollClient } from './enroll.js';

/**
 * Enroll client identities
 */
const enrollClientIdentities = () => new Promise((resolve, reject) => {
    Organization.findAll({ where: { status: 'ACTIVE' } }).then((organizations) => {
        const promises = [];
        organizations.forEach((organization) => {
            promises.push(new Promise((resolve, reject) => {
                enrollAdmin(organization).then(() => {
                    enrollClient(organization).then(() => resolve()).catch((err) => reject(err));
                }).catch((err) => reject(err));
            }));
        });
        Promise.all(promises).then(() => resolve()).catch((err) => reject(err));
    }).catch((err) => reject(err));
});

export default enrollClientIdentities;
