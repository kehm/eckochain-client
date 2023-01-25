import fs from 'fs';
import path from 'path';
import Media from '../database/models/Media.js';
import DatasetMedia from '../database/models/DatasetMedia.js';

/**
 * Get media file
 *
 * @param {string} mediaId Media ID
 * @param {boolean} isThumbnail True if get thumbnail
 * @returns {string} Media file path
 */
export const getMediaFile = async (mediaId, isThumbnail) => {
    const media = await Media.findByPk(mediaId);
    let file;
    if (isThumbnail && media && media.thumbnailPath) {
        file = media.thumbnailPath;
    } else if (!isThumbnail && media && media.filePath) {
        file = media.filePath;
    }
    if (file) {
        if (!fs.existsSync(file)) {
            throw new Error('File path does not exist');
        }
        const resolvedPath = path.resolve(file);
        return resolvedPath;
    }
    return undefined;
};

/**
 * Get public media file
 *
 * @param {string} fileName File name
 * @returns File path
 */
export const getPublicMediaFile = async (fileName) => {
    const name = decodeURIComponent(fileName);
    if (fs.existsSync(`${process.env.PUBLIC_MEDIA_PATH}/${name}`)) {
        const resolvedPath = path.resolve(`${process.env.PUBLIC_MEDIA_PATH}/${name}`);
        return resolvedPath;
    }
    return undefined;
};

/**
 * Get media associated with the dataset
 *
 * @param {string} datasetId Dataset ID
 * @returns {Array} Media
 */
export const getDatasetMedia = async (datasetId) => {
    const media = await DatasetMedia.findAll({
        where: {
            datasetId,
        },
    });
    return media;
};
