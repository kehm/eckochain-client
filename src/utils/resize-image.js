import sharp from 'sharp';
import path from 'path';
import Media from '../database/models/Media.js';

/**
 * Resize image file
 *
 * @param {Object} file Image file
 * @param {number} width Width in pixels
 * @param {number} height Height in pixels
 * @param {number} quality Quality
 * @param {string} newName New file ending (to distinguish from existing file)
 * @returns {Object} Error
 */
const resizeImage = (
    file, width, height, quality, newName,
) => new Promise((resolve, reject) => {
    const name = file.filename.split('.')[0];
    Media.findOne({ where: { fileName: file.filename } }).then((media) => {
        if (media) {
            switch (file.mimetype) {
                case 'image/jpeg':
                    sharp(file.path)
                        .resize(width, height)
                        .jpeg({ quality })
                        .toFile(path.resolve(file.destination, `${name}-${newName}.jpeg`))
                        .then(() => {
                            media.update({
                                thumbnailName: `${name}-${newName}.jpeg`,
                                thumbnailPath: `${file.destination}/${name}-${newName}.jpeg`,
                            }).then(() => {
                                resolve();
                            }).catch((err) => reject(err));
                        })
                        .catch((err) => reject(err));
                    break;
                case 'image/png':
                    sharp(file.path)
                        .resize(width, height)
                        .png({ quality })
                        .toFile(path.resolve(file.destination, `${name}-${newName}.png`))
                        .then(() => {
                            media.update({
                                thumbnailName: `${name}-${newName}.png`,
                                thumbnailPath: `${file.destination}${name}-${newName}.png`,
                            }).then(() => {
                                resolve();
                            }).catch((err) => reject(err));
                        })
                        .catch((err) => reject(err));
                    break;
                default:
                    reject();
                    break;
            }
        } else reject();
    }).catch((err) => reject(err));
});

export default resizeImage;
