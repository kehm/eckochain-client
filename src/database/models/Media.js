import Sequelize from 'sequelize';
import postgres from '../../config/postgres.js';
import MediaType from './MediaType.js';
import User from './User.js';

/**
 * Define table for media
 */
const Media = postgres.define('media', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        field: 'media_id',
        autoIncrement: true,
    },
    fileName: {
        type: Sequelize.STRING(255),
        field: 'file_name',
        allowNull: true,
        unique: true,
    },
    thumbnailName: {
        type: Sequelize.STRING(255),
        field: 'thumbnail_file_name',
        allowNull: true,
        unique: true,
    },
    filePath: {
        type: Sequelize.STRING(255),
        field: 'file_path',
        allowNull: true,
        unique: true,
    },
    thumbnailPath: {
        type: Sequelize.STRING(255),
        field: 'thumbnail_file_path',
        allowNull: true,
        unique: true,
    },
    type: {
        type: Sequelize.STRING(255),
        field: 'media_type_name',
        allowNull: false,
        references: {
            model: MediaType,
            key: 'media_type_name',
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
}, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

export default Media;
