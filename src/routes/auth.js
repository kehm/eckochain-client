import express from 'express';
import passport from 'passport';
import oauth2 from 'passport-oauth2';
import checkAPIs, { param } from 'express-validator';
import isAuthenticated from '../middleware/is-authenticated.js';
import { logError } from '../utils/logger.js';
import isValidInput from '../middleware/is-valid.js';
import {
    addEmail,
    createUserIfNotExists,
    createToken,
    findUser,
    resetProfile,
    setAuthCookie,
    verifyEmail,
} from '../services/auth.js';

const router = express.Router();
const { body } = checkAPIs;

if (process.env.NODE_ENV !== 'development') {
    const { Strategy: OAuth2Strategy } = oauth2;

    /**
     * ORCID authentication strategy
     */
    passport.use(new OAuth2Strategy({
        authorizationURL: process.env.ORCID_AUTH_URL,
        tokenURL: process.env.ORCID_TOKEN_URL,
        scope: process.env.ORCID_SCOPE,
        clientID: process.env.ORCID_CLIENT_ID,
        clientSecret: process.env.ORCID_CLIENT_SECRET,
        callbackURL: process.env.ORCID_REDIRECT_URL,
    }, async (accessToken, refreshToken, params, profile, done) => {
        try {
            const user = await createUserIfNotExists(accessToken, refreshToken, params);
            done(null, user);
        } catch (err) {
            logError('Authentication process failed', err);
        }
    }));

    /**
     * Save user object in session
     */
    passport.serializeUser((user, done) => {
        done(null, user.orcid);
    });

    /**
     * Get user object in session
     */
    passport.deserializeUser((orcid, done) => {
        findUser(orcid).then((user) => {
            done(null, user);
        }).catch((err) => logError('Could not deserialize user object', err));
    });
}

/**
 * Authenticate with ORCID
 */
router.get('/orcid', passport.authenticate('oauth2'));

/**
 * ORCID authentication callback
 */
router.get('/orcid/callback', passport.authenticate('oauth2', { failureRedirect: '/auth/error' }), (req, res) => {
    setAuthCookie(res, req.user, req.user.email);
    if (req.user.email === null) {
        res.redirect('/auth/signup');
    } else {
        res.redirect('/auth/success');
    }
});

/**
 * Verify email address
 */
router.get('/verify/:token', [
    param('token').isString().isLength({ min: 32, max: 32 }),
], isValidInput, async (req, res) => {
    try {
        const updated = await verifyEmail(req.params.token);
        if (!updated) {
            res.redirect(`${process.env.ECKO_WEB_URL}/token-expired`);
        } else if (updated.length > 0) {
            res.clearCookie(process.env.SESSION_NAME);
            res.redirect(`${process.env.ECKO_WEB_URL}/verified`);
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        logError('Could not handle token', err);
        res.sendStatus(500);
    }
});

/**
 * Add email address to user profile
 */
router.post('/profile', isAuthenticated, [
    body('email').isEmail(),
], isValidInput, async (req, res) => {
    try {
        const user = await addEmail(req.user.id, req.body.email);
        if (user) {
            if (!user.user_email || user.user_email.status !== 'VERIFIED') {
                setAuthCookie(res, req.user, req.body.email);
            }
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        logError('Could not register user', err);
        res.sendStatus(500);
    }
});

/**
 * Reset email addresses for user in session
 */
router.post('/profile/reset', isAuthenticated, async (req, res) => {
    try {
        const isUpdated = await resetProfile(req.user.id);
        if (isUpdated) {
            setAuthCookie(res, req.user);
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (err) {
        logError('Could not register user', err);
        res.sendStatus(500);
    }
});

/**
 * Check if session exists and is valid
 */
router.post('/', isAuthenticated, (req, res) => {
    setAuthCookie(res, req.user, req.user.email);
    res.sendStatus(200);
});

/**
 * Invalidate session
 */
router.post('/invalidate', isAuthenticated, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.sendStatus(500);
        } else {
            res.clearCookie(process.env.SESSION_NAME);
            res.sendStatus(200);
        }
    });
});

/**
 * Create new email verification token
 */
router.post('/token/email', isAuthenticated, async (req, res) => {
    try {
        const isCreated = await createToken(req.user.id, req.user.email);
        if (isCreated) {
            res.sendStatus(200);
        } else {
            res.sendStatus(400);
        }
    } catch (err) {
        logError('Could not create new token', err);
        res.sendStatus(500);
    }
});

export default router;
