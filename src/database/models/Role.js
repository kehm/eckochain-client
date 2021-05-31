import Sequelize from 'sequelize';
import postgres from '../../config/postgres.js';

/**
 * Define table for user roles
 */
const Role = postgres.define('role', {
    name: {
        type: Sequelize.STRING(30),
        primaryKey: true,
        field: 'role_name',
    },
    description: {
        type: Sequelize.STRING(60),
        field: 'description',
        allowNull: true,
    },
}, {
    timestamps: false,
});

export default Role;
