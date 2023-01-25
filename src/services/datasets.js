import { v4 as uuidv4 } from 'uuid';
import { parseFormData, createDatasetId } from '../utils/form-data.js';
import Contract from '../database/models/Contract.js';
import Organization from '../database/models/Organization.js';
import {
    createSha256Hash,
    createTransient,
    decryptSha256,
    generateKey,
} from '../utils/encryption.js';
import Dataset from '../database/models/Dataset.js';
import DatasetMedia from '../database/models/DatasetMedia.js';
import invoke from '../utils/invoke.js';
import User from '../database/models/User.js';
import Media from '../database/models/Media.js';
import resizeImage from '../utils/resize-image.js';
import { mailSubject, sendMail } from '../utils/mailer.js';

/**
 * Get all datasets
 *
 * @param {Object} user User object
 * @returns {Array} Datasets
 */
export const getDatasets = async (user) => {
    const datasets = await Dataset.findAll({
        where: {
            status: 'ACTIVE',
        },
    });
    const parsedDatasets = [];
    datasets.forEach((element) => {
        const dataset = element.get({ plain: true });
        if (user && user.id === dataset.userId) dataset.contractStatus = 'ACCEPTED';
        delete dataset.userId;
        delete dataset.ecko_user_id;
        parsedDatasets.push(dataset);
    });
    return datasets;
};

/**
 * Get datasets owned by the user
 *
 * @param {string} userId User ID
 * @returns {Array} Datasets
 */
export const getUserDatasets = async (userId) => {
    const datasets = await Dataset.findAll({
        where: {
            userId,
            status: 'ACTIVE',
        },
    });
    return datasets;
};

/**
 * Get dataset by ID
 *
 * @param {string} datasetId Dataset ID
 * @returns {Object} Dataset
 */
export const getDatasetById = async (datasetId) => {
    const dataset = await Dataset.findOne({
        where: { id: datasetId, status: 'ACTIVE' },
        include: [{ model: User }],
    });
    if (!dataset || !dataset.ecko_user) {
        throw new Error('Could not find dataset');
    }
    return dataset;
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
 * Create dataset and dataset media entry in database
 *
 * @param {Object} user Session user object
 * @param {Object} data Data object
 * @param {Array} media Media array
 */
const createDataset = async (user, data, media) => {
    let firstName;
    let lastName = user.name;
    const parts = lastName.split(' ');
    if (parts.length > 1) {
        lastName = parts[parts.length - 1];
        parts.pop();
        firstName = `, ${parts.join(' ')}`;
    }
    let etAl;
    if (data.contributors && data.contributors.length > 1) etAl = 'et al. ';
    const consortiumName = 'ECKO Resurvey Data Consortium';
    const datasetLinkPath = 'https://ecko.uib.no/datasets';
    const dataset = await Dataset.create({
        id: data.datasetId,
        status: 'INACTIVE',
        bibliographicCitation: `${lastName}${firstName || ''} ${etAl || ''}(${new Date().getFullYear()}), ${data.datasetId}, ${consortiumName}, ${datasetLinkPath}/${data.datasetId}`,
        geoReference: data.geoReference ? JSON.stringify(data.geoReference) : undefined,
        contributors: data.contributors,
        userId: user.id,
        metadata: data,
    });
    if (media.length > 2) {
        await DatasetMedia.create({
            datasetId: dataset.id,
            mediaId: media[2].id,
        });
    }
};

/**
 * Submit dataset to the blockchain
 *
 * @param {Object} data Data object
 * @param {Object} transient Transient data
 * @param {Object} organization Organization object
 */
const submitDataset = async (data, transient, organization) => {
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
 * Submit dataset and metadata to the blockchain
 *
 * @param {Object} req Request
 */
export const submitDatasetAndMetadata = async (req) => {
    const promises = [];
    const data = parseFormData(req.body);
    data.datasetId = createDatasetId(data);
    data.policyId = uuidv4();
    data.fileName = req.files.dataset[0].filename;
    data.fileType = req.files.dataset[0].mimetype;
    const key = generateKey();
    promises.push(createTransient(req, key));
    promises.push(Organization.findByPk(req.user.organization));
    if (req.files.media && req.files.media.length === 1) {
        promises.push(Media.findOne({
            where: { fileName: req.files.media[0].filename },
        }));
        promises.push(resizeImage(req.files.media[0], 128, 128, 90, 'thumbnail'));
    }
    const responses = await Promise.all(promises);
    await submitDataset(data, responses[0], responses[1]);
    await createDataset(req.user, data, responses);
};

/**
 * Set dataset metadata
 *
 * @param {Object} body Request body
 * @param {Object} dataset Dataset object
 * @param {string} userId User ID
 * @param {Object} organization Organization object
 */
export const setMetadata = async (body, dataset, userId, organization) => {
    const data = parseFormData(body);
    data.datasetId = dataset.id;
    data.policyId = dataset.policy.policyId;
    await invoke(
        organization,
        process.env.FABRIC_CHAINCODE_NAME,
        'createMetadata',
        { invokedBy: Buffer.from(userId) },
        JSON.stringify(data),
    );
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
