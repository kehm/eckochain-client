import Sequelize from 'sequelize';
import postgres from '../../config/postgres.js';
import DatasetStatus from './DatasetStatus.js';
import User from './User.js';

/**
 * Define table for datasets
 */
const Dataset = postgres.define('dataset', {
    id: {
        type: Sequelize.STRING(255),
        primaryKey: true,
        field: 'dataset_id',
    },
    rev: {
        type: Sequelize.STRING(255),
        field: 'revision',
        allowNull: true,
    },
    status: {
        type: Sequelize.STRING(30),
        field: 'dataset_status_name',
        allowNull: false,
        references: {
            model: DatasetStatus,
            key: 'dataset_status_name',
        },
    },
    bibliographicCitation: {
        type: Sequelize.TEXT,
        field: 'bibliographic_citation',
        allowNull: true,
    },
    geoReference: {
        type: Sequelize.STRING(30),
        field: 'geo_reference',
        allowNull: true,
    },
    contributors: {
        type: Sequelize.ARRAY(Sequelize.STRING(60)),
        allowNull: true,
        field: 'contributors',
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
    metadata: {
        type: Sequelize.JSONB,
        field: 'metadata',
        allowNull: true,
    },
    policy: {
        type: Sequelize.JSONB,
        field: 'policy',
        allowNull: true,
    },
    fileInfo: {
        type: Sequelize.JSONB,
        field: 'file_info',
        allowNull: true,
    },
}, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

export default Dataset;
