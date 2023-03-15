import { v4 as uuidv4 } from 'uuid';
import { parseFormData, createDatasetId } from '../utils/form-data.js';
import Contract from '../database/models/Contract.js';
import Organization from '../database/models/Organization.js';
import { createSha256Hash, createTransient } from '../utils/encryption.js';
import Dataset from '../database/models/Dataset.js';
import DatasetMedia from '../database/models/DatasetMedia.js';
import invoke from '../utils/invoke.js';
import User from '../database/models/User.js';
import Media from '../database/models/Media.js';
import resizeImage from '../utils/resize-image.js';
import { mailSubject, sendMail } from '../utils/mailer.js';
import { logError, logInfo } from '../utils/logger.js';

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
 * Create contract entry in database
 *
 * @param {string} id Contract ID
 * @param {string} datasetId Dataset ID
 * @param {string} userId User ID
 * @param {string} policy Policy
 * @param {Object} owner Dataset owner
 */
const createContract = async (id, datasetId, userId, policy, owner) => {
    await Contract.create({
        id,
        datasetId,
        userId,
        proposal: undefined,
        status: 'ACCEPTED',
        policy,
    });
    try {
        if (owner && owner.email) {
            sendMail(owner.email, mailSubject.newDownload, undefined, 'download');
        }
    } catch (err) {
        logError('Could not send email notification', err);
    }
};

/**
 * Get dataset file/key by license or existing contract
 *
 * @param {string} datasetId Dataset ID
 * @param {string} userId User ID
 * @param {Object} organization Organization object
 * @param {Object} policy Dataset policy object
 * @param {string} owner Dataset owner user object
 * @returns {Object} The dataset file
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
        const id = createSha256Hash(userId + datasetId);
        try {
            await invoke(
                organization,
                process.env.FABRIC_CHAINCODE_NAME,
                'createContract',
                transient,
                datasetId,
                'null',
            );
        } catch (err) {
            logInfo('A contract already exists');
        }
        try {
            transient.contractId = Buffer.from(id);
            await invoke(
                organization,
                process.env.FABRIC_CHAINCODE_NAME,
                'resolveContract',
                transient,
                datasetId,
                'true',
            );
            delete transient.contractId;
            await createContract(id, datasetId, userId, policy, owner);
        } catch (err) {
            logInfo('The contract either does not exist or is already resolved');
        }
    }
    const file = await invoke(
        organization,
        process.env.FABRIC_CHAINCODE_NAME,
        'getDataset',
        transient,
        datasetId,
    );
    return file;
};

/**
 * Format contributor name for citation
 *
 * @param {string} name Contributor name
 * @returns {string} Formatted name
 */
const formatName = (name) => {
    let contributor = name;
    const parts = name.split(' ');
    if (parts.length > 1) {
        contributor = parts[parts.length - 1];
        parts.pop();
        if (parts.length > 0) {
            contributor = contributor.concat(',');
            parts.forEach((part) => {
                contributor = contributor.concat(` ${part.charAt(0)}.`);
            });
        }
    }
    return contributor;
};

/**
 * Generate a citation example
 *
 * @param {Object} user User object
 * @param {Object} data Form data
 * @returns {string} Citation example
 */
const generateExampleCitation = (user, data) => {
    const datasetLinkPath = `${process.env.WEB_URL}/datasets`;
    let nameSet = formatName(user.name);
    if (data.contributors) {
        if (data.contributors.length === 1) {
            nameSet = formatName(data.contributors[0]);
        } else if (data.contributors.length === 2) {
            nameSet = `${formatName(data.contributors[0])} & ${formatName(data.contributors[1])}`;
        } else if (data.contributors.length === 3) {
            nameSet = `${formatName(data.contributors[0])}, ${formatName(data.contributors[1])} & ${formatName(data.contributors[2])}`;
        } else if (data.contributors.length > 3) {
            nameSet = `${formatName(data.contributors[0])}, ${formatName(data.contributors[1])}, ${formatName(data.contributors[2])} et al.`;
        }
    }
    return `${nameSet} (${new Date().getFullYear()}), ${data.datasetId}, ${process.env.WEB_NAME}, ${datasetLinkPath}/${data.datasetId}`;
};

/**
 * Create dataset and dataset media entry in database
 *
 * @param {Object} user Session user object
 * @param {Object} data Data object
 * @param {Array} media Media array
 */
const createDataset = async (user, data, media) => {
    const dataset = await Dataset.create({
        id: data.datasetId,
        status: 'INACTIVE',
        bibliographicCitation: generateExampleCitation(user, data),
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
 * Submit dataset and metadata to the blockchain
 *
 * @param {Object} metadata Metadata object
 * @param {Object} policy Policy object
 * @param {Object} fileInfo File info object
 * @param {Object} transient Transient data
 * @param {Object} organization Organization object
 */
const submitDataset = async (metadata, policy, fileInfo, transient, organization) => {
    await invoke(
        organization,
        process.env.FABRIC_CHAINCODE_NAME,
        'submitDataset',
        { invokedBy: transient.invokedBy, file: transient.file },
        metadata.datasetId,
    );
    await invoke(
        organization,
        process.env.FABRIC_CHAINCODE_NAME,
        'submitMetadata',
        { invokedBy: transient.invokedBy },
        JSON.stringify(metadata),
        JSON.stringify(policy),
        JSON.stringify(fileInfo),
    );
};

/**
 * Get object with policy and file info
 *
 * @param {Object} data Data object
 * @returns {Object} Object with policy and file info
 */
const getPolicyAndFileInfo = (data) => {
    const policy = {
        policyId: data.policyId,
        license: data.license,
        terms: data.terms,
    };
    const fileInfo = {
        fileName: data.fileName,
        fileType: data.fileType,
    };
    return { policy, fileInfo };
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
    promises.push(createTransient(req));
    promises.push(Organization.findByPk(req.user.organization));
    if (req.files.media && req.files.media.length === 1) {
        promises.push(Media.findOne({
            where: { fileName: req.files.media[0].filename },
        }));
        promises.push(resizeImage(req.files.media[0], 128, 128, 90, 'thumbnail'));
    }
    const responses = await Promise.all(promises);
    const { policy, fileInfo } = getPolicyAndFileInfo(data);
    await submitDataset(data, policy, fileInfo, responses[0], responses[1]);
    await createDataset(req.user, data, responses);
};

/**
 * Update dataset metadata
 *
 * @param {Object} body Request body
 * @param {Object} dataset Dataset object
 * @param {string} userId User ID
 * @param {Object} organization Organization object
 */
export const updateMetadata = async (body, dataset, userId, organization) => {
    const data = parseFormData(body);
    data.datasetId = dataset.id;
    data.policyId = dataset.policy.policyId;
    const { policy } = getPolicyAndFileInfo(data);
    await invoke(
        organization,
        process.env.FABRIC_CHAINCODE_NAME,
        'updateMetadata',
        { invokedBy: Buffer.from(userId) },
        JSON.stringify(data),
        JSON.stringify(policy),
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
    await invoke(
        organization,
        process.env.FABRIC_CHAINCODE_NAME,
        'setDatasetRemoved',
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
