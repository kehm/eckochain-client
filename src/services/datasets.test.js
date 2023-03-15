import fs from 'fs';
import {
    getDataset,
    getDatasetById,
    getDatasets,
    getUserDatasets,
    removeDataset,
    updateMetadata,
    submitDatasetAndMetadata,
} from './datasets.js';

jest.mock('../database/models/Dataset.js', () => ({
    findByPk: jest.fn(() => ({
        id: 'OS-2020-2021-NO-940881',
        userId: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
        status: 'ACTIVE',
        policy: { license: 'CC' },
    })),
    findOne: jest.fn((obj) => {
        if (obj.where.id === 'OS-2020-2021-NO-940881') {
            return {
                id: 'OS-2020-2021-NO-940881',
                userId: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                status: 'ACTIVE',
                policy: { license: 'CC' },
                ecko_user: {
                    orcid: '0000-0001-2345-6789',
                },
            };
        }
        return undefined;
    }),
    findAll: jest.fn((obj) => {
        if (obj.where.userId === 'b3feccac-f4f6-48e1-b1c3-187fabf25074' || obj.where.status === 'ACTIVE') {
            return [
                {
                    get: jest.fn(() => ({
                        id: 'OS-2020-2021-NO-940881',
                        userId: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                        status: 'ACTIVE',
                        policy: { license: 'CC' },
                    })),
                },
                {
                    get: jest.fn(() => ({
                        id: 'OS-2020-2021-NO-882321',
                        userId: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                        status: 'ACTIVE',
                        policy: { license: 'CC' },
                    })),
                },
                {
                    get: jest.fn(() => ({
                        id: 'RE-2020-2021-NO-940881',
                        userId: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                        status: 'ACTIVE',
                        policy: { license: 'CC' },
                    })),
                },
            ];
        }
        return [];
    }),
    create: jest.fn(),
    update: jest.fn(),
}));

jest.mock('../database/models/Contract.js', () => ({
    findOne: jest.fn((obj) => {
        if (obj.where.datasetId === 'OS-2020-2021-NO-940881' && obj.where.userId === 'b3feccac-f4f6-48e1-b1c3-187fabf25074') {
            return {
                id: '3e4446da-146e-4565-8ff9-a1c6e96d5de7',
                datasetId: 'OS-2020-2021-NO-940881',
                userId: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                status: 'ACCEPTED',
            };
        }
        return undefined;
    }),
    create: jest.fn(),
}));

jest.mock('../database/models/Media.js', () => ({
    findOne: jest.fn(() => ({
        id: 'media123',
        fileName: 'media123.png',
        filePath: 'media/media123.png',
        thumbnailName: 'media123-thumbnail.png',
        thumbnailPath: 'media/media123-thumbnail.png',
    })),
}));

jest.mock('../database/models/DatasetMedia.js', () => ({
    create: jest.fn(),
}));

jest.mock('../utils/form-data.js', () => ({
    parseFormData: jest.fn(() => ({
        contributors: ['Jane Doe', 'John Johnson'],
        geoReference: '',
    })),
    createDatasetId: jest.fn(() => 'OS-2020-2021-NO-940881'),
}));

const error = {
    message: 'Error',
    stack: 'Stack',
};
jest.spyOn(fs, 'readFile').mockImplementation((path, callback) => {
    if (path === 'dataset/dataset.csv') {
        callback(null, Buffer.from('test'));
    } else {
        callback(error, Buffer.from('test'));
    }
});

jest.mock('../utils/invoke');

jest.mock('../utils/resize-image');

jest.mock('../utils/mailer', () => ({
    sendMail: jest.fn(),
    mailSubject: jest.requireActual(),
}));

beforeEach(() => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date(1641038400000));
});

afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
});

describe('call function getDatasets', () => {
    describe('with a user with datasets', () => {
        test('should return datasets', async () => {
            const user = {
                id: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
            };
            const datasets = await getDatasets(user);
            expect(datasets.length).toEqual(3);
        });
    });
});

