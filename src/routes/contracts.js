import express from 'express';
import checkAPIs from 'express-validator';
import isVerified from '../middleware/is-verified.js';
import { logError } from '../utils/logger.js';
import isValidInput from '../middleware/is-valid.js';
import {
    cancelContractProposal,
    createContractProposal,
    getDatasetContract,
    getPendingDatasetProposals,
    getPendingProposals,
    getResolvedDatasetProposals,
    resolveContractProposal,
} from '../services/contracts.js';

const router = express.Router();
const { body, param } = checkAPIs;

/**
 * Get contract for dataset
 */
router.get('/dataset/:datasetId', isVerified, [
    param('datasetId').isString().isLength({ min: 1 }),
], isValidInput, async (req, res) => {
    try {
        const contract = await getDatasetContract(req.params.datasetId, req.user.id);
        if (contract) {
            res.status(200).json(contract);
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        logError('Could not get contract for user', err);
        res.sendStatus(500);
    }
});

/**
 * Get pending proposals created by the user in session
 */
router.get('/pending/user', isVerified, async (req, res) => {
    try {
        const contracts = await getPendingProposals(req.user.id);
        res.status(200).json(contracts);
    } catch (err) {
        logError('Could not get list of pending contracts', err);
        res.sendStatus(500);
    }
});

/**
 * Get pending contracts for datasets created by this user
 */
router.get('/pending/this', isVerified, async (req, res) => {
    try {
        const contracts = await getPendingDatasetProposals(req.user.id);
        res.status(200).json(contracts);
    } catch (err) {
        logError('Could not get list of pending contracts', err);
        res.sendStatus(500);
    }
});

/**
 * Get resolved contracts for datasets created by this user
 */
router.get('/resolved/this', isVerified, async (req, res) => {
    try {
        const contracts = await getResolvedDatasetProposals(req.user.id);
        res.status(200).json(contracts);
    } catch (err) {
        logError('Could not get list of resolved contracts', err);
        res.sendStatus(500);
    }
});

/**
 * Create contract proposal
 */
router.post('/', isVerified, [
    body('datasetId').isString().isLength({ min: 1 }),
    body('proposal').isString().isLength({ min: 1 }),
], isValidInput, async (req, res) => {
    try {
        await createContractProposal(req.body, req.user);
        res.sendStatus(200);
    } catch (err) {
        logError('Could not create contract proposal', err);
        res.sendStatus(500);
    }
});

/**
 * Resolve contract
 */
router.post('/resolve', isVerified, [
    body('contractId').isString().isLength({ min: 1 }),
    body('accept').isBoolean(),
    body('response').isString().optional(),
], isValidInput, async (req, res) => {
    try {
        if (!req.body.accept && !req.body.response) {
            res.sendStatus(400);
        } else {
            await resolveContractProposal(req.body, req.user);
            res.sendStatus(200);
        }
    } catch (err) {
        logError('Could not resolve contract', err);
        res.sendStatus(500);
    }
});

/**
 * Withdraw contract proposal
 */
router.post('/withdraw', isVerified, [
    body('contractId').isString().isLength({ min: 1 }),
], isValidInput, async (req, res) => {
    try {
        await cancelContractProposal(req.body.contractId, req.user.id);
        res.sendStatus(200);
    } catch (err) {
        logError('Could not withdraw contract', err);
        res.sendStatus(500);
    }
});

export default router;
