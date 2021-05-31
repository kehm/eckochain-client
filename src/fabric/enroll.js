import fabricNetwork from 'fabric-network';
import FabricCAServices from 'fabric-ca-client';
import yaml from 'js-yaml';
import fs from 'fs';
import { logInfo } from '../utils/logger.js';

const { Wallets } = fabricNetwork;

/**
 * Enroll admin with CA
 *
 * @param {Object} organization Organization object
 */
export const enrollAdmin = async (organization) => {
    const connectionProfile = yaml.safeLoad(fs.readFileSync(`${process.env.CONFIG_PATH}/connection-profiles/${organization.connectionProfile}`, 'utf8'));
    const organizationProfile = connectionProfile.organizations[organization.fabricName];
    const wallet = await Wallets.newFileSystemWallet(process.env.WALLET_PATH);
    const caInfo = connectionProfile.certificateAuthorities[
        organizationProfile.certificateAuthorities[0]
    ];
    const ca = new FabricCAServices(
        caInfo.url,
        { trustedRoots: caInfo.tlsCACerts.path, verify: caInfo.httpOptions.verify },
        caInfo.caName,
    );
    const identity = await wallet.get(caInfo.registrar[0].enrollId);
    if (identity) return;
    const enrollment = await ca.enroll({
        enrollmentID: caInfo.registrar[0].enrollId,
        enrollmentSecret: caInfo.registrar[0].enrollSecret,
    });
    const x509Identity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes(),
        },
        mspId: organizationProfile.mspid,
        type: 'X.509',
    };
    logInfo(`Enrolled ${caInfo.registrar[0].enrollId} for ${organization.fabricName}`);
    await wallet.put(caInfo.registrar[0].enrollId, x509Identity);
};

/**
 * Enroll client with CA
 *
 * @param {Object} organization Organization object
 */
export const enrollClient = async (organization) => {
    const connectionProfile = yaml.safeLoad(fs.readFileSync(`${process.env.CONFIG_PATH}/connection-profiles/${organization.connectionProfile}`, 'utf8'));
    const organizationProfile = connectionProfile.organizations[organization.fabricName];
    const wallet = await Wallets.newFileSystemWallet(process.env.WALLET_PATH);
    const identity = await wallet.get(organization.clientIdentity);
    if (identity) return;
    const caInfo = connectionProfile.certificateAuthorities[
        organizationProfile.certificateAuthorities[0]
    ];
    const ca = new FabricCAServices(
        caInfo.url,
        { trustedRoots: caInfo.tlsCACerts.path, verify: caInfo.httpOptions.verify },
        caInfo.caName,
    );
    const enrollment = await ca.enroll({
        enrollmentID: organization.clientIdentity,
        enrollmentSecret: organization.clientSecret,
    });
    const x509Identity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes(),
        },
        mspId: organizationProfile.mspid,
        type: 'X.509',
    };
    logInfo(`Enrolled ${organization.clientIdentity} for ${organization.fabricName}`);
    await wallet.put(organization.clientIdentity, x509Identity);
};
