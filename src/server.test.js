import start from './server';
import { logError } from './utils/logger';

const originalEnv = { ...process.env };

jest.mock('./config/postgres.js', () => ({
    authenticate: jest.fn(),
    define: jest.fn(),
}));

jest.mock('./database/utils/init-postgres.js');
jest.mock('./utils/enroll-client.js');
jest.mock('./utils/cache-state.js');

jest.mock('./utils/logger', () => ({
    logError: jest.fn(),
    logInfo: jest.fn(),
}));

jest.mock('./utils/mailer', () => ({
    sendMail: jest.fn((arg) => {
        if (!arg) {
            throw new Error();
        }
    }),
    mailSubject: jest.requireActual(),
}));

afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
});

describe('call function start', () => {
    describe('with valid parameters', () => {
        test('should not log error', async () => {
            process.env.MAIL_CONTACT = 'test@test.com';
            const app = {
                listen: jest.fn(),
            };
            await start(app);
            expect(logError).not.toHaveBeenCalled();
        });
    });
    describe('with invalid parameters', () => {
        test('should log error', async () => {
            await start({});
            expect(logError).toHaveBeenCalled();
        });
    });
});
