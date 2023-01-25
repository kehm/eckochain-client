import { logError, logInfo } from './logger';

console.error = jest.fn();
console.log = jest.fn();

beforeEach(() => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date(1641038400000));
});

afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
});

describe('call function logError', () => {
    describe('with error', () => {
        test('should log error message', () => {
            logError('test');
            expect(console.error).toHaveBeenCalledTimes(1);
            expect(console.error).toHaveBeenCalledWith('1/1/2022, 12:00:00 PM - ERROR: test');
        });
    });
    describe('without error', () => {
        test('should log error message', () => {
            const error = {
                message: 'Error',
                stack: 'Stack',
            };
            logError('test', error);
            expect(console.error).toHaveBeenCalledTimes(2);
            expect(console.error).toHaveBeenCalledWith('1/1/2022, 12:00:00 PM - ERROR: test');
            expect(console.error).toHaveBeenCalledWith(error);
        });
    });
});

describe('call function logInfo', () => {
    test('should log info message', () => {
        logInfo('test');
        expect(console.log).toHaveBeenCalledTimes(1);
        expect(console.log).toHaveBeenCalledWith('1/1/2022, 12:00:00 PM - INFO: test');
    });
});
