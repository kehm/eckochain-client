import Sequelize from 'sequelize';
import postgres from '../../config/postgres.js';

/**
 * Define table for media types
 */
const MediaType = postgres.define('media_type', {
    name: {
        type: Sequelize.STRING(255),
        primaryKey: true,
        field: 'media_type_name',
    },
}, {
    timestamps: false,
});

export default MediaType;
