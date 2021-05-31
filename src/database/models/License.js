import Sequelize from 'sequelize';
import postgres from '../../config/postgres.js';

/**
 * Define table for licenses
 */
const License = postgres.define('license', {
    code: {
        type: Sequelize.STRING(30),
        primaryKey: true,
        field: 'license_code',
    },
    name: {
        type: Sequelize.STRING(30),
        field: 'license_name',
        allowNull: false,
        unique: true,
    },
    description: {
        type: Sequelize.TEXT,
        field: 'description',
        allowNull: true,
    },
    url: {
        type: Sequelize.STRING(60),
        field: 'url',
        allowNull: true,
    },
    icon: {
        type: Sequelize.STRING(60),
        field: 'icon',
        allowNull: true,
    },
}, {
    timestamps: false,
});

export default License;
