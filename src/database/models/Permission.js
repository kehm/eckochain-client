import Sequelize from 'sequelize';
import postgres from '../../config/postgres.js';

/**
 * Define table for role permissions
 */
const Permission = postgres.define('permission', {
    name: {
        type: Sequelize.STRING(30),
        primaryKey: true,
        field: 'permission_name',
        allowNull: false,
    },
    description: {
        type: Sequelize.STRING(60),
        field: 'description',
        allowNull: true,
    },
}, {
    timestamps: false,
});

export default Permission;
