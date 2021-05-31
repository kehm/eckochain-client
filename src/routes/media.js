import express from 'express';
import fs from 'fs';
import path from 'path';
import checkAPIs from 'express-validator';
import Media from '../database/models/Media.js';
import { logError } from '../utils/logger.js';
import DatasetMedia from '../database/models/DatasetMedia.js';

const router = express.Router();

const { param, validationResult } = checkAPIs;

/**
 * Get media file
 */
router.get('/:mediaId', [
    param('mediaId').isInt(),
], (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        Media.findByPk(req.params.mediaId).then((media) => {
            if (media && media.filePath) {
                if (fs.existsSync(media.filePath)) {
                    const resolvedPath = path.resolve(media.filePath);
                    res.sendFile(resolvedPath);
                } else {
                    logError('File path does not exist');
                    res.sendStatus(500);
                }
            } else res.sendStatus(404);
        }).catch(() => res.status(422).json({ error: 'Invalid argument' }));
    } else res.status(400).json({ errors: errors.array() });
});

/**
 * Get media file thumbnail
 */
router.get('/thumbnails/:mediaId', [
    param('mediaId').isInt(),
], (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        Media.findByPk(req.params.mediaId).then((media) => {
            if (media && media.thumbnailPath) {
                if (fs.existsSync(media.thumbnailPath)) {
                    const resolvedPath = path.resolve(media.thumbnailPath);
                    res.sendFile(resolvedPath);
                } else {
                    logError('File path does not exist');
                    res.sendStatus(500);
                }
            } else res.sendStatus(404);
        }).catch(() => res.status(422).json({ error: 'Invalid argument' }));
    } else res.status(400).json({ errors: errors.array() });
});

/**
 * Get public media file
 */
router.get('/public/:name', [
    param('name').isString().isLength({ min: 1 }),
], (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        const name = decodeURIComponent(req.params.name);
        if (fs.existsSync(`${process.env.PUBLIC_MEDIA_PATH}/${name}`)) {
            const resolvedPath = path.resolve(`${process.env.PUBLIC_MEDIA_PATH}/${name}`);
            res.sendFile(resolvedPath);
        } else res.status(400).json({ message: 'Path does not exist' });
    } else res.status(400).json({ errors: errors.array() });
});

/**
 * Get list of media for dataset
 */
router.get('/dataset/:datasetId', [
    param('datasetId').isString().isLength({ min: 1 }),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            const media = await DatasetMedia.findAll({
                where: {
                    datasetId: req.params.datasetId,
                },
            });
            res.status(200).json(media);
        } else res.status(400).json({ errors: errors.array() });
    } catch (err) {
        logError('Could not query dataset media', err);
        res.sendStatus(500);
    }
});

export default router;
