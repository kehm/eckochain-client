import express from 'express';
import checkAPIs from 'express-validator';
import License from '../database/models/License.js';
import Role from '../database/models/Role.js';
import isAdmin from '../middleware/is-admin.js';
import isValidInput from '../middleware/is-valid.js';
import { getOrganization, getOrganizations, sendFeedbackConfirmation } from '../services/db.js';
import { logError } from '../utils/logger.js';

const router = express.Router();
const { param, body } = checkAPIs;

/**
 * Get all organization entries
 */
router.get('/organizations', async (req, res) => {
    try {
        const orgs = await getOrganizations();
        res.status(200).json(orgs);
    } catch (err) {
        res.sendStatus(500);
    }
});

/**
 * Get organization
 */
router.get('/organizations/:id', [
    param('id').isString().isLength({ min: 1 }),
], async (req, res) => {
    try {
        const org = await getOrganization(req.params.id);
        if (org) {
            res.status(200).json(org);
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        res.status(422).json({ error: 'Invalid argument' });
    }
});

/**
 * Get all licenses entries
 */
router.get('/licenses', async (req, res) => {
    try {
        const licenses = await License.findAll();
        res.status(200).json(licenses);
    } catch (err) {
        res.sendStatus(500);
    }
});

/**
 * Get all roles
 */
router.get('/roles', isAdmin, async (req, res) => {
    try {
        const roles = await Role.findAll();
        res.status(200).json(roles);
    } catch (err) {
        res.sendStatus(500);
    }
});

/**
 * Submit report
 */
router.post('/feedback', [
    body('type').custom((value) => {
        if (!['ERROR', 'SUGGESTION', 'HELP'].some((element) => element === value)) {
            throw new Error('Invalid feedback type');
        }
        return true;
    }),
    body('email').isEmail(),
    body('message').notEmpty(),
], isValidInput, async (req, res) => {
    try {
        await sendFeedbackConfirmation(
            req.body.type,
            req.body.email,
            req.body.message,
        );
        res.sendStatus(200);
    } catch (err) {
        logError('Could not send feedback notification email');
        res.sendStatus(500);
    }
});

export default router;
