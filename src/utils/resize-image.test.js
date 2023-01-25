import resizeImage from './resize-image';

jest.mock('sharp', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        resize: jest.fn(() => ({
            jpeg: jest.fn(() => ({
                toFile: jest.fn(),
            })),
            png: jest.fn(() => ({
                toFile: jest.fn(),
            })),
        })),
    })),
}));

jest.mock('../database/models/Media.js', () => ({
    findOne: jest.fn((obj) => {
        if (obj.where.fileName === 'media123.png') {
            return {
                id: 'media123',
                fileName: 'media123.png',
                filePath: 'media/media123.png',
                thumbnailName: 'media123-thumbnail.png',
                thumbnailPath: 'media/media123-thumbnail.png',
                update: jest.fn(),
            };
        }
        if (obj.where.fileName === 'media123.jpeg') {
            return {
                id: 'media123',
                fileName: 'media123.jpeg',
                filePath: 'media/media123.jpeg',
                thumbnailName: 'media123-thumbnail.jpeg',
                thumbnailPath: 'media/media123-thumbnail.jpeg',
                update: jest.fn(),
            };
        }
        return undefined;
    }),
    update: jest.fn(),
}));

describe('call function resizeImage', () => {
    describe('with a png file', () => {
        test('should not throw error', async () => {
            const file = {
                filename: 'media123.png',
                mimetype: 'image/png',
                destination: 'media',
            };
            await expect(resizeImage(
                file,
                128,
                128,
                90,
                'thumbnail',
            )).resolves.not.toThrowError();
        });
    });
    describe('with a jpeg file', () => {
        test('should not throw error', async () => {
            const file = {
                filename: 'media123.jpeg',
                mimetype: 'image/jpeg',
                destination: 'media',
            };
            await expect(resizeImage(
                file,
                128,
                128,
                90,
                'thumbnail',
            )).resolves.not.toThrowError();
        });
    });
    describe('with an unsupported file type', () => {
        test('should throw error', async () => {
            const file = {
                filename: 'media123.png',
                mimetype: 'image/none',
                destination: 'media',
            };
            await expect(resizeImage(
                file,
                128,
                128,
                90,
                'thumbnail',
            )).rejects.toThrowError('Unsupported file type');
        });
    });
    describe('with media that does not exist', () => {
        test('should throw error', async () => {
            const file = {
                filename: 'media1234.png',
                mimetype: 'image/png',
                destination: 'media',
            };
            await expect(resizeImage(
                file,
                128,
                128,
                90,
                'thumbnail',
            )).rejects.toThrowError('Media does not exist');
        });
    });
});
