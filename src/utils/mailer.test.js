import fs from 'fs';
import { mailBody, mailSubject, sendMail } from './mailer';

jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
        sendMail: jest.fn(),
    })),
}));

jest.spyOn(fs, 'readFileSync').mockReturnValue('test');

describe('call function sendMail', () => {
    describe('with body', () => {
        test('should not throw error', async () => {
            await expect(sendMail(
                'test@test.com',
                mailSubject.appRestart,
                mailBody.appRestart,
            )).resolves.not.toThrowError();
        });
    });
    describe('with no body and no arguments', () => {
        test('should not throw error', async () => {
            await expect(sendMail(
                'test@test.com',
                mailSubject.appRestart,
                undefined,
            )).resolves.not.toThrowError();
        });
    });
    describe('with no body and arguments', () => {
        test('should not throw error', async () => {
            await expect(sendMail(
                'test@test.com',
                mailSubject.appRestart,
                undefined,
                '1',
                '2',
            )).resolves.not.toThrowError();
        });
    });
});
