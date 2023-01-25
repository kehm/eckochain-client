import cron from 'cron';
import Organization from '../database/models/Organization.js';
import { logError, logInfo } from './logger.js';
import Dataset from '../database/models/Dataset.js';
import query from './query.js';

/**
 * Find and update dataset metadata entry
 *
 * @param {string} value Metadata JSON
 */
const findAndUpdateMetadata = async (value) => {
    const metadata = JSON.parse(value);
    const policy = { ...metadata.policy };
    const fileInfo = { ...metadata.fileInfo };
    delete metadata.policy;
    delete metadata.fileInfo;
    delete metadata.contracts;
    const defaults = {
        id: metadata.datasetId,
        rev: metadata.modified,
        status: metadata.status,
        metadata,
        policy,
        fileInfo,
    };
    const response = await Dataset.findOrCreate({
        where: {
            id: metadata.datasetId,
        },
        defaults,
    });
    const dataset = response[0];
    const created = response[1];
    if (!created && dataset.rev !== metadata.modified) {
        await dataset.update({
            rev: metadata.modified,
            status: metadata.status,
            metadata,
            policy,
            fileInfo,
        });
    }
};

/**
 * Update dataset metadata entries in local database
 *
 * @param {Array} arr Metadata array
 */
const updateMetadata = async (arr) => {
    const promises = [];
    arr.forEach((value) => {
        promises.push(findAndUpdateMetadata(value));
    });
    await Promise.all(promises);
};

/**
 * Get metadata for datasets from state database
 *
 * @param {Object} organization Organization object
 * @param {Array} datasets Datasets (or undefined)
 */
const getMetadata = async (organization, datasets) => {
    let ids;
    if (datasets) {
        ids = `"$in": ${JSON.stringify(datasets.map((dataset) => dataset.id))}`;
    } else {
        ids = '"$gt": null';
    }
    const queryString = '{\n'
        + '   "use_index": "indexDoc/indexId",\n'
        + '   "selector": {\n'
        + '      "_id": {\n'
        + `         ${ids}\n`
        + '      }\n'
        + '   }\n'
        + '}';
    const arr = await query(organization, process.env.FABRIC_CHAINCODE_NAME, 'query', queryString);
    return JSON.parse(arr);
};

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
