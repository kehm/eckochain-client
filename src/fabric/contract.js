import invoke from './invoke.js';
import Dataset from '../database/models/Dataset.js';
import User from '../database/models/User.js';
import Contract from '../database/models/Contract.js';
import { sendMail, mailSubject } from '../utils/mailer.js';
import { createSha256Hash } from '../utils/encryption.js';
import Emails from '../database/models/Emails.js';

/**
 * Create contract on blockchain, place in database and send email notification
 *
 * @param {string} datasetId Dataset ID
 * @param {string} proposal Contract proposal
 * @param {string} userId User ID
 * @param {Object} organization Organization object
 */
export const createContract = async (datasetId, proposal, userId, organization) => {
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
    } else throw new Error('Missing policy');
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
export const resolveContract = async (contractId, accept, response, userId, organization) => {
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
        true,
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
    } else throw Error('Could not update');
};
