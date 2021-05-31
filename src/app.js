import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import connectSessionSequelize from 'connect-session-sequelize';
import './config/dotenv.js';
import postgres from './config/postgres.js';
import contractsRoute from './routes/contracts.js';
import dbRoute from './routes/db.js';
import mediaRoute from './routes/media.js';
import authRoute from './routes/auth.js';
import affiliationsRoute from './routes/affiliations.js';
import cacheState from './fabric/cache-state.js';
import initPostgres from './database/utils/init-postgres.js';
import datasetsRoute from './routes/datasets.js';
import enrollClientIdentities from './fabric/enroll-client.js';
import { mailBody, sendMail, mailSubject } from './utils/mailer.js';
import { logError, logInfo } from './utils/logger.js';

/**
 * Application entry point
 */
const app = express();
const SequelizeStore = connectSessionSequelize(session.Store);
const store = new SequelizeStore({
    db: postgres,
    table: 'session',
    extendDefaultFields: (defaults, session) => {
        const extension = {
            data: defaults.data,
            expires: defaults.expires,
            userId: session.userId,
        };
        return extension;
    },
    checkExpirationInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL, 10),
    expiration: parseInt(process.env.SESSION_EXPIRES, 10),
});

// Initialize middleware
app.use(session({
    name: process.env.SESSION_NAME,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
    //  cookie: {
    //  maxAge: process.env.SESSION_MAX_AGE,
    //    sameSite: true,
    //  secure: true
    //}
}));
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(helmet());
app.use(passport.initialize());
app.use(passport.session());
app.use('/datasets', datasetsRoute);
app.use('/contracts', contractsRoute);
app.use('/db', dbRoute);
app.use('/media', mediaRoute);
app.use('/affiliations', affiliationsRoute);
app.use('/auth', authRoute);

/**
 * Run server startup procedure
 */
const run = async () => {
    try {
        logInfo('Starting server...');
        await postgres.authenticate();
        await initPostgres();
        await enrollClientIdentities();
        cacheState(); // Schedule job for caching metadata from Fabric state
        app.listen(process.env.PORT, () => logInfo(`Server started on port ${process.env.PORT}`));
        try {
            sendMail(process.env.EMAIL_ECKO_CONTACT, mailSubject.appRestart, mailBody.appRestart);
        } catch (err) {
            logError('Could not send email notification on app start', err);
        }
    } catch (err) {
        logError('Initial server setup failed', err);
    }
};

run();
