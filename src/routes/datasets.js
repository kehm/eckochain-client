import express from 'express';
import checkAPIs from 'express-validator';
import { Readable } from 'stream';
import isVerified from '../middleware/is-verified.js';
import upload from '../middleware/upload.js';
import Organization from '../database/models/Organization.js';
import { logError } from '../utils/logger.js';
import removeFiles from '../utils/remove-files.js';
import Dataset from '../database/models/Dataset.js';
import isValidInput from '../middleware/is-valid.js';
import {
    getDataset,
    getDatasetById,
    getDatasets,
    getUserDatasets,
    removeDataset,
    updateMetadata,
    submitDatasetAndMetadata,
} from '../services/datasets.js';

const router = express.Router();
const { param } = checkAPIs;

/**
 * Get all dataset metadata entries
 */
router.get('/metadata', async (req, res) => {
    try {
        const datasets = await getDatasets(req.user);
        res.status(200).json(datasets);
    } catch (err) {
        res.sendStatus(500);
    }
});

/**
 * Get all dataset metadata entries that belong to the user in session
 */
router.get('/metadata/user/this', isVerified, async (req, res) => {
    try {
        const datasets = await getUserDatasets(req.user.id);
        res.status(200).json(datasets);
    } catch (err) {
        res.sendStatus(500);
    }
});

/**
 * Get dataset file (requires existing contract if policy restricted)
 */
router.get('/:datasetId', isVerified, [
    param('datasetId').isString().isLength({ min: 1 }),
], isValidInput, async (req, res) => {
    try {
        const organization = await Organization.findByPk(
            req.user.organization || parseInt(process.env.FABRIC_DEFAULT_ORG, 10),
        );
        if (organization) {
            try {
                const dataset = await getDatasetById(req.params.datasetId);
                const fileBuffer = await getDataset(
                    req.params.datasetId,
                    req.user.id,
                    organization,
                    dataset.policy,
                    dataset.ecko_user,
                );
                const stream = Readable.from(fileBuffer);
                res.setHeader('content-type', 'application/octect-stream');
                res.attachment(dataset.fileInfo.fileName);
                stream.pipe(res);
            } catch (err) {
                res.sendStatus(404);
            }
        } else {
            res.sendStatus(500);
        }
    } catch (err) {
        logError('Could not get dataset file from blockchain', err);
        res.sendStatus(500);
    }
});

/**
 * Update dataset metadata
 */
router.put('/:datasetId', isVerified, upload, [
    param('datasetId').isString().isLength({ min: 1 }),
], isValidInput, async (req, res) => {
    try {
        const dataset = await Dataset.findByPk(req.params.datasetId);
        const organization = await Organization.findByPk(req.user.organization);
        if (organization && dataset && dataset.status === 'ACTIVE' && dataset.metadata && dataset.policy) {
            if (dataset.userId === req.user.id) {
                await updateMetadata(req.body, dataset, req.user.id, organization);
                res.sendStatus(200);
            } else {
                res.sendStatus(403);
            }
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        res.sendStatus(500);
    }
});

/**
 * Submit dataset to blockchain
 * Request Body: Metadata matching JSON schema
 */
router.post('/', isVerified, upload, async (req, res) => {
    if (req.files && req.files.dataset && req.files.dataset.length === 1) {
        try {
            await submitDatasetAndMetadata(req);
            removeFiles(req.files);
            res.sendStatus(200);
        } catch (err) {
            logError('Could not submit dataset', err);
            removeFiles(req.files);
            res.sendStatus(500);
        }
    } else {
        res.sendStatus(400);
    }
});

/**
 * Delete dataset file and set metadata inactive
 */
router.delete('/:datasetId', isVerified, [
    param('datasetId').isString().isLength({ min: 1 }),
], isValidInput, async (req, res) => {
    try {
        const organization = await Organization.findByPk(req.user.organization);
        if (organization) {
            await removeDataset(req.params.datasetId, req.user.id, organization);
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        logError('Could not delete dataset file', err);
        res.sendStatus(500);
    }
});

export default router;
