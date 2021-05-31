import Sequelize from 'sequelize';
import postgres from '../../config/postgres.js';

/**
 * Define table for organization status
 */
const OrganizationStatus = postgres.define('organization_status', {
    name: {
        type: Sequelize.STRING(30),
        primaryKey: true,
        field: 'organization_status_name',
    },
    description: {
        type: Sequelize.STRING(60),
        field: 'description',
        allowNull: true,
    },
}, {
    timestamps: false,
});

export default OrganizationStatus;
