import isAuthenticated from './is-authenticated';

const res = {
    sendStatus: jest.fn(),
};
const next = jest.fn();

afterEach(() => {
    jest.clearAllMocks();
});

describe('call function isAuthenticated', () => {
    describe('with an authenticated user', () => {
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
            isAuthenticated(req, res, next);
            expect(res.sendStatus).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });
    });
    describe('with an unauthenticated user', () => {
        test('should send status 403', () => {
            const req = {};
            isAuthenticated(req, res, next);
            expect(res.sendStatus).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });
    });
});
