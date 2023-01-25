import enrollClientIdentities from './enroll-client';

jest.mock('../database/models/Organization.js', () => ({
    findAll: jest.fn(() => ([
        {
            id: '123',
            name: 'org1',
            abbreviation: 'o1',
            homeUrl: 'https://test.com',
        },
        {
            id: '456',
            name: 'org2',
            abbreviation: 'o2',
            homeUrl: 'https://test.com',
        },
    ])),
}));

jest.mock('./enroll.js', () => ({
    enrollAdmin: jest.fn(),
    enrollClient: jest.fn(),
}));

afterEach(() => {
    jest.clearAllMocks();
});

describe('call function enrollClientIdentities', () => {
    describe('with existing organizations', () => {
        test('should not throw error', async () => {
            await expect(enrollClientIdentities()).resolves.not.toThrowError();
        });
    });
});
