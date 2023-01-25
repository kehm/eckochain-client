import postgres from '../../config/postgres.js';
import Dataset from '../models/Dataset.js';
import License from '../models/License.js';
import User from '../models/User.js';
import UserStatus from '../models/UserStatus.js';
import Emails from '../models/Emails.js';
import Organization from '../models/Organization.js';
import Organizations from '../models/Organizations.js';
import Permission from '../models/Permission.js';
import Permissions from '../models/Permissions.js';
import Role from '../models/Role.js';
import Session from '../models/Session.js';
import Token from '../models/Token.js';
import {
    defaultLicenses, defaultOrgs, defaultOrgStatus, defaultPermissions,
    defaultRoles, defaultUserStatus, defaultRolePermissions, defaultTokenTypes,
    mediaTypes, defaultDatasetStatus, defaultContractStatus, defaultEmailStatus,
} from './db-defaults.js';
import OrganizationStatus from '../models/OrganizationStatus.js';
import TokenType from '../models/TokenType.js';
import Media from '../models/Media.js';
import MediaType from '../models/MediaType.js';
import DatasetMedia from '../models/DatasetMedia.js';
import DatasetStatus from '../models/DatasetStatus.js';
import ContractStatus from '../models/ContractStatus.js';
import Contract from '../models/Contract.js';
import EmailStatus from '../models/EmailStatus.js';

/**
 * Initialize table associations
 */
const initAssociations = () => new Promise((resolve, reject) => {
    try {
        // dataset.ecko_user_id
        Dataset.belongsTo(User, {
            foreignKey: { name: 'ecko_user_id' },
        });
        User.hasOne(Dataset, {
            foreignKey: { name: 'ecko_user_id' },
        });
        // ecko_user.user_status_name
        User.belongsTo(UserStatus, {
            foreignKey: { name: 'user_status_name' },
        });
        UserStatus.hasOne(User, {
            foreignKey: { name: 'user_status_name' },
        });
        // user_emails.email_status_name
        Emails.belongsTo(EmailStatus, {
            foreignKey: { name: 'email_status_name' },
        });
        EmailStatus.hasOne(Emails, {
            foreignKey: { name: 'email_status_name' },
        });
        // user_emails.ecko_user_id
        Emails.belongsTo(User, {
            foreignKey: { name: 'ecko_user_id' },
        });
        User.hasOne(Emails, {
            foreignKey: { name: 'ecko_user_id' },
        });
        // organization
        Organization.belongsTo(OrganizationStatus, {
            foreignKey: { name: 'organization_status_name' },
        });
        OrganizationStatus.hasOne(Organization, {
            foreignKey: { name: 'organization_status_name' },
        });
        // user_organizations
        User.belongsToMany(Organization, {
            through: 'user_organizations',
            as: 'users_organizations',
            foreignKey: 'ecko_user_id',
            otherKey: 'organization_id',
        });
        Organization.belongsToMany(User, {
            through: 'user_organizations',
            as: 'organizations_users',
            foreignKey: 'organization_id',
            otherKey: 'ecko_user_id',
        });
        // media.ecko_user_id
        Media.belongsTo(User, {
            foreignKey: { name: 'ecko_user_id' },
        });
        User.hasOne(Media, {
            foreignKey: { name: 'ecko_user_id' },
        });
        // media.media_type_name
        Media.belongsTo(MediaType, {
            foreignKey: { name: 'media_type_name' },
        });
        MediaType.hasOne(Media, {
            foreignKey: { name: 'media_type_name' },
        });
        // dataset_media.media_id
        DatasetMedia.belongsTo(Media, {
            foreignKey: { name: 'media_id' },
        });
        Media.hasOne(DatasetMedia, {
            foreignKey: { name: 'media_id' },
        });
        // dataset.dataset_status_name
        Dataset.belongsTo(DatasetStatus, {
            foreignKey: { name: 'dataset_status_name' },
        });
        DatasetStatus.hasOne(Dataset, {
            foreignKey: { name: 'dataset_status_name' },
        });
        // role_permissions
        Role.belongsToMany(Permission, {
            through: 'role_permissions',
            as: 'roles_permissions',
            foreignKey: 'role_name',
            otherKey: 'permission_name',
        });
        Permission.belongsToMany(Role, {
            through: 'role_permissions',
            as: 'permissions_roles',
            foreignKey: 'permission_name',
            otherKey: 'role_name',
        });
        // contract.contract_status_name
        Contract.belongsTo(ContractStatus, {
            foreignKey: { name: 'contract_status_name' },
        });
        ContractStatus.hasOne(Contract, {
            foreignKey: { name: 'contract_status_name' },
        });
        // contract.dataset_id
        Contract.belongsTo(Dataset, {
            foreignKey: { name: 'dataset_id' },
        });
        Dataset.hasOne(Contract, {
            foreignKey: { name: 'dataset_id' },
        });
        // contract.ecko_user_id
        Contract.belongsTo(User, {
            foreignKey: { name: 'ecko_user_id' },
        });
        User.hasOne(Contract, {
            foreignKey: { name: 'ecko_user_id' },
        });
        resolve();
    } catch (err) {
        reject(err);
    }
});

