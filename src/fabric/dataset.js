import Contract from '../database/models/Contract.js';
import Dataset from '../database/models/Dataset.js';
import { createSha256Hash, decryptSha256 } from '../utils/encryption.js';
import { mailSubject, sendMail } from '../utils/mailer.js';
import invoke from './invoke.js';
import query from './query.js';

/**
 * Submit dataset to the blockchain
 *
 * @param {Object} data Data object
 * @param {Object} transient Transient data
 * @param {Object} organization Organization object
 */
export const submitDataset = async (data, transient, organization) => {
    await invoke(
        organization,
        process.env.FABRIC_CHAINCODE_NAME,
        'putDatasetFile',
        { invokedBy: transient.invokedBy, file: transient.file },
        data.datasetId,
    );
    await invoke(
        organization,
        process.env.FABRIC_CHAINCODE_NAME,
        'putDatasetKey',
        { invokedBy: transient.invokedBy, key: transient.key },
        data.datasetId,
    );
    await invoke(
        organization,
        process.env.FABRIC_CHAINCODE_NAME,
        'createMetadata',
        { invokedBy: transient.invokedBy },
        JSON.stringify(data),
    );
};

/**
 * Get dataset file/key by license or existing contract
 *
 * @param {string} datasetId Dataset ID
 * @param {string} userId User ID
 * @param {Object} organization Organization object
 * @param {Object} policy Dataset policy object
 * @param {string} owner Dataset owner user object
 * @returns {Object} The decrypted file
 */
export const getDataset = async (datasetId, userId, organization, policy, owner) => {
    const transient = { invokedBy: Buffer.from(userId) };
    const contract = await Contract.findOne({
        where: {
            datasetId,
            userId,
            status: 'ACCEPTED',
        },
    });
    if (owner.id !== userId && !contract) {
        await invoke(
            organization,
            process.env.FABRIC_CHAINCODE_NAME,
            'createContract',
            transient,
            datasetId,
        );
        const id = createSha256Hash(userId + datasetId);
        transient.contractId = Buffer.from(id);
        await invoke(
            organization,
            process.env.FABRIC_CHAINCODE_NAME,
            'resolveContract',
            transient,
            datasetId,
            true,
        );
        await Contract.create({
            id,
            datasetId,
            userId,
            proposal: undefined,
            status: 'ACCEPTED',
            policy,
        });
        if (owner && owner.email) {
            sendMail(owner.email, mailSubject.newDownload, undefined, 'download');
        }
        delete transient.contractId;
    }
    const file = await invoke(
        organization,
        process.env.FABRIC_CHAINCODE_NAME,
        'getDatasetFile',
        transient,
        datasetId,
    );
    const key = await invoke(
        organization,
        process.env.FABRIC_CHAINCODE_NAME,
        'getDatasetKey',
        transient,
        datasetId,
    );
    return decryptSha256(key, file);
};

/**
 * Update dataset metadata entries in local database
 *
 * @param {Array} arr Metadata array
 * @returns {Object} Error
 */
export const updateMetadata = (arr) => new Promise((resolve, reject) => {
    const promises = [];
    arr.forEach((value) => {
        promises.push(new Promise((resolve, reject) => {
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
            Dataset.findOrCreate({
                where: {
                    id: metadata.datasetId,
                },
                defaults,
            }).then((response) => {
                const dataset = response[0];
                const created = response[1];
                if (!created && dataset.rev !== metadata.modified) {
                    dataset.update({
                        rev: metadata.modified,
                        status: metadata.status,
                        metadata,
                        policy,
                        fileInfo,
                    }).then(() => {
                        resolve();
                    }).catch((err) => reject(err));
                } else resolve();
            }).catch((err) => reject(err));
        }));
    });
    Promise.all(promises).then(() => resolve()).catch((err) => reject(err));
});

/**
 * Get metadata for datasets from state database
 *
 * @param {Object} organization Organization object
 * @param {Array} datasets Datasets (or undefined)
 */
export const getMetadata = async (organization, datasets) => {
    let ids;
    if (datasets) {
        ids = `"$in": ${JSON.stringify(datasets.map((dataset) => dataset.id))}`;
    } else ids = '"$gt": null';
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
 * Remove dataset file and set dataset status inactive
 *
 * @param {string} datasetId Dataset ID
 * @param {string} userId User ID
 * @param {Object} organization Organization object
 */
export const removeDataset = async (datasetId, userId, organization) => {
    const transient = { invokedBy: Buffer.from(userId) };
    await invoke(
        organization,
        process.env.FABRIC_CHAINCODE_NAME,
        'removeDataset',
        transient,
        datasetId,
    );
    await Dataset.update({
        status: 'REMOVED',
    }, {
        where: {
            id: datasetId,
        },
    });
};
