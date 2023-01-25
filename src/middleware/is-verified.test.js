import isVerified from './is-verified';

const res = {
    sendStatus: jest.fn(),
};
const next = jest.fn();

afterEach(() => {
    jest.clearAllMocks();
});

describe('call function isVerified', () => {
    describe('with a verified user', () => {
        test('should call next', () => {
            const req = {
                user: {
                    id: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                    organization: 'org1',
                    role: 'MEMBER',
                    email: 'test@test.com',
                    status: 'VERIFIED',
                },
            };
            isVerified(req, res, next);
            expect(res.sendStatus).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });
    });
    describe('with a not verified user', () => {
        test('should send status 403', () => {
            const req = {
                user: {
                    id: 'b3feccac-f4f6-48e1-b1c3-187fabf25074',
                    organization: 'org1',
                    role: 'MEMBER',
                    email: 'test@test.com',
                    status: 'NOT_VERIFIED',
                },
            };
            isVerified(req, res, next);
            expect(res.sendStatus).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });
    });
});
