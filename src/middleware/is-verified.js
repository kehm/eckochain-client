/**
 * Check if user has a verified email address
 *
 * @param {Object} req HTTP request
 * @param {Objecct} res HTTP response
 * @param {*} next Callback
 */
const isVerified = (req, res, next) => {
    if (req.user && req.user.email && req.user.status === 'VERIFIED') {
        next();
    } else {
        res.sendStatus(403);
    }
};

export default isVerified;
