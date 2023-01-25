import sharp from 'sharp';
import path from 'path';
import Media from '../database/models/Media.js';

/**
 * Set media thumbnail
 *
 * @param {Object} media Media object
 * @param {string} fileName File name
 * @param {string} destination File destination
 * @param {string} extension File extension
 */
const setThumbnail = async (media, fileName, destination, extension) => {
    await media.update({
        thumbnailName: `${fileName}.${extension}`,
        thumbnailPath: `${destination}/${fileName}.${extension}`,
    });
};

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
const resizeImage = async (file, width, height, quality, newName) => {
    const name = file.filename.split('.')[0];
    const media = await Media.findOne({
        where: {
            fileName: file.filename,
        },
    });
    if (media) {
        const fileName = `${name}-${newName}`;
        switch (file.mimetype) {
            case 'image/jpeg':
                await sharp(file.path)
                    .resize(width, height)
                    .jpeg({ quality })
                    .toFile(path.resolve(file.destination, `${fileName}.jpeg`));
                await setThumbnail(media, fileName, file.destination, 'jpeg');
                break;
            case 'image/png':
                await sharp(file.path)
                    .resize(width, height)
                    .png({ quality })
                    .toFile(path.resolve(file.destination, `${fileName}.png`));
                await setThumbnail(media, fileName, file.destination, 'png');
                break;
            default:
                throw new Error('Unsupported file type');
        }
    } else {
        throw new Error('Media does not exist');
    }
};

export default resizeImage;
