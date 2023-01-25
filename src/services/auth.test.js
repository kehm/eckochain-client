import {
    addEmail,
    createToken,
    createUserIfNotExists,
    findUser,
    resetProfile,
    setAuthCookie,
    verifyEmail,
} from './auth.js';
import { logInfo } from '../utils/logger';

const originalEnv = { ...process.env };

jest.mock('../database/models/Token.js', () => ({
    create: jest.fn(() => ({ token: '5B43E1BCC10F6D58E506A22AE3212E32' })),
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
    create: jest.fn(),
    update: jest.fn((arg, obj) => {
        if (obj && obj.where && obj.where.id === 'b3feccac-f4f6-48e1-b1c3-187fabf25074') {
            return [{}];
        }
        return [];
    }),
}));

jest.mock('../database/models/Emails.js', () => ({
    findOne: jest.fn((obj) => {
        if (obj.where.userId === '7fad624c-37a2-4911-b92b-bca0ee0cf643') {
            return {
                destroy: jest.fn(),
            };
        }
        return undefined;
    }),
    findAll: jest.fn((obj) => {
        if (obj.where.userId === 'b3feccac-f4f6-48e1-b1c3-187fabf25074') {
            return [
                {
                    id: 1,
                    userId: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                    email: 'test@test.com',
                    status: 'NOT_VERIFIED',
                },
            ];
        }
        return [];
    }),
    create: jest.fn(),
    update: jest.fn(() => ([{}, {}])),
    destroy: jest.fn(),
}));

jest.mock('../database/models/Token.js', () => ({
    findOne: jest.fn((obj) => {
        if (obj.where.token === '123') {
            return {
                id: '1',
                token: '123',
                expiresAt: '2022-01-17T04:33:12.000Z',
                userId: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                destroy: jest.fn(),
            };
        }
        if (obj.where.token === '456') {
            return {
                id: '2',
                token: '456',
                expiresAt: '2022-01-01T04:33:12.000Z',
                userId: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                destroy: jest.fn(),
            };
        }
        if (obj.where.token === '789') {
            return {
                id: '3',
                token: '789',
                expiresAt: '2022-01-17T04:33:12.000Z',
                userId: '7fad624c-37a2-4911-b92b-bca0ee0cf643',
                destroy: jest.fn(),
            };
        }
        return undefined;
    }),
    findAll: jest.fn((obj) => {
        if (obj.where.userId === 'b3feccac-f4f6-48e1-b1c3-187fabf25074') {
            return [
                {
                    id: '1',
                    token: '123',
                    expiresAt: '2022-01-17T04:33:12.000Z',
                    userId: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                    destroy: jest.fn(),
                },
                {
                    id: '2',
                    token: '456',
                    expiresAt: '2022-01-01T04:33:12.000Z',
                    userId: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                    destroy: jest.fn(),
                },
            ];
        }
        return [];
    }),
    create: jest.fn(() => ({
        id: '4',
        token: '10',
        expiresAt: '2022-01-01T04:33:12.000Z',
        userId: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
        destroy: jest.fn(),
    })),
    destroy: jest.fn(),
}));

