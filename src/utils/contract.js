import License from '../database/models/License.js';

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

export default parseContractLicenses;
