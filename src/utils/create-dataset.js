import Dataset from '../database/models/Dataset.js';
import DatasetMedia from '../database/models/DatasetMedia.js';

/**
 * Create dataset and dataset media entry in database
 *
 * @param {Object} user Session user object
 * @param {Object} data Data object
 * @param {Promise} responses Promise responses
 */
const createDataset = async (user, data, responses) => {
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
    const dataset = await Dataset.create({
        id: data.datasetId,
        status: 'INACTIVE',
        bibliographicCitation: `${lastName}${firstName || ''} ${etAl || ''}(${new Date().getFullYear()}), ${data.datasetId}, ECKO Resurvey Data Consortium, https://ecko.uib.no/datasets/${data.datasetId}`,
        geoReference: data.geoReference ? JSON.stringify(data.geoReference) : undefined,
        contributors: data.contributors,
        userId: user.id,
        metadata: data,
    });
    if (responses.length > 2) {
        await DatasetMedia.create({
            datasetId: dataset.id,
            mediaId: responses[2].id,
        });
    }
};

export default createDataset;
