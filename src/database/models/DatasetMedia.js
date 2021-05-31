import Sequelize from 'sequelize';
import postgres from '../../config/postgres.js';
import Dataset from './Dataset.js';
import Media from './Media.js';

/**
 * Define many-to-many table for dataset media
 */
const DatasetMedia = postgres.define('dataset_media', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        field: 'dataset_media_id',
        autoIncrement: true,
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
    mediaId: {
        type: Sequelize.INTEGER,
        field: 'media_id',
        allowNull: false,
        references: {
            model: Media,
            key: 'media_id',
        },
    },
}, {
    timestamps: false,
});

export default DatasetMedia;
