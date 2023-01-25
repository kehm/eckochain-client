import express from 'express';
import checkAPIs from 'express-validator';
import isAdmin from '../middleware/is-admin.js';
import Organizations from '../database/models/Organizations.js';
import { sendMail, mailSubject } from '../utils/mailer.js';
import { logError } from '../utils/logger.js';
import isAuthenticated from '../middleware/is-authenticated.js';
import isValidInput from '../middleware/is-valid.js';
import {
    createAffiliation,
    getUsersWithoutRole,
    getUsersWithRole,
    getVerifiedUser,
    removeOrganizationAffiliation,
    removeUserAffiliation,
} from '../services/affiliations.js';

const router = express.Router();
const { param, body } = checkAPIs;

/**
 * Get users that are not yet assigned a role
 */
router.get('/none', isAdmin, async (req, res) => {
    try {
        const users = await getUsersWithoutRole(req.user.organization);
        res.status(200).json(users);
    } catch (err) {
        logError('Could not query for pending user affiliations', err);
        res.sendStatus(500);
    }
});

/**
 * Get users that are already assigned a role
 */
router.get('/assigned', isAdmin, async (req, res) => {
    try {
        const users = await getUsersWithRole(req.user.organization);
        res.status(200).json(users);
    } catch (err) {
        logError('Could not query for pending user affiliations', err);
        res.sendStatus(500);
    }
});

/**
 * Change user role
 */
router.put('/role/:organizationsId', isAdmin, [
    param('organizationsId').isInt(),
    body('role').custom((value) => {
        if (![
            'MEMBER',
            'MEMBER_LIMITED',
            'EXTERNAL',
            'EXTERNAL_LIMITED',
            'NONE',
        ].some((element) => element === value)) throw new Error('Invalid value');
        return true;
    }),
], isValidInput, async (req, res) => {
    try {
        const affiliation = await Organizations.findByPk(req.params.organizationsId);
        if (affiliation && affiliation.role !== 'ADMIN') {
            const user = await getVerifiedUser(affiliation.userId);
            if (user && user.user_email) {
                await affiliation.update({ role: req.body.role });
                await sendMail(user.user_email.email, mailSubject.affiliationChanged, undefined, 'role');
                res.sendStatus(200);
            } else {
                res.sendStatus(500);
            }
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        logError('Could not change user role', err);
        res.sendStatus(500);
    }
});

/**
 * Add user affiliation
 */
router.post('/', isAuthenticated, [
    body('organizationId').isInt(),
], isValidInput, async (req, res) => {
    try {
        await createAffiliation(req.user.id, req.body.organizationId);
        res.sendStatus(200);
    } catch (err) {
        logError('Could not create user affiliation', err);
        res.sendStatus(500);
    }
});

/**
 * Delete user affiliation
 */
router.delete('/organization/:organizationId', isAuthenticated, [
    param('organizationId').isInt(),
], isValidInput, async (req, res) => {
    try {
        const removed = await removeUserAffiliation(req.user.id, req.params.organizationId);
        if (removed > 0) {
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        logError('Could not delete user affiliation', err);
        res.sendStatus(500);
    }
});

/**
 * Delete organisation affiliation (invoked by admin)
 */
router.delete('/:organizationsId', isAdmin, [
    param('organizationsId').isInt(),
], isValidInput, async (req, res) => {
    try {
        const removed = await removeOrganizationAffiliation(req.params.organizationsId);
        if (removed > 0) {
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        logError('Could not delete user affiliation', err);
        res.sendStatus(500);
    }
});

export default router;
