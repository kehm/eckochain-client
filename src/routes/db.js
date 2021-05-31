import express from 'express';
import checkAPIs from 'express-validator';
import License from '../database/models/License.js';
import Organization from '../database/models/Organization.js';
import Role from '../database/models/Role.js';
import isAdmin from '../middleware/is-admin.js';
import { logError } from '../utils/logger.js';
import { sendMail, mailSubject } from '../utils/mailer.js';

const router = express.Router();
const { param, body, validationResult } = checkAPIs;

/**
 * Get all organization entries
 */
router.get('/organizations', (req, res) => {
    Organization.findAll({
        attributes: ['id', 'name', 'abbreviation', 'homeUrl'],
        where: {
            status: 'ACTIVE',
        },
    }).then((orgs) => {
        res.status(200).json(orgs);
    }).catch(() => res.sendStatus(500));
});

/**
 * Get organization
 */
router.get('/organizations/:id', [
    param('id').isString().isLength({ min: 1 }),
], (req, res) => {
    Organization.findOne({
        attributes: ['id', 'name', 'abbreviation', 'homeUrl'],
        where: {
            id: req.params.id,
            status: 'ACTIVE',
        },
    }).then((org) => {
        if (org) {
            res.status(200).json(org);
        } else res.sendStatus(404);
    }).catch(() => res.status(422).json({ error: 'Invalid argument' }));
});

/**
 * Get all licenses entries
 */
router.get('/licenses', (req, res) => {
    License.findAll().then((licenses) => {
        res.status(200).json(licenses);
    }).catch(() => res.sendStatus(500));
});

/**
 * Get all roles
 */
router.get('/roles', isAdmin, (req, res) => {
    Role.findAll().then((roles) => {
        res.status(200).json(roles);
    }).catch(() => res.sendStatus(500));
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
], (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        const htmlBody = '<h1>Feedback submission</h1>'
            + '<dl>'
            + '<dt>Type: </dt>'
            + `<dd>${req.body.type}</dd>`
            + '</dl>'
            + '<dl>'
            + '<dt>Email: </dt>'
            + `<dd>${req.body.email}</dd>`
            + '</dl>'
            + '<dl>'
            + '<dt>Message: </dt>'
            + `<dd>${req.body.message}</dd>`
            + '</dl>';
        sendMail(process.env.EMAIL_ECKO_CONTACT, mailSubject.feedback, htmlBody).then(() => {
            res.sendStatus(200);
        }).catch(() => {
            logError('Could not send feedback notification email');
            res.sendStatus(500);
        });
    } else res.status(400).json({ errors: errors.array() });
});

export default router;
