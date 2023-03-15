import { Gateway, Wallets } from 'fabric-network';
import fs from 'fs';
import query from './query';

jest.mock('fabric-network');
const readFileSyncMock = jest.spyOn(fs, 'readFileSync');
const walletSpy = jest.spyOn(Wallets, 'newFileSystemWallet');
jest.spyOn(Gateway.prototype, 'getNetwork').mockResolvedValue({
    getContract: jest.fn(() => ({
        evaluateTransaction: jest.fn(() => 'submit success'),
    })),
});

afterEach(() => {
    jest.clearAllMocks();
    walletSpy.mockRestore();
});

describe('call function query', () => {
    describe('with an identity that is not in the wallet', () => {
        test('should throw error', async () => {
            readFileSyncMock.mockReturnValueOnce('');
            walletSpy.mockReturnValueOnce({ get: jest.fn() });
            await expect(query(
                'org1',
                'contract1',
                'func1',
                'getAll',
            )).rejects.toThrowError('Identity is not in wallet');
        });
    });
    describe('with an identity that is in the wallet', () => {
        test('should return result', async () => {
            readFileSyncMock.mockReturnValueOnce('');
            readFileSyncMock.mockReturnValueOnce('');
            readFileSyncMock.mockReturnValueOnce('');
            walletSpy.mockReturnValueOnce({ get: jest.fn(() => 'user1') });
            const response = await query('org1', 'contract1', 'func1', 'getAll');
            expect(response).toEqual('submit success');
        });
    });
    describe('with an identity that is in the wallet and an invalid certificate path', () => {
        test('should throw error', async () => {
            readFileSyncMock.mockReturnValueOnce('');
            walletSpy.mockReturnValueOnce({ get: jest.fn(() => 'user1') });
            await expect(query(
                'org1',
                'contract1',
                'func1',
                'getAll',
            )).rejects.toThrowError("ENOENT: no such file or directory, open 'undefined/undefined-tlscert.crt'");
        });
    });
});
