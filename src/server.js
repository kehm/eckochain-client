import './config/dotenv.js';
import postgres from './config/postgres.js';
import cacheState from './utils/cache-state.js';
import initPostgres from './database/utils/init-postgres.js';
import enrollClientIdentities from './utils/enroll-client.js';
import { logError, logInfo } from './utils/logger.js';

/**
 * Run server startup procedure
 */
const start = async (app) => {
    try {
        logInfo('Starting server...');
        if (process.env.NODE_ENV !== 'development') {
            await postgres.authenticate();
            await initPostgres();
            await enrollClientIdentities();
            cacheState(); // Schedule job for caching metadata from Fabric state
        }
        app.listen(process.env.PORT || 3000, () => logInfo(`Server started on port ${process.env.PORT || 3000}`));
    } catch (err) {
        logError('Initial server setup failed', err);
    }
};

export default start;
