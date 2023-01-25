/**
 * Check if valid session
 *
 * @param {Object} req HTTP request
 * @param {Objecct} res HTTP response
 * @param {*} next Callback
 */
const isAuthenticated = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.sendStatus(403);
    }
};

export default isAuthenticated;
