import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { customAlphabet } from 'nanoid';
import Media from '../database/models/Media.js';
import { logError } from '../utils/logger.js';

// Accepted mime types
const datasetMimeTypes = new RegExp(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet|'
    + 'application/vnd.ms-excel|'
    + 'text/csv',
);
const imageMimeTypes = new RegExp(
    'image/jpeg|'
    + 'image/png',
);
// Accepted file types
const datasetTypes = /xls|xlsx|csv/;
const imageTypes = /jpg|jpeg|png/;

// Set storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let filePath;
        if (datasetMimeTypes.test(file.mimetype)) {
            filePath = process.env.DATASET_PATH;
        } else {
            filePath = process.env.MEDIA_PATH;
        }
        if (!fs.existsSync(filePath)) fs.mkdirSync(filePath, { recursive: true });
        cb(null, filePath);
    },
    filename: (req, file, cb) => { cb(null, file.customName); },
});

/**
 * Create media in database
 *
 * @param {Object} file File object
 * @param {string} userId User ID
 * @returns {string} File name
 */
const createMedia = async (file, userId) => {
    const media = await Media.create({
        type: file.mimetype,
        userId,
    });
    const fileName = `${media.id}.${media.type.split('/')[1]}`;
    await media.update({
        fileName,
        filePath: `${process.env.MEDIA_PATH}${fileName}`,
    });
    return fileName;
};

/**
 * Check if file type and mime type are valid
 *
 * @param {Object} req Http request
 * @param {Object} file File
 * @param {*} cb Callback
 */
const validateFileType = (req, file, cb) => {
    let valid = false;
    if (datasetTypes.test(path.extname(file.originalname).toLowerCase())) {
        if (datasetMimeTypes.test(file.mimetype)) {
            const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);
            file.customName = `${nanoid()}${path.extname(file.originalname)}`;
            valid = true;
        }
    } else if (imageTypes.test(path.extname(file.originalname).toLowerCase())) {
        if (imageMimeTypes.test(file.mimetype)) {
            createMedia(file, req.user.id).then((fileName) => {
                file.customName = fileName;
                valid = true;
            }).catch(() => {
                valid = false;
            });
        }
    }
    if (valid) {
        cb(null, true);
    } else {
        cb('Error: Invalid file type', false);
    }
};

// Set upload config
const config = multer({
    storage,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) },
    fileFilter: (req, file, cb) => { validateFileType(req, file, cb); },
}).fields([{ name: 'dataset', maxCount: 1 }, { name: 'media', maxCount: 1 }]);

/**
 * Save file
 */
const upload = (req, res, next) => {
    config(req, res, (err) => {
        if (err) {
            logError('Could not process file(s)', err);
            res.sendStatus(500);
        } else {
            next();
        }
    });
};

export default upload;
