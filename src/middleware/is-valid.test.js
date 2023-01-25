import { validationResult } from 'express-validator';
import isValidInput from './is-valid';

jest.mock('express-validator');
const validationResultMock = validationResult.mockReturnValue({});

const req = {};
const jsonFn = jest.fn();
const res = {
    status: jest.fn(() => ({
        json: jsonFn,
    })),
};
const next = jest.fn();

afterEach(() => {
    jest.clearAllMocks();
});

describe('call function isValidInput', () => {
    describe('with valid input', () => {
        test('should call next', () => {
            validationResultMock.mockReturnValue({
                isEmpty: jest.fn(() => true),
                array: jest.fn(() => []),
            });
            isValidInput(req, res, next);
            expect(res.status).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });
    });
    describe('with invalid input', () => {
        test('should send status 400', () => {
            validationResultMock.mockReturnValue({
                isEmpty: jest.fn(() => false),
                array: jest.fn(() => ['test']),
            });
            isValidInput(req, res, next);
            expect(next).not.toHaveBeenCalled();
        });
    });
});
