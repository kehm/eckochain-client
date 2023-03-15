import nodemailer from 'nodemailer';
import fs from 'fs';

// Default email subjects
export const mailSubject = {
    feedback: 'ECKO - A user has submitted feedback',
    verifyEmail: 'ECKO - Please confirm your e-mail address',
    newAffiliation: 'ECKO - New affiliation request',
    affiliationChanged: 'ECKO - You have been assigned a new role',
    newProposal: 'ECKO - You have a new pending contract proposal',
    contractAccepted: 'ECKO - Your proposal has been accepted',
    contractRejected: 'ECKO - Your proposal has been rejected',
    newDownload: 'ECKO - A new user has downloaded your dataset',
};

/**
 * Send email
 *
 * @param {string} recipients Email address(es)
 * @param {string} subject Email subject
 * @param {string} template Email HTML template name
 * @param  {...any} args Template replace strings
 * @returns {Object} Nodemailer info
 */
export const sendMail = async (recipients, subject, body, template, ...args) => {
    let htmlBody;
    if (body) {
        htmlBody = body;
    } else {
        htmlBody = fs.readFileSync(`${process.env.MAIL_TEMPLATE_PATH}/${template}.html`, 'utf-8');
        if (args) {
            args.forEach((element, index) => {
                htmlBody = htmlBody.replace(new RegExp(`string${index}`, 'g'), element);
            });
        }
    }
    const transporter = nodemailer.createTransport({
        service: process.env.MAIL_SERVICE,
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        secure: false,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });
    await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: recipients,
        subject,
        html: htmlBody,
    });
};
