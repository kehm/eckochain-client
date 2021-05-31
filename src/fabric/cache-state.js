import cron from 'cron';
import Organization from '../database/models/Organization.js';
import { getMetadata, updateMetadata } from './dataset.js';
import { logError, logInfo } from '../utils/logger.js';

/**
 * Schedule job for fetching data from Fabric to cache database
 */
const cacheState = () => new cron.CronJob(`0 */${process.env.CRON_INTERVAL_MIN} * * * *`, async () => {
    try {
        logInfo('Running state cache job...');
        const organization = await Organization.findByPk(process.env.DEFAULT_ORG_ID);
        const metadata = await getMetadata(organization);
        await updateMetadata(metadata);
        logInfo('State cache job succeeded');
    } catch (err) {
        logError('State cache job failed', err);
    }
}, null, true, process.env.CRON_TIME_ZONE, null, true);

export default cacheState;
