import FabricCAServices from 'fabric-ca-client';
import { Wallets } from 'fabric-network';
import fs from 'fs';
import { enrollAdmin, enrollClient } from './enroll';

jest.mock('fabric-network');
const readFileSyncMock = jest.spyOn(fs, 'readFileSync');
const walletSpy = jest.spyOn(Wallets, 'newFileSystemWallet');
jest.spyOn(FabricCAServices.prototype, 'enroll').mockResolvedValue({
    certificate: 'abc',
    key: {
        toBytes: jest.fn(() => Buffer.from('123')),
    },
});

afterEach(() => {
    jest.clearAllMocks();
    walletSpy.mockRestore();
});

describe('call function enrollAdmin', () => {
    describe('with an invalid connection profile', () => {
        test('should throw error', async () => {
            readFileSyncMock.mockReturnValueOnce('');
            walletSpy.mockReturnValueOnce({ get: jest.fn() });
            await expect(enrollAdmin({
                fabricName: 'org1',
            })).rejects.toThrowError("Cannot read properties of undefined (reading 'organizations')");
        });
    });
    describe('with a valid connection profile', () => {
        test('should throw error at put', async () => {
            readFileSyncMock.mockReturnValueOnce(JSON.stringify({
                organizations: {
                    org1: {
                        certificateAuthorities: [
                            'ca1',
                        ],
                    },
                },
                certificateAuthorities: {
                    ca1: {
                        url: 'https://ca1.test.com',
                        tlsCACerts: {
                            path: 'test',
                        },
                        httpOptions: {
                            verify: false,
                        },
                        registrar: [
                            {
                                enrollId: 'admin',
                                enrollSecret: 'secret',
                            },
                        ],
                    },
                },
            }));
            walletSpy.mockReturnValueOnce({
                get: jest.fn(),
            });
            await expect(enrollAdmin({
                fabricName: 'org1',
            })).rejects.toThrowError('wallet.put is not a function');
        });
    });
});

describe('call function enrollClient', () => {
    describe('with an invalid connection profile', () => {
        test('should throw error', async () => {
            readFileSyncMock.mockReturnValueOnce('');
            await expect(enrollClient({
                fabricName: 'org1',
            })).rejects.toThrowError("Cannot read properties of undefined (reading 'organizations')");
        });
    });
    describe('with a valid connection profile and an existing identity', () => {
        test('should not throw error', async () => {
            readFileSyncMock.mockReturnValueOnce(JSON.stringify({
                organizations: {
                    org1: {
                        certificateAuthorities: [
                            'ca1',
                        ],
                    },
                },
                certificateAuthorities: {
                    ca1: {
                        url: 'https://ca1.test.com',
                        tlsCACerts: {
                            path: 'test',
                        },
                        httpOptions: {
                            verify: false,
                        },
                        registrar: [
                            {
                                enrollId: 'admin',
                                enrollSecret: 'secret',
                            },
                        ],
                    },
                },
            }));
            walletSpy.mockReturnValueOnce({
                get: jest.fn(() => 'user1'),
            });
            await expect(enrollClient({
                fabricName: 'org1',
            })).resolves.not.toThrowError();
        });
    });
    describe('with a valid connection profile', () => {
        test('should throw error at put', async () => {
            readFileSyncMock.mockReturnValueOnce(JSON.stringify({
                organizations: {
                    org1: {
                        certificateAuthorities: [
                            'ca1',
                        ],
                    },
                },
                certificateAuthorities: {
                    ca1: {
                        url: 'https://ca1.test.com',
                        tlsCACerts: {
                            path: 'test',
                        },
                        httpOptions: {
                            verify: false,
                        },
                        registrar: [
                            {
                                enrollId: 'admin',
                                enrollSecret: 'secret',
                            },
                        ],
                    },
                },
            }));
            walletSpy.mockReturnValueOnce({
                get: jest.fn(),
            });
            await expect(enrollClient({
                fabricName: 'org1',
            })).rejects.toThrowError('wallet.put is not a function');
        });
    });
});
