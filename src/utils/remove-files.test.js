import fs from 'fs';
import { logError } from './logger';
import removeFiles from './remove-files';

const originalEnv = { ...process.env };

const error = {
    message: 'Error',
    stack: 'Stack',
};
jest.spyOn(fs, 'existsSync').mockImplementation((path) => {
    if (
        path === `${process.env.DATASET_PATH}dataset123`
        || path === `${process.env.DATASET_PATH}dataset1234`
    ) {
        return true;
    }
    if (
        path === `${process.env.MEDIA_PATH}media123.png`
        || path === `${process.env.MEDIA_PATH}media1234.png`
        || path === `${process.env.MEDIA_PATH}media12345.png`
        || path === `${process.env.MEDIA_PATH}media12345-thumbnail.png`
    ) {
        return true;
    }
    return false;
});

jest.spyOn(fs, 'unlink').mockImplementation((path, callback) => {
    if (
        path === `${process.env.DATASET_PATH}dataset1234`
        || path === `${process.env.MEDIA_PATH}media1234.png`
        || path === `${process.env.MEDIA_PATH}media12345.png`
        || path === `${process.env.MEDIA_PATH}media12345-thumbnail.png`
    ) {
        callback(error);
    } else {
        callback(null);
    }
});

jest.mock('./logger', () => ({
    logError: jest.fn(),
}));

beforeEach(() => {
    process.env.DATASET_PATH = 'datasets/';
    process.env.MEDIA_PATH = 'media/';
});

afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
});

describe('call function removeFiles', () => {
    describe('with a dataset path that does not exist', () => {
        test('should not log error', () => {
            const files = {
                dataset: [
                    { filename: 'dataset12345' },
                ],
            };
            removeFiles(files);
            expect(logError).not.toHaveBeenCalled();
        });
    });
    describe('with a dataset file that cannot be removed', () => {
        test('should log error', () => {
            const files = {
                dataset: [
                    { filename: 'dataset1234' },
                ],
            };
            removeFiles(files);
            expect(logError).toHaveBeenCalledTimes(1);
            expect(logError).toHaveBeenCalledWith('Could not remove file from disk', error);
        });
    });
    describe('with media and thumbnail files that cannot be removed', () => {
        test('should log error twice', () => {
            const files = {
                dataset: [
                    { filename: 'dataset123' },
                ],
                media: [
                    { filename: 'media12345.png' },
                ],
            };
            removeFiles(files);
            expect(logError).toHaveBeenCalledTimes(2);
            expect(logError).toHaveBeenCalledWith('Could not remove file from disk', error);
        });
    });
    describe('with dataset and media files that can be removed', () => {
        test('should not log error', () => {
            const files = {
                dataset: [
                    { filename: 'dataset123' },
                    { filename: 'dataset123' },
                ],
                media: [
                    { filename: 'media123.png' },
                ],
            };
            removeFiles(files);
            expect(logError).not.toHaveBeenCalled();
        });
    });
    describe('with an empty files object', () => {
        test('should not throw error', () => {
            expect(() => removeFiles({})).not.toThrowError();
        });
    });
});
