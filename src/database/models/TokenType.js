import Sequelize from 'sequelize';
import postgres from '../../config/postgres.js';

/**
 * Define table for token types
 */
const TokenType = postgres.define('token_type', {
    name: {
        type: Sequelize.STRING(30),
        primaryKey: true,
        field: 'token_type_name',
    },
    description: {
        type: Sequelize.STRING(60),
        field: 'description',
        allowNull: true,
    },
}, {
    timestamps: false,
});

export default TokenType;
