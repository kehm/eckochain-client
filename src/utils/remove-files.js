import fs from 'fs';
import Media from '../database/models/Media.js';
import { logError } from './logger.js';

/**
 * Delete files from storage
 *
 * @param {Array} files File array
 */
export const clearFileStorage = (files) => {
    files.forEach((element) => {
        if (fs.existsSync(process.env.DATASET_PATH + element.filename)) {
            fs.unlink(process.env.DATASET_PATH + element.filename, (err) => {
                if (err) logError(err);
            });
        }
    });
};

/**
 * Remove file from disk
 *
 * @param {string} path File path
 */
const removeFile = (path) => {
    if (fs.existsSync(path)) {
        fs.unlink(path, (err) => {
            if (err) logError('Could not remove file from disk', err);
        });
    }
};

/**
 * Remove files stored temporarily
 *
 * @param {Array} files Files to remove
 */
const removeFiles = (files) => {
    if (files && files.dataset && files.dataset.length === 1) {
        removeFile(process.env.DATASET_PATH + files.dataset[0].filename);
        if (files.media && files.media.length === 1) {
            removeFile(process.env.MEDIA_PATH + files.media[0].filename);
            const paths = files.media[0].filename.split('.');
            removeFile(`${process.env.MEDIA_PATH}${paths[0]}-thumbnail.${paths[1]}`);
            Media.destroy({
                where: { fileName: files.media[0].filename },
            }).catch((err) => logError('Could not remove media entry from database', err));
        }
    }
};

export default removeFiles;
