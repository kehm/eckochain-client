import fabricNetwork from 'fabric-network';
import yaml from 'js-yaml';
import fs from 'fs';

const { Gateway, Wallets } = fabricNetwork;

/**
 *  Invoke blockchain transaction
 *
 * @param {Object} organization Organization object
 * @param {string} chaincode Chaincode name
 * @param {string} func Function name
 * @param {Object} transient Transient data (undefined if none)
 * @param {...any} args Function arguments
 */
const invoke = async (organization, chaincode, func, transient, ...args) => {
    const connectionProfile = yaml.load(fs.readFileSync(
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
        let result;
        if (transient) {
            result = await contract.createTransaction(func).setTransient(transient).submit(...args);
        } else {
            result = await contract.submitTransaction(func, ...args);
        }
        return Promise.resolve(result);
    } catch (err) {
        return Promise.reject(err);
    } finally {
        gateway.disconnect();
    }
};

export default invoke;
