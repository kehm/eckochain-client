import {
    cancelContractProposal,
    createContractProposal,
    getDatasetContract,
    getPendingDatasetProposals,
    getPendingProposals,
    getResolvedDatasetProposals,
    resolveContractProposal,
} from './contracts';

jest.mock('../database/models/Contract.js', () => ({
    findByPk: jest.fn(() => ({
        id: '3e4446da-146e-4565-8ff9-a1c6e96d5de7',
        datasetId: 'OS-2020-2021-NO-940881',
        userId: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
        status: 'ACCEPTED',
    })),
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
    findAll: jest.fn((obj) => {
        if (obj.where.userId === 'b3feccac-f4f6-48e1-b1c3-187fabf25074' || obj.where.datasetId) {
            return [
                {
                    get: jest.fn(() => ({
                        id: '3e4446da-146e-4565-8ff9-a1c6e96d5de7',
                        datasetId: 'OS-2020-2021-NO-940881',
                        userId: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                        status: 'PENDING',
                        policy: { license: 'CC' },
                    })),
                },
                {
                    get: jest.fn(() => ({
                        id: '3e4446da-146e-4565-8ff9-a1c6e96d5de7',
                        datasetId: 'OS-2020-2021-NO-882321',
                        userId: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                        status: 'PENDING',
                        policy: { terms: 'CC' },
                    })),
                },
                {
                    get: jest.fn(() => ({
                        id: '3e4446da-146e-4565-8ff9-a1c6e96d5de7',
                        datasetId: 'RE-2020-2021-NO-940881',
                        userId: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                        status: 'PENDING',
                        policy: { license: 'CC-null' },
                    })),
                },
            ];
        }
        if (obj.where.status !== 'PENDING') {
            return [
                {
                    get: jest.fn(() => ({
                        id: '3e4446da-146e-4565-8ff9-a1c6e96d5de7',
                        datasetId: 'OS-2020-2021-NO-940881',
                        userId: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                        status: 'ACCEPTED',
                        policy: { license: 'CC' },
                    })),
                },
                {
                    get: jest.fn(() => ({
                        id: '3e4446da-146e-4565-8ff9-a1c6e96d5de7',
                        datasetId: 'OS-2020-2021-NO-882321',
                        userId: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                        status: 'ACCEPTED',
                        policy: { terms: 'CC' },
                    })),
                },
            ];
        }
        return [];
    }),
    update: jest.fn(() => [true]),
    findOrCreate: jest.fn(() => ([{}, true])),
}));

jest.mock('../database/models/Dataset.js', () => ({
    findByPk: jest.fn(() => ({
        id: 'OS-2020-2021-NO-940881',
        userId: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
        status: 'ACTIVE',
        policy: { license: 'CC' },
    })),
    findAll: jest.fn((obj) => {
        if (obj.where.userId === 'b3feccac-f4f6-48e1-b1c3-187fabf25074') {
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
}));

jest.mock('../database/models/Organization.js', () => ({
    findByPk: jest.fn(() => ({
        fabricName: 'org1',
    })),
}));

jest.mock('../database/models/License.js', () => ({
    findAll: jest.fn(() => ([
        { code: 'CC' },
        { code: 'CC2' },
    ])),
}));

jest.mock('../utils/mailer', () => ({
    sendMail: jest.fn(),
    mailSubject: jest.requireActual(),
}));

jest.mock('../utils/invoke');

afterEach(() => {
    jest.clearAllMocks();
});

describe('call function getDatasetContract', () => {
    describe('with an existing contract', () => {
        test('should return contract', async () => {
            const contract = await getDatasetContract('OS-2020-2021-NO-940881', 'b3feccac-f4f6-48e1-b1c3-187fabf25074');
            expect(contract.id).toEqual('3e4446da-146e-4565-8ff9-a1c6e96d5de7');
            expect(contract.datasetId).toEqual('OS-2020-2021-NO-940881');
            expect(contract.userId).toEqual('b3feccac-f4f6-48e1-b1c3-187fabf25074');
            expect(contract.status).toEqual('ACCEPTED');
        });
    });
    describe('with a contract that does not exist', () => {
        test('should not return contract', async () => {
            const contract = await getDatasetContract('RE-2020-2021-NO-940881', 'b3feccac-f4f6-48e1-b1c3-187fabf25074');
            expect(contract).not.toBeDefined();
        });
    });
});

describe('call function getPendingProposals', () => {
    describe('with a user with pending proposals', () => {
        test('should return proposals', async () => {
            const contracts = await getPendingProposals('b3feccac-f4f6-48e1-b1c3-187fabf25074');
            expect(contracts.length).toEqual(3);
            expect(contracts[0].policy.license.code).toEqual('CC');
            expect(contracts[1].policy.terms).toEqual('CC');
        });
    });
    describe('with a user with no pending proposals', () => {
        test('should return no proposals', async () => {
            const contracts = await getPendingProposals('3e4446da-146e-4565-8ff9-a1c6e96d5de7');
            expect(contracts.length).toEqual(0);
        });
    });
});

describe('call function getPendingDatasetProposals', () => {
    describe('with a user with pending proposals', () => {
        test('should return proposals', async () => {
            const contracts = await getPendingDatasetProposals('b3feccac-f4f6-48e1-b1c3-187fabf25074');
            expect(contracts.length).toEqual(3);
        });
    });
});

describe('call function getResolvedDatasetProposals', () => {
    describe('with a user with resolved proposals', () => {
        test('should return proposals', async () => {
            const contracts = await getResolvedDatasetProposals('b3feccac-f4f6-48e1-b1c3-187fabf25074');
            expect(contracts.length).toEqual(2);
        });
    });
});

describe('call function createContractProposal', () => {
    describe('with an existing contract', () => {
        test('should not throw error', async () => {
            const body = {
                contractId: '3e4446da-146e-4565-8ff9-a1c6e96d5de7',
                accept: true,
                response: 'test',
            };
            const user = {
                id: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
            };
            await expect(createContractProposal(
                body,
                user,
            )).resolves.not.toThrowError();
        });
    });
});

describe('call function resolveContractProposal', () => {
    describe('with an existing contract', () => {
        test('should not throw error', async () => {
            const body = {
                contractId: '3e4446da-146e-4565-8ff9-a1c6e96d5de7',
                accept: true,
                response: 'test',
            };
            const user = {
                id: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
            };
            await expect(resolveContractProposal(
                body,
                user,
            )).resolves.not.toThrowError();
        });
    });
});

describe('call function cancelContractProposal', () => {
    describe('with an existing contract', () => {
        test('should not throw error', async () => {
            await expect(cancelContractProposal(
                '3e4446da-146e-4565-8ff9-a1c6e96d5de7',
                'b3feccac-f4f6-48e1-b1c3-187fabf25074',
            )).resolves.not.toThrowError();
        });
    });
});
