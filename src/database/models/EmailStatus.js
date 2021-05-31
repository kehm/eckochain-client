import Sequelize from 'sequelize';
import postgres from '../../config/postgres.js';

/**
 * Define table for emai status
 */
const EmailStatus = postgres.define('email_status', {
    name: {
        type: Sequelize.STRING(30),
        primaryKey: true,
        field: 'email_status_name',
    },
    description: {
        type: Sequelize.STRING(60),
        field: 'description',
        allowNull: true,
    },
}, {
    timestamps: false,
});

export default EmailStatus;
