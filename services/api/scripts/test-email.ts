
require('dotenv').config();
const nodemailer = require('nodemailer');

async function main() {
    console.log('Testing Email Configuration...');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('User:', process.env.SMTP_USER);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        debug: true
    });

    try {
        const info = await transporter.sendMail({
            from: `HelpFinder Test <${process.env.SMTP_FROM}>`,
            to: 'josephcjai@gmail.com',
            subject: 'HelpFinder Email Test',
            html: '<h1>Success!</h1><p>Your HelpFinder email service is working correctly.</p>',
        });

        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

main().catch(console.error);
