import postgres from '../config/postgres';
import {
    createAffiliation,
    getUsersWithoutRole,
    getUsersWithRole,
    getVerifiedUser,
    removeOrganizationAffiliation,
    removeUserAffiliation,
} from './affiliations';
import { sendMail } from '../utils/mailer';
import { logInfo } from '../utils/logger';

jest.mock('../database/models/Organizations.js', () => ({
    findOrCreate: jest.fn((query) => {
        if (query.where.userId === '12345' && query.where.organizationId === 'org2') {
            return [{}, false];
        }
        return [{}, true];
    }),
    destroy: jest.fn(() => 1),
}));

jest.mock('../database/models/User.js', () => ({
    findByPk: jest.fn((id) => {
        if (id === 'b3feccac-f4f6-48e1-b1c3-187fabf25074') {
            return {
                id: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                organization: 'org1',
                role: 'MEMBER',
                email: 'test@test.com',
                status: 'VERIFIED',
            };
        }
        return undefined;
    }),
}));

jest.mock('../config/postgres.js', () => ({
    query: jest.fn((query, config) => {
        if (config.replacements && config.replacements[0] === 'org1') {
            return [
                {
                    id: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                    organization: 'org1',
                    role: 'MEMBER',
                    email: 'test@test.com',
                    status: 'VERIFIED',
                },
                {
                    id: 'c41850c5-7f71-49df-9d08-932fd48c4aa0',
                    organization: 'org1',
                    role: 'MEMBER',
                    email: 'test@test.com',
                    status: 'VERIFIED',
                },
            ];
        }
        return [];
    }),
    define: jest.fn(),
}));

jest.mock('../utils/mailer', () => ({
    sendMail: jest.fn(),
    mailSubject: jest.requireActual(),
}));

jest.mock('../utils/logger', () => ({
    logError: jest.fn(),
    logInfo: jest.fn(),
}));

afterEach(() => {
    jest.clearAllMocks();
});

describe('call function getUsersWithoutRole', () => {
    describe('with existing users without role', () => {
        test('should return user', async () => {
            const users = await getUsersWithoutRole('org1');
            expect(users.length).toEqual(2);
        });
    });
});

describe('call function getUsersWithRole', () => {
    describe('with existing verified users', () => {
        test('should return user', async () => {
            const users = await getUsersWithRole('org1');
            expect(users.length).toEqual(2);
        });
    });
});

describe('call function getVerifiedUser', () => {
    describe('with an existing verified user', () => {
        test('should return user', async () => {
            const user = await getVerifiedUser('b3feccac-f4f6-48e1-b1c3-187fabf25074');
            expect(user).toBeDefined();
        });
    });
    describe('with no existing verified user', () => {
        test('should return undefined', async () => {
            const user = await getVerifiedUser('7fad624c-37a2-4911-b92b-bca0ee0cf643');
            expect(user).not.toBeDefined();
        });
    });
});

describe('call function createAffiliation', () => {
    describe('with an existing affiliation', () => {
        test('should not create new affiliation', async () => {
            await createAffiliation('12345', 'org2');
            expect(postgres.query).not.toHaveBeenCalled();
        });
    });
    describe('with a new affiliation with admin', () => {
        test('should create new affiliation and notify admin', async () => {
            await createAffiliation('b3feccac-f4f6-48e1-b1c3-187fabf25074', 'org1');
            expect(postgres.query).toHaveBeenCalled();
            expect(sendMail).toHaveBeenCalled();
        });
    });
    describe('with a new affiliation without admin', () => {
        test('should create new affiliation and not notify admin', async () => {
            await createAffiliation('b3feccac-f4f6-48e1-b1c3-187fabf25074', 'org3');
            expect(postgres.query).toHaveBeenCalled();
            expect(logInfo).toHaveBeenCalledWith('Could not find any organization administrators to notify');
        });
    });
});

describe('call function removeUserAffiliation', () => {
    describe('with an existing affiliation', () => {
        test('should remove affiliation', async () => {
            const removed = await removeUserAffiliation('b3feccac-f4f6-48e1-b1c3-187fabf25074', 'org1');
            expect(removed === 1).toBe(true);
        });
    });
});

describe('call function removeOrganizationAffiliation', () => {
    describe('with an existing affiliation', () => {
        test('should remove affiliation', async () => {
            const removed = await removeOrganizationAffiliation('1');
            expect(removed === 1).toBe(true);
        });
    });
});
