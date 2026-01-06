import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(MailService.name);

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            debug: true, // Enable debug output
        });
    }

    async sendMail(to: string, subject: string, html: string) {
        try {
            const info = await this.transporter.sendMail({
                from: `HelpFinder <${process.env.SMTP_FROM}>`,
                to,
                subject,
                html,
            });
            this.logger.log(`Email sent: ${info.messageId}`);
            return info;
        } catch (error) {
            this.logger.error('Error sending email', error);
            throw error;
        }
    }

    async sendWelcomeEmail(email: string, name: string) {
        const subject = 'Welcome to HelpFinder!';
        const html = `
      <h1>Welcome, ${name}!</h1>
      <p>We are excited to have you on board.</p>
      <p>Explore thousands of tasks or find help today.</p>
    `;
        return this.sendMail(email, subject, html);
    }

    async sendResetPasswordEmail(email: string, token: string) {
        const resetLink = `http://localhost:3000/reset-password?token=${token}`;
        const subject = 'Reset Your Password - HelpFinder';
        const html = `
            <h1>Password Reset Request</h1>
            <p>You requested to reset your password. Click the link below to proceed:</p>
            <a href="${resetLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>If you did not request this, please ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
        `;
        return this.sendMail(email, subject, html);
    }
}
