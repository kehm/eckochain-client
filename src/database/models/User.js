import Sequelize from 'sequelize';
import postgres from '../../config/postgres.js';
import UserStatus from './UserStatus.js';

/**
 * Define table for users
 */
const User = postgres.define('ecko_user', {
    id: {
        type: Sequelize.UUID,
        primaryKey: true,
        field: 'ecko_user_id',
        defaultValue: Sequelize.UUIDV4,
    },
    orcid: {
        type: Sequelize.STRING(19),
        field: 'orcid',
        allowNull: false,
        unique: true,
    },
    name: {
        type: Sequelize.STRING(60),
        field: 'name',
        allowNull: false,
    },
    accessToken: {
        type: Sequelize.STRING(255),
        field: 'access_token',
        allowNull: false,
    },
    refreshToken: {
        type: Sequelize.STRING(255),
        field: 'refresh_token',
        allowNull: false,
    },
    expiresIn: {
        type: Sequelize.INTEGER,
        field: 'expires_in',
        allowNull: false,
    },
    scope: {
        type: Sequelize.STRING(30),
        field: 'scope',
        allowNull: false,
    },
    status: {
        type: Sequelize.STRING(30),
        field: 'user_status_name',
        allowNull: false,
        references: {
            model: UserStatus,
            key: 'user_status_name',
        },
    },
}, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

export default User;
