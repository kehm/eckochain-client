import Sequelize from 'sequelize';
import postgres from '../../config/postgres.js';
import TokenType from './TokenType.js';
import User from './User.js';

/**
 * Define many-to-many table for temporary tokens
 */
const Token = postgres.define('token', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        field: 'token_id',
        autoIncrement: true,
    },
    token: {
        type: Sequelize.STRING(255),
        field: 'token',
        allowNull: false,
    },
    type: {
        type: Sequelize.STRING(30),
        field: 'token_type_name',
        allowNull: false,
        references: {
            model: TokenType,
            key: 'token_type_name',
        },
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
    expiresAt: {
        type: Sequelize.DATE,
        primaryKey: true,
        field: 'expires_at',
    },
}, {
    createdAt: 'created_at',
    updatedAt: false,
});

export default Token;
