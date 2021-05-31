import Sequelize from 'sequelize';
import postgres from '../../config/postgres.js';

/**
 * Define table for user status
 */
const UserStatus = postgres.define('user_status', {
    name: {
        type: Sequelize.STRING(30),
        primaryKey: true,
        field: 'user_status_name',
    },
    description: {
        type: Sequelize.STRING(60),
        field: 'description',
        allowNull: true,
    },
}, {
    timestamps: false,
});

export default UserStatus;
