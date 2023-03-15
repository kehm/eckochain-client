import fs from 'fs';
import {
    createSha256Hash,
    createTransient,
    decryptSha256,
    encryptSha256,
    generateKey,
} from './encryption';

const error = {
    message: 'Error',
    stack: 'Stack',
};
jest.spyOn(fs, 'readFile').mockImplementation((path, callback) => {
    if (path === '12345') {
        callback(null, Buffer.from('test'));
    } else {
        callback(error, Buffer.from('test'));
    }
});

afterEach(() => {
    jest.clearAllMocks();
});

describe('call functions encryptSha256 and decryptSha256', () => {
    describe('with key and buffer', () => {
        test('decrypted message should equal original message', () => {
            const key = 'b7dd3347a6b8e866d33b26f4d60cf32edc95f0b880f4d8a8fcbabc4043c26719';
            const original = '4dea4a22-4643-4eac-9599-33c26e9cdc84';
            const encrypted = encryptSha256(key, original);
            expect(Buffer.isBuffer(encrypted)).toBe(true);
            const decrypted = decryptSha256(key, encrypted);
            expect(Buffer.isBuffer(decrypted)).toBe(true);
            expect(decrypted.toString('base64')).toEqual(Buffer.from(original).toString('base64'));
        });
    });
});

describe('call function generateKey', () => {
    describe('with no parameters', () => {
        test('should return string with length 64', () => {
            const key = generateKey();
            expect(typeof key).toEqual('string');
            expect(key.length).toEqual(64);
        });
    });
});

describe('call function createSha256Hash', () => {
    describe('with value to hash', () => {
        test('should return string with length 64', () => {
            const hash = createSha256Hash('12345');
            expect(typeof hash).toEqual('string');
            expect(hash.length).toEqual(64);
        });
    });
});

describe('call function createTransient', () => {
    describe('with valid path', () => {
        test('should not throw error', async () => {
            const req = {
                user: {
                    id: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                    organization: 'org1',
                    role: 'MEMBER',
                    email: 'test@test.com',
                    status: 'NOT_VERIFIED',
                },
                files: {
                    dataset: [
                        { path: '12345' },
                    ],
                },
            };
            const transient = await createTransient(req);
            expect(transient.invokedBy).toEqual(Buffer.from(req.user.id));
            expect(Buffer.isBuffer(transient.file)).toBe(true);
        });
    });
    describe('with invalid path', () => {
        test('should reject with error', async () => {
            const req = {
                user: {
                    id: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                    organization: 'org1',
                    role: 'MEMBER',
                    email: 'test@test.com',
                    status: 'NOT_VERIFIED',
                },
                files: {
                    dataset: [
                        { path: 'null' },
                    ],
                },
            };
            await expect(createTransient(req)).rejects.toEqual(error);
        });
    });
});
