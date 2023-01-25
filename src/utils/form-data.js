import { customAlphabet } from 'nanoid';

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
export const createDatasetId = (formData) => {
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
    let latestYearCollected = '';
    if (
        formData.latestYearCollected
        && formData.latestYearCollected !== formData.earliestYearCollected
    ) {
        latestYearCollected = `${formData.latestYearCollected}-`;
    }
    let country = 'NULL';
    if (formData.countries && formData.countries.length > 0) {
        [country] = formData.countries;
    }
    return `${surveyType}-${formData.earliestYearCollected}-${latestYearCollected}${country}-${nanoid()}`;
};