/**
 * Initialize default table values
 */
const initDefaults = async () => new Promise((resolve, reject) => {
    let promises = [];
    defaultRoles.forEach((role) => {
        promises.push(Role.findOrCreate({
            where: { name: role.name },
            defaults: role,
        }));
    });
    defaultPermissions.forEach((permission) => {
        promises.push(Permission.findOrCreate({
            where: { name: permission.name },
            defaults: permission,
        }));
    });
    defaultDatasetStatus.forEach((status) => {
        promises.push(DatasetStatus.findOrCreate({
            where: { name: status.name },
            defaults: status,
        }));
    });
    defaultContractStatus.forEach((status) => {
        promises.push(ContractStatus.findOrCreate({
            where: { name: status.name },
            defaults: status,
        }));
    });
    mediaTypes.forEach((type) => {
        promises.push(MediaType.findOrCreate({
            where: { name: type.name },
            defaults: type,
        }));
    });
    defaultTokenTypes.forEach((type) => {
        promises.push(TokenType.findOrCreate({
            where: { name: type.name },
            defaults: type,
        }));
    });
    defaultUserStatus.forEach((status) => {
        promises.push(UserStatus.findOrCreate({
            where: { name: status.name },
            defaults: status,
        }));
    });
    defaultEmailStatus.forEach((status) => {
        promises.push(EmailStatus.findOrCreate({
            where: { name: status.name },
            defaults: status,
        }));
    });
    defaultOrgStatus.forEach((status) => {
        promises.push(OrganizationStatus.findOrCreate({
            where: { name: status.name },
            defaults: status,
        }));
    });
    defaultLicenses.forEach((license) => {
        promises.push(License.findOrCreate({
            where: { code: license.code },
            defaults: license,
        }));
    });
    Promise.all(promises).then(() => {
        promises = [];
        defaultOrgs.forEach((org) => {
            promises.push(Organization.findOrCreate({
                where: { mspId: org.mspId },
                defaults: org,
            }));
        });
        defaultRolePermissions.forEach((rp) => {
            promises.push(Permissions.findOrCreate({
                where: { role: rp.role, permission: rp.permission },
                defaults: rp,
            }));
        });
        Promise.all(promises).then(() => resolve()).catch((err) => reject(err));
    }).catch((err) => reject(err));
});

/**
 * Sync and populate tables
 */
const initPostgres = async () => {
    if (process.env.POSTGRES_INIT === 'true') {
        await postgres.sync({ force: process.env.POSTGRES_FORCE === 'true' });
        await initDefaults();
    }
    await initAssociations();
    postgres.query('ALTER SEQUENCE media_media_id_seq RESTART WITH 10000;');
};

export default initPostgres;
