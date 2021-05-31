import Sequelize from 'sequelize';
import postgres from '../../config/postgres.js';

/**
 * Define table for contract status
 */
const ContractStatus = postgres.define('contract_status', {
    name: {
        type: Sequelize.STRING(30),
        primaryKey: true,
        field: 'contract_status_name',
    },
    description: {
        type: Sequelize.STRING(60),
        field: 'description',
        allowNull: true,
    },
}, {
    timestamps: false,
});

export default ContractStatus;
