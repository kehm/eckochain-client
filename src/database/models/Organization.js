import Sequelize from 'sequelize';
import postgres from '../../config/postgres.js';
import OrganizationStatus from './OrganizationStatus.js';

/**
 * Define table for organizations
 */
const Organization = postgres.define('organization', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        field: 'organization_id',
        autoIncrement: true,
    },
    fabricName: {
        type: Sequelize.STRING(30),
        field: 'fabric_name',
        unique: true,
        allowNull: false,
    },
    mspId: {
        type: Sequelize.STRING(30),
        field: 'msp_id',
        unique: true,
        allowNull: false,
    },
    name: {
        type: Sequelize.STRING(30),
        field: 'name',
        allowNull: false,
    },
    abbreviation: {
        type: Sequelize.STRING(6),
        field: 'abbreviation',
        allowNull: true,
    },
    homeUrl: {
        type: Sequelize.STRING(60),
        field: 'home_url',
        allowNull: false,
    },
    connectionProfile: {
        type: Sequelize.STRING(60),
        field: 'connection_profile',
        allowNull: false,
    },
    clientIdentity: {
        type: Sequelize.STRING(30),
        field: 'client_identity',
        allowNull: false,
    },
    clientSecret: {
        type: Sequelize.STRING(60),
        field: 'client_secret',
        allowNull: false,
    },
    status: {
        type: Sequelize.STRING(30),
        field: 'organization_status_name',
        allowNull: false,
        references: {
            model: OrganizationStatus,
            key: 'organization_status_name',
        },
    },
    contactEmail: {
        type: Sequelize.STRING(60),
        field: 'contact_email',
        allowNull: false,
    },
}, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

export default Organization;
