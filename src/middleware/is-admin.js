/**
 * Check if user is an admin (does not check for which organization)
 */
const isAdmin = (req, res, next) => {
    if (req.user && req.user.organization && req.user.role && req.user.role === 'ADMIN') {
        next();
    } else res.sendStatus(403);
};

export default isAdmin;
