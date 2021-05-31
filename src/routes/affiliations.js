import express from 'express';
import checkAPIs from 'express-validator';
import Sequelize from 'sequelize';
import User from '../database/models/User.js';
import isAdmin from '../middleware/is-admin.js';
import Organizations from '../database/models/Organizations.js';
import { sendMail, mailSubject } from '../utils/mailer.js';
import { logError } from '../utils/logger.js';
import postgres from '../config/postgres.js';
import isAuthenticated from '../middleware/is-authenticated.js';
import { createAffiliation } from '../utils/auth.js';
import Emails from '../database/models/Emails.js';

const router = express.Router();
const { param, body, validationResult } = checkAPIs;

/**
 * Get users that are not yet assigned a role
 */
router.get('/none', isAdmin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            const users = await postgres.query(
                'SELECT ecko_user.orcid as orcid, ecko_user.name as name, user_emails.email as email, '
                + 'user_organizations.user_organizations_id as id, user_organizations.role_name as role, user_organizations.created_at as createdat '
                + 'FROM user_organizations '
                + 'INNER JOIN ecko_user '
                + 'ON user_organizations.ecko_user_id = ecko_user.ecko_user_id '
                + 'LEFT JOIN user_emails '
                + 'ON user_organizations.ecko_user_id = user_emails.ecko_user_id '
                + 'WHERE user_organizations.organization_id = ? '
                + 'AND user_organizations.role_name = \'NONE\' ',
                {
                    type: Sequelize.QueryTypes.SELECT,
                    replacements: [req.user.organization],
                    model: Organizations,
                    mapToModel: true,
                    raw: true,
                },
            );
            res.status(200).json(users);
        } else res.status(400).json({ errors: errors.array() });
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
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            const users = await postgres.query(
                'SELECT ecko_user.orcid as orcid, ecko_user.name as name, user_emails.email as email, '
                + 'user_organizations.user_organizations_id as id, user_organizations.role_name as role, user_organizations.created_at as createdat '
                + 'FROM user_organizations '
                + 'INNER JOIN ecko_user '
                + 'ON user_organizations.ecko_user_id = ecko_user.ecko_user_id '
                + 'LEFT JOIN user_emails '
                + 'ON user_organizations.ecko_user_id = user_emails.ecko_user_id '
                + 'WHERE user_organizations.organization_id = ? '
                + 'AND user_organizations.role_name IN (\'ADMIN\', \'MEMBER\', \'MEMBER_LIMITED\', \'EXTERNAL\', \'EXTERNAL_LIMITED\') ',
                {
                    type: Sequelize.QueryTypes.SELECT,
                    replacements: [req.user.organization],
                    model: Organizations,
                    mapToModel: true,
                    raw: true,
                },
            );
            res.status(200).json(users);
        } else res.status(400).json({ errors: errors.array() });
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
        if (!['MEMBER', 'MEMBER_LIMITED', 'EXTERNAL', 'EXTERNAL_LIMITED', 'NONE'].some((element) => element === value)) throw new Error('Invalid value');
        return true;
    }),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            const affiliation = await Organizations.findByPk(req.params.organizationsId);
            if (affiliation && affiliation.role !== 'ADMIN') {
                const user = await User.findByPk(affiliation.userId, {
                    include: [
                        {
                            model: Emails,
                            where: {
                                status: 'VERIFIED',
                            },
                        },
                    ],
                });
                if (user && user.user_email) {
                    await affiliation.update({ role: req.body.role });
                    await sendMail(user.user_email.email, mailSubject.affiliationChanged, undefined, 'role');
                    res.sendStatus(200);
                } res.sendStatus(500);
            } else res.sendStatus(404);
        } else res.status(400).json({ errors: errors.array() });
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
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            await createAffiliation(req.user.id, req.body.organizationId);
            res.sendStatus(200);
        } else res.status(400).json({ errors: errors.array() });
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
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            const destroyed = await Organizations.destroy({
                where: {
                    userId: req.user.id,
                    organizationId: req.params.organizationId,
                },
            });
            if (destroyed > 0) {
                res.sendStatus(200);
            } else res.sendStatus(404);
        } else res.status(400).json({ errors: errors.array() });
    } catch (err) {
        logError('Could not delete user affiliation', err);
        res.sendStatus(500);
    }
});

/**
 * Delete user affiliation (invoked by admin)
 */
router.delete('/:organizationsId', isAdmin, [
    param('organizationsId').isInt(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            const destroyed = await Organizations.destroy({
                where: {
                    id: req.params.organizationsId,
                },
            });
            if (destroyed > 0) {
                res.sendStatus(200);
            } else res.sendStatus(404);
        } else res.status(400).json({ errors: errors.array() });
    } catch (err) {
        logError('Could not delete user affiliation', err);
        res.sendStatus(500);
    }
});

export default router;
