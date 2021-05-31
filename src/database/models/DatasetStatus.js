import Sequelize from 'sequelize';
import postgres from '../../config/postgres.js';

/**
 * Define table for dataset status
 */
const DatasetStatus = postgres.define('dataset_status', {
    name: {
        type: Sequelize.STRING(30),
        primaryKey: true,
        field: 'dataset_status_name',
    },
    description: {
        type: Sequelize.STRING(60),
        field: 'description',
        allowNull: true,
    },
}, {
    timestamps: false,
});

export default DatasetStatus;
