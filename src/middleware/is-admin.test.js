import isAdmin from './is-admin';

const res = {
    sendStatus: jest.fn(),
};
const next = jest.fn();

afterEach(() => {
    jest.clearAllMocks();
});

describe('call function isAdmin', () => {
    describe('with an admin user', () => {
        test('should call next', () => {
            const req = {
                user: {
                    id: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                    organization: 'org1',
                    role: 'ADMIN',
                    email: 'test@test.com',
                    status: 'VERIFIED',
                },
            };
            isAdmin(req, res, next);
            expect(res.sendStatus).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });
    });
    describe('with an external user', () => {
        test('should send status 403', () => {
            const req = {
                user: {
                    id: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                    organization: 'org1',
                    role: 'EXTERNAL',
                    email: 'test@test.com',
                    status: 'VERIFIED',
                },
            };
            isAdmin(req, res, next);
            expect(res.sendStatus).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });
    });
});
