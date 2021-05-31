/**
 * Check if user has a verified email address
 */
const isVerified = (req, res, next) => {
    if (req.user && req.user.email && req.user.status === 'VERIFIED') {
        next();
    } else res.sendStatus(403);
};

export default isVerified;
