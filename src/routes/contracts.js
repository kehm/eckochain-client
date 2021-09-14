import express from 'express';
import checkAPIs from 'express-validator';
import Sequelize from 'sequelize';
import Organization from '../database/models/Organization.js';
import Dataset from '../database/models/Dataset.js';
import isVerified from '../middleware/is-verified.js';
import Contract from '../database/models/Contract.js';
import { logError } from '../utils/logger.js';
import { createContract, resolveContract } from '../fabric/contract.js';
import User from '../database/models/User.js';
import parseContractLicenses from '../utils/contract.js';
import Emails from '../database/models/Emails.js';
import isValidInput from '../middleware/is-valid.js';

const router = express.Router();
const { body, param } = checkAPIs;

/**
 * Get contract for dataset
 */
router.get('/dataset/:datasetId', isVerified, [
    param('datasetId').isString().isLength({ min: 1 }),
], isValidInput, async (req, res) => {
    try {
        const contract = await Contract.findOne({
            attributes: {
                exclude: ['userId'],
            },
            where: {
                datasetId: req.params.datasetId,
                userId: req.user.id,
            },
        });
        if (contract) {
            res.status(200).json(contract);
        } else res.sendStatus(404);
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
        const contracts = await Contract.findAll({
            where: {
                userId: req.user.id,
                status: 'PENDING',
            },
            include: [
                {
                    model: User,
                    attributes: ['orcid', 'name'],
                    include: [
                        {
                            model: Emails,
                            attributes: ['email'],
                        },
                    ],
                },
            ],
        });
        const arr = await parseContractLicenses(contracts);
        res.status(200).json(arr);
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
        const datasets = await Dataset.findAll({
            where: {
                userId: req.user.id,
            },
        });
        const contracts = await Contract.findAll({
            where: {
                datasetId: {
                    [Sequelize.Op.in]: datasets.map((dataset) => dataset.id),
                },
                status: 'PENDING',
            },
            include: [
                {
                    model: User,
                    attributes: ['orcid', 'name'],
                    include: [
                        {
                            model: Emails,
                            attributes: ['email'],
                        },
                    ],
                },
            ],
        });
        const arr = await parseContractLicenses(contracts);
        res.status(200).json(arr);
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
        const datasets = await Dataset.findAll({
            where: {
                userId: req.user.id,
            },
        });
        const contracts = await Contract.findAll({
            where: {
                [Sequelize.Op.or]: [
                    {
                        datasetId: {
                            [Sequelize.Op.in]: datasets.map((dataset) => dataset.id),
                        },
                    }, {
                        userId: req.user.id,
                    },
                ],
                status: { [Sequelize.Op.or]: ['ACCEPTED', 'REJECTED'] },
            },
            include: [
                {
                    model: User,
                    attributes: ['orcid', 'name'],
                    include: [
                        {
                            model: Emails,
                            attributes: ['email'],
                        },
                    ],
                },
            ],
        });
        const arr = await parseContractLicenses(contracts);
        res.status(200).json(arr);
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
        const organization = await Organization.findByPk(
            req.user.organization || parseInt(process.env.FABRIC_DEFAULT_ORG, 10),
        );
        await createContract(
            req.body.datasetId,
            req.body.proposal,
            req.user.id,
            organization,
        );
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
            const organization = await Organization.findByPk(
                req.user.organization || parseInt(process.env.FABRIC_DEFAULT_ORG, 10),
            );
            await resolveContract(
                req.body.contractId,
                req.body.accept,
                req.body.response,
                req.user.id,
                organization,
            );
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
        await Contract.update({
            status: 'CANCELLED',
        }, {
            where: {
                id: req.body.contractId,
                userId: req.user.id,
            },
        });
        res.sendStatus(200);
    } catch (err) {
        logError('Could not withdraw contract', err);
        res.sendStatus(500);
    }
});

export default router;