jest.mock('../config/postgres.js', () => ({
    query: jest.fn((query, config) => {
        if (config.replacements && config.replacements[0] === '0000-0001-1111-1111') {
            return [{
                orcid: '0000-0001-1111-1111',
                status: 'NOT VERIFIED',
                email_status: 'NOT VERIFIED',
            }];
        }
        if (config.replacements && config.replacements[0] === '0000-0001-2222-2222') {
            return [{
                orcid: '0000-0001-2222-2222',
                status: 'VERIFIED',
                email_status: 'VERIFIED',
            }];
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

beforeEach(() => {
    process.env.OAUTH_TOKEN_SECRET = '12345';
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date(1641038400000));
});

afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
    jest.useRealTimers();
});

describe('call function findUser', () => {
    describe('with a user that exists', () => {
        test('should return user', async () => {
            const user = await findUser('0000-0001-1111-1111');
            expect(user).not.toBeNull();
        });
    });
    describe('with a user that exists and is verified', () => {
        test('should return verified user', async () => {
            const user = await findUser('0000-0001-2222-2222');
            expect(user).not.toBeNull();
            expect(user.email_status).toEqual('VERIFIED');
        });
    });
    describe('with a user that does not exists', () => {
        test('should return null', async () => {
            const user = await findUser('0000-0001-2345-6789');
            expect(user).toBeNull();
        });
    });
});

describe('call function createUserIfNotExists', () => {
    describe('with a new user', () => {
        test('should log new user signing in', async () => {
            const params = {
                orcid: '0000-0001-2345-6789',
                name: 'John Smith',
                expires_in: 20,
                scope: 'read',
            };
            await createUserIfNotExists('74831b08-9369-42d8-9a03-2add07123b5d', 'd4eab04e-34b6-4a49-be8e-6a2a4f898749', params);
            expect(logInfo).toHaveBeenCalledWith('A new user has signed in');
        });
    });
    describe('with a user that already exists', () => {
        test('should log new user signing in', async () => {
            const params = {
                orcid: '0000-0001-1111-1111',
                name: 'John Smith',
                expires_in: 20,
                scope: 'read',
            };
            const user = await createUserIfNotExists('74831b08-9369-42d8-9a03-2add07123b5d', 'd4eab04e-34b6-4a49-be8e-6a2a4f898749', params);
            expect(user.orcid).toEqual('0000-0001-1111-1111');
            expect(logInfo).not.toHaveBeenCalled();
        });
    });
});

describe('call function verifyEmail', () => {
    describe('with an existing token', () => {
        test('should return number of updated rows', async () => {
            const updated = await verifyEmail('123');
            expect(updated).toBeDefined();
        });
    });
    describe('with an expired token', () => {
        test('should return undefined', async () => {
            const updated = await verifyEmail('456');
            expect(updated).not.toBeDefined();
        });
    });
    describe('with an existing email', () => {
        test('should return number of updated rows', async () => {
            const updated = await verifyEmail('789');
            expect(updated).toBeDefined();
        });
    });
});

describe('call function resetProfile', () => {
    describe('with a user that exists', () => {
        test('should return true', async () => {
            const updated = await resetProfile('b3feccac-f4f6-48e1-b1c3-187fabf25074');
            expect(updated).toBe(true);
        });
    });
    describe('with a user that does not exist', () => {
        test('should return false', async () => {
            const updated = await resetProfile('7fad624c-37a2-4911-b92b-bca0ee0cf643');
            expect(updated).toBe(false);
        });
    });
});

describe('call function createToken', () => {
    describe('with an email that exists', () => {
        test('should return true', async () => {
            const updated = await createToken(
                'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                'test@test.com',
            );
            expect(updated).toBe(true);
        });
    });
    describe('with an email that does not exist', () => {
        test('should return false', async () => {
            const updated = await createToken(
                '7fad624c-37a2-4911-b92b-bca0ee0cf643',
                'test@test.com',
            );
            expect(updated).toBe(false);
        });
    });
});

describe('call function addEmail', () => {
    describe('with a user that exists', () => {
        test('should return user', async () => {
            const user = await addEmail(
                'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                'test@test.com',
            );
            expect(user).toBeDefined();
        });
    });
    describe('with a user that does not exist', () => {
        test('should return user', async () => {
            const user = await addEmail(
                '7fad624c-37a2-4911-b92b-bca0ee0cf643',
                'test@test.com',
            );
            expect(user).not.toBeDefined();
        });
    });
});

describe('call function setAuthCookie', () => {
    describe('with role', () => {
        test('should call cookie function', () => {
            const res = {
                cookie: jest.fn(),
            };
            const user = {
                id: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                name: 'John Smith',
                organization: 'org1',
                role: 'MEMBER',
                status: 'VERIFIED',
                orcid: '0000-0001-2345-6789',
            };
            setAuthCookie(res, user, 'test@test.com');
            expect(res.cookie).toHaveBeenCalledWith(
                'auth',
                JSON.stringify({
                    userId: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                    status: 'VERIFIED',
                    orcid: '0000-0001-2345-6789',
                    name: 'John Smith',
                    email: 'test@test.com',
                    organization: 'org1',
                    role: 'MEMBER',
                }),
                { sameSite: 'lax', httpOnly: false },
            );
        });
    });
    describe('without role', () => {
        test('should call cookie function', () => {
            const res = {
                cookie: jest.fn(),
            };
            const user = {
                id: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                name: 'John Smith',
                organization: 'org1',
                status: 'VERIFIED',
                orcid: '0000-0001-2345-6789',
            };
            setAuthCookie(res, user, 'test@test.com');
            expect(res.cookie).toHaveBeenCalledWith(
                'auth',
                JSON.stringify({
                    userId: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                    status: 'VERIFIED',
                    orcid: '0000-0001-2345-6789',
                    name: 'John Smith',
                    email: 'test@test.com',
                    organization: 'org1',
                    role: undefined,
                }),
                { sameSite: 'lax', httpOnly: false },
            );
        });
    });
    describe('with an empty user object', () => {
        test('should have called cookie function', () => {
            const res = {
                cookie: jest.fn(),
            };
            const user = {};
            setAuthCookie(res, user, 'test@test.com');
            expect(res.cookie).toHaveBeenCalledWith(
                'auth',
                JSON.stringify({
                    userId: undefined,
                    status: undefined,
                    orcid: undefined,
                    name: undefined,
                    email: 'test@test.com',
                    organization: undefined,
                    role: undefined,
                }),
                { sameSite: 'lax', httpOnly: false },
            );
        });
    });
});
