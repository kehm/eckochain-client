import Sequelize from 'sequelize';
import postgres from '../../config/postgres.js';
import EmailStatus from './EmailStatus.js';
import User from './User.js';

/**
 * Define table for user emails
 */
const Emails = postgres.define('user_emails', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        field: 'user_emails_id',
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
    email: {
        type: Sequelize.STRING(60),
        field: 'email',
        allowNull: true,
        validate: {
            isEmail: true,
        },
        unique: true,
    },
    status: {
        type: Sequelize.STRING(30),
        field: 'email_status_name',
        allowNull: false,
        references: {
            model: EmailStatus,
            key: 'email_status_name',
        },
    },
}, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

export default Emails;
