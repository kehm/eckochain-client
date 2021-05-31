import fabricNetwork from 'fabric-network';
import yaml from 'js-yaml';
import fs from 'fs';

const { Gateway, Wallets } = fabricNetwork;

/**
 *  Query the blockchain
 *
 * @param {Object} organization Organization object
 * @param {string} chaincode Chaincode name
 * @param {string} func Function name
 * @param {string} queryString Query string
 */
const query = async (organization, chaincode, func, queryString) => {
    const connectionProfile = yaml.safeLoad(fs.readFileSync(
        `${process.env.CONFIG_PATH}/connection-profiles/${organization.connectionProfile}`,
        'utf8',
    ));
    const wallet = await Wallets.newFileSystemWallet(process.env.WALLET_PATH);
    const identity = await wallet.get(organization.clientIdentity);
    if (!identity) throw new Error('Identity is not in wallet');
    const gateway = new Gateway();
    try {
        await gateway.connect(connectionProfile, {
            wallet,
            identity,
            discovery: {
                asLocalhost: false,
            },
            tlsInfo: {
                certificate: fs.readFileSync(
                    `${process.env.CONFIG_PATH}/certs/${organization.clientIdentity}-tlscert.crt`,
                    'utf8',
                ),
                key: fs.readFileSync(
                    `${process.env.CONFIG_PATH}/certs/${organization.clientIdentity}-priv.key`,
                    'utf8',
                ),
            },
        });
        const network = await gateway.getNetwork(process.env.FABRIC_CHANNEL_NAME);
        const contract = network.getContract(chaincode);
        const result = await contract.evaluateTransaction(func, queryString);
        return result.toString();
    } catch (err) {
        return Promise.reject(err);
    } finally {
        gateway.disconnect();
    }
};

export default query;
