import Sequelize from 'sequelize';
import postgres from '../../config/postgres.js';
import Organization from './Organization.js';
import Role from './Role.js';
import User from './User.js';

/**
 * Define table for user organizations/affiliations
 */
const Organizations = postgres.define('user_organizations', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        field: 'user_organizations_id',
        autoIncrement: true,
    },
    userId: {
        type: Sequelize.UUID,
        field: 'ecko_user_id',
        allowNull: false,
        references: {
            model: User,
            key: 'ecko_user_id',
        },
    },
    organizationId: {
        type: Sequelize.INTEGER,
        field: 'organization_id',
        allowNull: false,
        references: {
            model: Organization,
            key: 'organization_id',
        },
    },
    role: {
        type: Sequelize.STRING(30),
        field: 'role_name',
        allowNull: false,
        references: {
            model: Role,
            key: 'role_name',
        },
    },
}, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

export default Organizations;
