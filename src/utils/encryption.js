import crypto from 'crypto';
import fs from 'fs';

const ALGORITHM = 'aes-256-ctr';

/**
 * Encrypt using SHA-256
 *
 * @param {string} key Secret key
 * @param {Object} buffer File buffer
 */
export const encryptSha256 = (key, buffer) => {
    key = crypto.createHash('sha256').update(key).digest('base64').substr(0, 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    return Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
};

/**
 * Decrypt SHA-256
 *
 * @param {string} key Secret key
 * @param {Object} encrypted Encrypted file
 * @returns {Object} Decrypted file buffer
 */
export const decryptSha256 = (key, encrypted) => {
    key = crypto.createHash('sha256').update(key).digest('base64').substr(0, 32);
    const iv = encrypted.slice(0, 16);
    encrypted = encrypted.slice(16);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};

/**
 * Generate secret key
 */
export const generateKey = () => crypto.randomBytes(32).toString('hex');

/**
 * Create a SHA-256 hash
 *
 * @param {string} value Value to hash
 * @returns {string} Hashed string
 */
export const createSha256Hash = (value) => crypto.createHash('sha256').update(value).digest('hex');

/**
 * Encrypt file and create transient data for Fabric
 *
 * @param {string} encryptionKey Encryption key
 * @returns {Object} Object with invokedBy, key and ecrypted file
 */
export const createTransient = (req, encryptionKey) => new Promise((resolve, reject) => {
    fs.readFile(req.files.dataset[0].path, (err, data) => {
        if (err) {
            reject(err);
        } else {
            const encryptedFile = encryptSha256(encryptionKey, Buffer.from(data));
            const invokedBy = Buffer.from(req.user.id);
            const key = Buffer.from(encryptionKey);
            resolve({ invokedBy, key, file: encryptedFile });
        }
    });
});
