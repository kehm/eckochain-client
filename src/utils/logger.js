/**
 * Print error message to log
 *
 * @param {string} message Custom message
 * @param {Object} err Error
 */
export const logError = (message, err) => {
    console.error(`${new Date().toLocaleString()} - ERROR: ${message}`);
    if (err) console.error(err);
};

/**
 * Print info message to log
 *
 * @param {string} message Custom message
 */
export const logInfo = (message) => {
    console.log(`${new Date().toLocaleString()} - INFO: ${message}`);
};
