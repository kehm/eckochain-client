import { Gateway, Wallets } from 'fabric-network';
import fs from 'fs';
import invoke from './invoke';

jest.mock('fabric-network');
const readFileSyncMock = jest.spyOn(fs, 'readFileSync');
const walletSpy = jest.spyOn(Wallets, 'newFileSystemWallet');
jest.spyOn(Gateway.prototype, 'getNetwork').mockResolvedValue({
    getContract: jest.fn(() => ({
        createTransaction: jest.fn(() => ({
            setTransient: jest.fn(() => ({
                submit: jest.fn(() => 'transient submit success'),
            })),
        })),
        submitTransaction: jest.fn(() => 'submit success'),
    })),
});

afterEach(() => {
    jest.clearAllMocks();
    walletSpy.mockRestore();
});

describe('call function invoke', () => {
    describe('with an identity that is not in the wallet', () => {
        test('should throw error', async () => {
            readFileSyncMock.mockReturnValueOnce('');
            walletSpy.mockReturnValueOnce({ get: jest.fn() });
            await expect(invoke(
                'org1',
                'contract1',
                'func1',
                '{}',
                ...[],
            )).rejects.toThrowError('Identity is not in wallet');
        });
    });
    describe('with an identity that is in the wallet', () => {
        test('should return result', async () => {
            readFileSyncMock.mockReturnValueOnce('');
            readFileSyncMock.mockReturnValueOnce('');
            readFileSyncMock.mockReturnValueOnce('');
            walletSpy.mockReturnValueOnce({ get: jest.fn(() => 'user1') });
            const response = await invoke('org1', 'contract1', 'func1', undefined, ...[]);
            expect(response).toEqual('submit success');
        });
    });
    describe('with an identity that is in the wallet and transient data', () => {
        test('should return result', async () => {
            readFileSyncMock.mockReturnValueOnce('');
            readFileSyncMock.mockReturnValueOnce('');
            readFileSyncMock.mockReturnValueOnce('');
            walletSpy.mockReturnValueOnce({ get: jest.fn(() => 'user1') });
            const response = await invoke('org1', 'contract1', 'func1', '{}', ...[]);
            expect(response).toEqual('transient submit success');
        });
    });
    describe('with an identity that is in the wallet and an invalid certificate path', () => {
        test('should throw error', async () => {
            readFileSyncMock.mockReturnValueOnce('');
            walletSpy.mockReturnValueOnce({ get: jest.fn(() => 'user1') });
            await expect(invoke(
                'org1',
                'contract1',
                'func1',
                '{}',
                ...[],
            )).rejects.toThrowError("ENOENT: no such file or directory, open 'undefined/undefined-tlscert.crt'");
        });
    });
});
