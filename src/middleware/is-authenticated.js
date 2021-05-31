/**
 * Check if valid session
 */
const isAuthenticated = (req, res, next) => {
    if (req.user) {
        next();
    } else res.sendStatus(403);
};

export default isAuthenticated;
