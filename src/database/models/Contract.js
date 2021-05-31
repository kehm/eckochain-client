import Sequelize from 'sequelize';
import postgres from '../../config/postgres.js';
import Dataset from './Dataset.js';
import ContractStatus from './ContractStatus.js';
import User from './User.js';

/**
 * Define table for contracts
 */
const Contract = postgres.define('contract', {
    id: {
        type: Sequelize.STRING(255),
        primaryKey: true,
        field: 'contract_id',
    },
    datasetId: {
        type: Sequelize.STRING(255),
        field: 'dataset_id',
        allowNull: false,
        references: {
            model: Dataset,
            key: 'dataset_id',
        },
    },
    userId: {
        type: Sequelize.UUID,
        field: 'ecko_user_id',
        allowNull: true,
        references: {
            model: User,
            key: 'ecko_user_id',
        },
    },
    proposal: {
        type: Sequelize.TEXT,
        field: 'proposal',
        allowNull: true,
    },
    response: {
        type: Sequelize.TEXT,
        field: 'response',
        allowNull: true,
    },
    status: {
        type: Sequelize.STRING(30),
        field: 'contract_status_name',
        allowNull: false,
        references: {
            model: ContractStatus,
            key: 'contract_status_name',
        },
    },
    policy: {
        type: Sequelize.JSONB,
        field: 'policy',
        allowNull: true,
    },
}, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

export default Contract;
