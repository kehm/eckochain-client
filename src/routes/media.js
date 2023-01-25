import express from 'express';
import checkAPIs from 'express-validator';
import { logError } from '../utils/logger.js';
import isValidInput from '../middleware/is-valid.js';
import { getDatasetMedia, getMediaFile, getPublicMediaFile } from '../services/media.js';

const router = express.Router();
const { param } = checkAPIs;

/**
 * Get media file
 */
router.get('/:mediaId', [
    param('mediaId').isInt(),
], isValidInput, async (req, res) => {
    try {
        const file = await getMediaFile(req.params.mediaId, false);
        if (file) {
            res.sendFile(file);
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        if (err && err.message === 'File path does not exist') {
            logError('File path does not exist');
            res.sendStatus(500);
        } else {
            res.status(422).json({ error: 'Invalid argument' });
        }
    }
});

/**
 * Get media file thumbnail
 */
router.get('/thumbnails/:mediaId', [
    param('mediaId').isInt(),
], isValidInput, async (req, res) => {
    try {
        const file = await getMediaFile(req.params.mediaId, true);
        if (file) {
            res.sendFile(file);
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        if (err && err.message === 'File path does not exist') {
            logError('File path does not exist');
            res.sendStatus(500);
        } else {
            res.status(422).json({ error: 'Invalid argument' });
        }
    }
});

/**
 * Get public media file
 */
router.get('/public/:name', [
    param('name').isString().isLength({ min: 1 }),
], isValidInput, async (req, res) => {
    const file = await getPublicMediaFile(req.params.name);
    if (file) {
        res.sendFile(file);
    } else {
        res.status(400).json({ message: 'Path does not exist' });
    }
});

/**
 * Get list of media for dataset
 */
router.get('/dataset/:datasetId', [
    param('datasetId').isString().isLength({ min: 1 }),
], isValidInput, async (req, res) => {
    try {
        const media = await getDatasetMedia(req.params.datasetId);
        res.status(200).json(media);
    } catch (err) {
        logError('Could not query dataset media', err);
        res.sendStatus(500);
    }
});

export default router;
