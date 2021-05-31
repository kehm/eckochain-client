import Ajv from 'ajv';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { customAlphabet } from 'nanoid';
import { logError } from './logger.js';

/**
 * Validate with JSON schema
 *
 * @param {Object} data JSON data
 * @returns {boolean} True if validation successful
 */
export const validateJSON = (data) => {
    const schema = JSON.parse(fs.readFileSync('schema.json', 'utf-8'));
    const ajv = new Ajv.default();
    const validate = ajv.compile(schema);
    if (validate(data)) {
        return true;
    }
    logError(validate.errors);
    return false;
};

/**
 * Remove leading/trailing whitespace and newlines from input data and parse array strings to arrays
 *
 * @param {Object} data Form data
 * @returns {Object} Parsed form data object
 */
export const parseFormData = (data) => {
    const formData = { ...data };
    if (formData.description) formData.description = formData.description.replace(/^[\s\xA0]+|\r?\n|\r+|[\s\xA0]+$/g, '');
    if (formData.terms) formData.terms = formData.terms.replace(/^[\s\xA0]+|\r?\n|\r+|[\s\xA0]+$/g, '');
    if (formData.locationRemarks) formData.locationRemarks = formData.locationRemarks.replace(/^[\s\xA0]+|\r?\n|\r+|[\s\xA0]+$/g, '');
    return formData;
};

/**
 * Create dataset ID
 *
 * @param {Object} formData Form data
 * @returns {string} Dataset ID
 */
const createDatasetId = (formData) => {
    const nanoid = customAlphabet('0123456789', 6);
    let surveyType;
    switch (formData.survey) {
        case 'ORIGINAL':
            surveyType = 'OS';
            break;
        case 'RESURVEY':
            surveyType = 'RE';
            break;
        default:
            surveyType = 'CO';
            break;
    }
    return `${surveyType}-${formData.earliestYearCollected}-${formData.latestYearCollected !== undefined && formData.latestYearCollected !== formData.earliestYearCollected ? `${formData.latestYearCollected}-` : ''}${formData.countries[0]}-${nanoid()}`;
};

/**
 * Create unique IDs and names
 *
 * @param {Object} data Form data
 * @returns {Object} Form data with added IDs and names
 */
export const createIds = (data) => {
    const formData = { ...data };
    formData.datasetId = createDatasetId(formData);
    formData.policyId = uuidv4();
    return formData;
};
