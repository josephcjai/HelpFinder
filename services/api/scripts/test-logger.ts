
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
import { MailService } from '../src/modules/mail/mail.service';
import { Logger } from '@nestjs/common';

async function main() {
    Logger.log("Starting Logger Test...", "TestScript");

    const mailService = new MailService();
    console.log("MailService instantiated. Sending email...");

    try {
        await mailService.sendMail({
            to: 'josephcjai@gmail.com',
            subject: 'Logger Test Email',
            html: '<h1>Logger Test</h1><p>Checking NestJS Logger format.</p>'
        });
        Logger.log("Test execution finished.", "TestScript");
    } catch (error) {
        Logger.error("Test failed", error, "TestScript");
    }
}

main();
