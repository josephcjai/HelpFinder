
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
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
        // debug: true // Commented out to reduce noise
    });

    console.log('Transporter created. Sending mail...');

    try {
        const info = await transporter.sendMail({
            from: `HelpFinder Test <${process.env.SMTP_FROM}>`,
            to: 'josephcjai@gmail.com',
            subject: 'HelpFinder Email Test',
            html: '<h1>Success!</h1><p>Your HelpFinder email service is working correctly.</p>',
        });

        console.log('Message sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('FATAL ERROR sending email:', error);
        process.exit(1);
    }
    console.log('Test finished.');
}

main().catch(console.error);
