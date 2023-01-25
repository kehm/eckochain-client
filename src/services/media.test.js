import fs from 'fs';
import { getDatasetMedia, getMediaFile, getPublicMediaFile } from './media';

const originalEnv = { ...process.env };

jest.mock('../database/models/DatasetMedia.js', () => ({
    findAll: jest.fn(() => ([
        {
            id: '1',
            datasetId: 'OS-2020-2021-NO-940881',
            mediaId: 'media1',
            filePath: 'public/media1.png',
        },
        {
            id: '2',
            datasetId: 'OS-2020-2021-NO-940881',
            mediaId: 'media2',
            filePath: 'public/media2.png',
        },
    ])),
    findByPk: jest.fn((id) => {
        if (id === 'media1') {
            return {
                id: '1',
                datasetId: 'OS-2020-2021-NO-940881',
                mediaId: 'media1',
                filePath: 'public/media1.png',
            };
        }
        return undefined;
    }),
}));

jest.mock('../database/models/Media.js', () => ({
    findByPk: jest.fn((id) => {
        if (id === 'media1') {
            return {
                id: '1',
                fileName: 'media1.png',
                filePath: 'public/media1.png',
                thumbnailName: 'media1-thumbnail.png',
                thumbnailPath: 'public/media1-thumbnail.png',
            };
        }
        if (id === 'media2') {
            return {
                id: '2',
                fileName: 'media2.png',
                filePath: 'public/media2.png',
                thumbnailName: 'media2-thumbnail.png',
                thumbnailPath: 'public/media2-thumbnail.png',
            };
        }
        return undefined;
    }),
}));

jest.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
    if (filePath === 'public/media1.png' || filePath === 'public/media1-thumbnail.png') {
        return true;
    }
    return false;
});

beforeEach(() => {
    process.env.PUBLIC_MEDIA_PATH = 'public';
});

afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
});

describe('call function getMediaFile', () => {
    describe('with existing media', () => {
        test('should return media', async () => {
            const media = await getMediaFile('media1', false);
            expect(media).toBeDefined();
        });
    });
    describe('with a file that is a thumbnail', () => {
        test('should return media', async () => {
            const media = await getMediaFile('media1', true);
            expect(media).toBeDefined();
        });
    });
    describe('with media that does not exist', () => {
        test('should return undefined', async () => {
            const media = await getMediaFile('media3', false);
            expect(media).not.toBeDefined();
        });
    });
    describe('with a file path that does not exist', () => {
        test('should return undefined', async () => {
            await expect(getMediaFile(
                'media2',
                false,
            )).rejects.toThrowError('File path does not exist');
        });
    });
});

describe('call function getPublicMediaFile', () => {
    describe('with a file that does exist', () => {
        test('should return path', async () => {
            const filePath = await getPublicMediaFile('media1.png');
            expect(filePath.includes('public/media1.png')).toBe(true);
        });
    });
    describe('with a file that does not exist', () => {
        test('should return undefined', async () => {
            const filePath = await getPublicMediaFile('not-exist.png');
            expect(filePath).not.toBeDefined();
        });
    });
});

describe('call function getDatasetMedia', () => {
    describe('with existing media', () => {
        test('should return media', async () => {
            const media = await getDatasetMedia();
            expect(media.length).toEqual(2);
        });
    });
});