describe('call function getUserDatasets', () => {
    describe('with a user with datasets', () => {
        test('should return datasets', async () => {
            const user = {
                id: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
            };
            const datasets = await getUserDatasets(user);
            expect(datasets.length).toEqual(3);
        });
    });
});

describe('call function getDatasetById', () => {
    describe('with a dataset that exists', () => {
        test('should return dataset', async () => {
            const dataset = await getDatasetById('OS-2020-2021-NO-940881');
            expect(dataset).toBeDefined();
        });
    });
    describe('with a dataset that does not exist', () => {
        test('should throw error', async () => {
            await expect(getDatasetById(
                '123',
            )).rejects.toThrowError('Could not find dataset');
        });
    });
});

describe('call function getDataset', () => {
    describe('with an existing contract', () => {
        test('should not throw error', async () => {
            const organization = {
                fabricName: 'org1',
            };
            const policy = {
                license: 'CC',
            };
            const owner = {
                id: 'd532b1aa-94a0-4925-80f6-89fdf4918808',
                email: 'test@test.com',
            };
            await expect(getDataset(
                'OS-2020-2021-NO-940881',
                'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                organization,
                policy,
                owner,
            )).resolves.not.toThrowError();
        });
    });
    describe('with a not existing contract', () => {
        test('should not throw error', async () => {
            const organization = {
                fabricName: 'org1',
            };
            const policy = {
                license: 'CC',
            };
            const owner = {
                id: 'd532b1aa-94a0-4925-80f6-89fdf4918808',
                email: 'test@test.com',
            };
            await expect(getDataset(
                'RE-2020-2021-NO-940881',
                'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                organization,
                policy,
                owner,
            )).resolves.not.toThrowError();
        });
    });
});

describe('call function submitDatasetAndMetadata', () => {
    describe('with only a first name and no media', () => {
        test('should not throw error', async () => {
            const req = {
                files: {
                    dataset: [
                        {
                            filename: 'dataset.csv',
                            path: 'dataset/dataset.csv',
                            mimetype: 'text/csv',
                        },
                    ],
                },
                user: {
                    id: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                    name: 'John',
                },
            };
            await expect(submitDatasetAndMetadata(
                req,
            )).resolves.not.toThrowError();
        });
    });
    describe('with a full name and media', () => {
        test('should throw error at dataset media create', async () => {
            const req = {
                files: {
                    dataset: [
                        {
                            filename: 'dataset.csv',
                            path: 'dataset/dataset.csv',
                            mimetype: 'text/csv',
                        },
                    ],
                    media: [
                        {
                            id: '123',
                            filename: 'media123.png',
                            mimetype: 'image/png',
                        },
                    ],
                },
                user: {
                    id: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                    name: 'John Roger Smith',
                },
            };
            await expect(submitDatasetAndMetadata(
                req,
            )).rejects.toThrowError("Cannot read properties of undefined (reading 'id')");
        });
    });
});

describe('call function updateMetadata', () => {
    describe('with valid parameters', () => {
        test('should not throw error', async () => {
            const body = {
                survey: 'ORIGINAL',
                description: 'test description ',
                terms: ' terms are here',
                locationRemarks: ' location remarks ',
            };
            const dataset = {
                id: 'OS-2020-2021-NO-940881',
                policy: { license: 'CC' },
            };
            const organization = {
                fabricName: 'org1',
            };
            await expect(updateMetadata(
                body,
                dataset,
                'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                organization,
            )).resolves.not.toThrowError();
        });
    });
});

describe('call function removeDataset', () => {
    describe('with valid parameters', () => {
        test('should not throw error', async () => {
            const organization = {
                fabricName: 'org1',
            };
            await expect(removeDataset(
                'OS-2020-2021-NO-940881',
                'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                organization,
            )).resolves.not.toThrowError();
        });
    });
});
