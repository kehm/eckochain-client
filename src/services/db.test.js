import { getOrganization, getOrganizations, sendFeedbackConfirmation } from './db';

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
    findOne: jest.fn((obj) => {
        if (obj.where.id === '123') {
            return {
                id: '123',
                name: 'org1',
                abbreviation: 'o1',
                homeUrl: 'https://test.com',
            };
        }
        return undefined;
    }),
}));

jest.mock('../utils/mailer', () => ({
    sendMail: jest.fn(),
    mailSubject: jest.requireActual(),
}));

afterEach(() => {
    jest.clearAllMocks();
});

describe('call function getOrganizations', () => {
    describe('with existing organizations', () => {
        test('should return organizations', async () => {
            const orgs = await getOrganizations();
            expect(orgs.length).toEqual(2);
        });
    });
});

describe('call function getOrganization', () => {
    describe('with an existing organization', () => {
        test('should return organization', async () => {
            const org = await getOrganization('123');
            expect(org).toBeDefined();
        });
    });
});

describe('call function sendFeedbackConfirmation', () => {
    describe('with valid parameters', () => {
        test('should not throw error', async () => {
            await expect(sendFeedbackConfirmation(
                'feedback',
                'test@test.com',
                'test',
            )).resolves.not.toThrowError();
        });
    });
});
