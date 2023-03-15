import Sequelize from 'sequelize';
import Organization from '../database/models/Organization.js';
import Dataset from '../database/models/Dataset.js';
import Contract from '../database/models/Contract.js';
import License from '../database/models/License.js';
import User from '../database/models/User.js';
import Emails from '../database/models/Emails.js';
import invoke from '../utils/invoke.js';
import { sendMail, mailSubject } from '../utils/mailer.js';
import { createSha256Hash } from '../utils/encryption.js';

/**
 * Get contract by dataset ID and user ID
 *
 * @param {string} datasetId Dataset ID
 * @param {string} userId User ID
 * @returns {Object} Contract object
 */
export const getDatasetContract = async (datasetId, userId) => {
    const contract = await Contract.findOne({
        attributes: {
            exclude: ['userId'],
        },
        where: {
            datasetId,
            userId,
        },
    });
    return contract;
};

/**
 * Parse contract licenses
 *
 * @param {Array} contracts Contracts array
 * @returns {Array} Contracts array
 */
const parseContractLicenses = async (contracts) => {
    const arr = [];
    const licenses = await License.findAll();
    contracts.forEach((element) => {
        const contract = element.get({ plain: true });
        if (contract.policy && contract.policy.license) {
            const contractLicense = licenses.find(
                (license) => license.code === contract.policy.license,
            );
            if (contractLicense) contract.policy.license = contractLicense;
        }
        arr.push(contract);
    });
    return arr;
};

/**
 * Get pending proposals created by the user
 *
 * @param {string} userId User ID
 * @returns {Array} Pending contracts
 */
export const getPendingProposals = async (userId) => {
    const contracts = await Contract.findAll({
        where: {
            userId,
            status: 'PENDING',
        },
        include: [
            {
                model: User,
                attributes: ['orcid', 'name'],
                include: [
                    {
                        model: Emails,
                        attributes: ['email'],
                    },
                ],
            },
        ],
    });
    const arr = await parseContractLicenses(contracts);
    return arr;
};

/**
 * Get pending contracts for datasets created by the user
 *
 * @param {string} userId User ID
 * @returns {Array} Pending contracts
 */
export const getPendingDatasetProposals = async (userId) => {
    const datasets = await Dataset.findAll({
        where: {
            userId,
        },
    });
    const contracts = await Contract.findAll({
        where: {
            datasetId: {
                [Sequelize.Op.in]: datasets.map((dataset) => dataset.id),
            },
            status: 'PENDING',
        },
        include: [
            {
                model: User,
                attributes: ['orcid', 'name'],
                include: [
                    {
                        model: Emails,
                        attributes: ['email'],
                    },
                ],
            },
        ],
    });
    const arr = await parseContractLicenses(contracts);
    return arr;
};

/**
 * Get resolved contracts for datasets created by the user
 *
 * @param {string} userId User ID
 * @returns {Array} Pending contracts
 */
export const getResolvedDatasetProposals = async (userId) => {
    const datasets = await Dataset.findAll({
        where: {
            userId,
        },
    });
    const contracts = await Contract.findAll({
        where: {
            [Sequelize.Op.or]: [
                {
                    datasetId: {
                        [Sequelize.Op.in]: datasets.map((dataset) => dataset.id),
                    },
                }, {
                    userId,
                },
            ],
            status: { [Sequelize.Op.or]: ['ACCEPTED', 'REJECTED'] },
        },
        include: [
            {
                model: User,
                attributes: ['orcid', 'name'],
                include: [
                    {
                        model: Emails,
                        attributes: ['email'],
                    },
                ],
            },
        ],
    });
    const arr = await parseContractLicenses(contracts);
    return arr;
};

/**
 * Create contract on blockchain, place in database and send email notification
 *
 * @param {string} datasetId Dataset ID
 * @param {string} proposal Contract proposal
 * @param {string} userId User ID
 * @param {Object} organization Organization object
 */
