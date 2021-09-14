import { validationResult } from 'express-validator';

/**
 * Check if input is valid
 */
const isValidInput = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        next();
    } else res.status(400).json({ errors: errors.array() });
};

export default isValidInput;
