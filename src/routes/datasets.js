import express from 'express';
import checkAPIs from 'express-validator';
import { Readable } from 'stream';
import isVerified from '../middleware/is-verified.js';
import { parseFormData, createIds } from '../utils/form-data.js';
import upload from '../middleware/upload.js';
import Organization from '../database/models/Organization.js';
import { createTransient, generateKey } from '../utils/encryption.js';
import { createThumbnails, getMediaId } from '../utils/media.js';
import { logError } from '../utils/logger.js';
import removeFiles from '../utils/remove-files.js';
import { getDataset, removeDataset, submitDataset } from '../fabric/dataset.js';
import createDataset from '../utils/create-dataset.js';
import Dataset from '../database/models/Dataset.js';
import invoke from '../fabric/invoke.js';
import User from '../database/models/User.js';

const router = express.Router();
const { param, validationResult } = checkAPIs;

/**
 * Get all dataset metadata entries
 */
router.get('/metadata', async (req, res) => {
    try {
        const datasets = await Dataset.findAll({
            where: {
                status: 'ACTIVE',
            },
        });
        const parsedDatasets = [];
        datasets.forEach((element) => {
            const dataset = element.get({ plain: true });
            if (req.user && req.user.id === dataset.userId) dataset.contractStatus = 'ACCEPTED';
            delete dataset.userId;
            delete dataset.ecko_user_id;
            parsedDatasets.push(dataset);
        });
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
        const datasets = await Dataset.findAll({
            where: {
                userId: req.user.id,
                status: 'ACTIVE',
            },
        });
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
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            const organization = await Organization.findByPk(
                req.user.organization || parseInt(process.env.FABRIC_DEFAULT_ORG, 10),
            );
            if (organization) {
                const dataset = await Dataset.findOne({
                    where: { id: req.params.datasetId, status: 'ACTIVE' },
                    include: [
                        { model: User },
                    ],
                });
                if (dataset && dataset.ecko_user && dataset.status === 'ACTIVE') {
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
                } else res.sendStatus(404);
            } else res.sendStatus(500);
        } else res.status(400).json({ errors: errors.array() });
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
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            const dataset = await Dataset.findByPk(req.params.datasetId);
            const organization = await Organization.findByPk(req.user.organization);
            if (organization && dataset && dataset.status === 'ACTIVE' && dataset.metadata && dataset.policy) {
                if (dataset.userId === req.user.id) {
                    const data = parseFormData(req.body);
                    data.datasetId = dataset.id;
                    data.policyId = dataset.policy.policyId;
                    await invoke(
                        organization,
                        process.env.FABRIC_CHAINCODE_NAME,
                        'createMetadata',
                        { invokedBy: Buffer.from(req.user.id) },
                        JSON.stringify(data),
                    );
                    res.sendStatus(200);
                } else res.sendStatus(403);
            } else res.sendStatus(404);
        } else res.status(400).json({ errors: errors.array() });
    } catch (err) {
        res.sendStatus(500);
    }
});

/**
 * Submit dataset to blockchain
 * Request Body: Metadata matching JSON schema
 */
router.post('/', isVerified, upload, (req, res) => {
    const promises = [];
    if (req.files && req.files.dataset && req.files.dataset.length === 1) {
        let data = parseFormData(req.body);
        data = createIds(data);
        data.fileName = req.files.dataset[0].filename;
        data.fileType = req.files.dataset[0].mimetype;
        const key = generateKey();
        promises.push(createTransient(req, key));
        promises.push(new Promise((resolve, reject) => {
            Organization.findByPk(req.user.organization).then((organization) => {
                resolve(organization);
            }).catch((err) => {
                logError('Could not find user organization', err);
                reject(err);
            });
        }));
        if (req.files.media && req.files.media.length === 1) {
            promises.push(getMediaId(req.files.media[0].filename));
            promises.push(createThumbnails(req.files.media[0]));
        }
        Promise.all(promises).then((responses) => {
            submitDataset(data, responses[0], responses[1]).then(() => {
                createDataset(req.user, data, responses).then(() => {
                    res.sendStatus(200);
                }).catch((err) => {
                    logError('Could not create dataset entry in database', err);
                    removeFiles(req.files);
                    res.sendStatus(500);
                });
            }).catch((err) => {
                logError('Could not submit dataset to blockchain', err);
                removeFiles(req.files);
                res.sendStatus(500);
            });
        }).catch((err) => {
            logError('Could not prepare submission', err);
            removeFiles(req.files);
            res.sendStatus(500);
        });
    } else res.sendStatus(400);
});

/**
 * Delete dataset file and set metadata inactive
 */
router.delete('/:datasetId', isVerified, [
    param('datasetId').isString().isLength({ min: 1 }),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            const organization = await Organization.findByPk(req.user.organization);
            if (organization) {
                await removeDataset(req.params.datasetId, req.user.id, organization);
                res.sendStatus(200);
            } else res.sendStatus(404);
        } else res.status(400).json({ errors: errors.array() });
    } catch (err) {
        logError('Could not delete dataset file', err);
        res.sendStatus(500);
    }
});

export default router;