const createContract = async (datasetId, proposal, userId, organization) => {
    const transient = { invokedBy: Buffer.from(userId) };
    const id = createSha256Hash(userId + datasetId);
    const dataset = await Dataset.findByPk(
        datasetId,
        {
            include: [
                {
                    model: User,
                    include: [
                        {
                            model: Emails,
                            where: {
                                status: 'VERIFIED',
                            },
                        },
                    ],
                },
            ],
        },
    );
    if (dataset && dataset.policy) {
        await invoke(
            organization,
            process.env.FABRIC_CHAINCODE_NAME,
            'createContract',
            transient,
            datasetId,
            proposal,
        );
        const [contract, created] = await Contract.findOrCreate({
            where: {
                id,
            },
            defaults: {
                id,
                datasetId,
                userId,
                proposal,
                status: 'PENDING',
                policy: dataset.policy,
            },
        });
        if (!created) {
            await contract.update({
                datasetId,
                userId,
                proposal,
                status: 'PENDING',
                policy: dataset.policy,
            });
        }
        if (dataset.ecko_user && dataset.ecko_user.user_email) {
            sendMail(dataset.ecko_user.user_email.email, mailSubject.newProposal, undefined, 'proposal');
        }
    } else {
        throw new Error('Missing policy');
    }
};

/**
 * Create contract proposal
 *
 * @param {Object} body Request body
 * @param {Object} user Request user
 */
export const createContractProposal = async (body, user) => {
    const organization = await Organization.findByPk(
        user.organization || parseInt(process.env.FABRIC_DEFAULT_ORG, 10),
    );
    await createContract(
        body.datasetId,
        body.proposal,
        user.id,
        organization,
    );
};

/**
 * Resolve contract
 *
 * @param {string} contractId Contract ID
 * @param {boolean} accept True if accept, false if reject
 * @param {string} response Proposal response
 * @param {string} userId Resolver's user ID
 * @param {Object} organization Organization object
 */
const resolveContract = async (contractId, accept, response, userId, organization) => {
    const contract = await Contract.findByPk(
        contractId,
        {
            include: [
                {
                    model: User,
                    include: [
                        {
                            model: Emails,
                            where: {
                                status: 'VERIFIED',
                            },
                        },
                    ],
                },
            ],
        },
    );
    const transient = {
        invokedBy: Buffer.from(userId),
        contractId: Buffer.from(createSha256Hash(contract.userId + contract.datasetId)),
    };
    await invoke(
        organization,
        process.env.FABRIC_CHAINCODE_NAME,
        'resolveContract',
        transient,
        contract.datasetId,
        'true',
    );
    const updated = await Contract.update({
        status: accept ? 'ACCEPTED' : 'REJECTED',
        response,
    }, {
        where: {
            id: contractId,
            status: 'PENDING',
        },
    });
    if (updated.length > 0) {
        if (contract.ecko_user && contract.ecko_user.user_email) {
            if (accept) {
                sendMail(contract.ecko_user.user_email.email, mailSubject.contractAccepted, undefined, 'accepted');
            } else {
                sendMail(contract.ecko_user.user_email.email, mailSubject.contractRejected, undefined, 'rejected');
            }
        }
    } else {
        throw Error('Could not update');
    }
};

/**
 * Resolve contract proposal
 *
 * @param {Object} body Request body
 * @param {Object} user Request user
 */
export const resolveContractProposal = async (body, user) => {
    const organization = await Organization.findByPk(
        user.organization || parseInt(process.env.FABRIC_DEFAULT_ORG, 10),
    );
    await resolveContract(
        body.contractId,
        body.accept,
        body.response,
        user.id,
        organization,
    );
};

/**
 * Mark contract proposal as cancelled
 *
 * @param {string} contractId Contract ID
 * @param {string} userId User ID
 */
export const cancelContractProposal = async (contractId, userId) => {
    await Contract.update({
        status: 'CANCELLED',
    }, {
        where: {
            id: contractId,
            userId,
        },
    });
};
