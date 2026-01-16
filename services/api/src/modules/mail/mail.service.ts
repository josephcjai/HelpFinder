import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { emailTemplates } from './email-templates';

@Injectable()
export class MailService {
    private transporter: any;
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

    async sendMail(options: { to: string; subject: string; html: string }) {
        const { to, subject, html } = options;
        try {
            const info = await this.transporter.sendMail({
                from: process.env.SMTP_FROM, // sender address
                to, // list of receivers
                subject, // Subject line
                html, // html body
            });

            this.logger.log(`Message sent: ${info.messageId}`);
            return info;
        } catch (error) {
            this.logger.error("Error sending email", error);
            throw error;
        }
    }

    async sendWelcomeEmail(email: string, name: string) {
        const subject = 'Welcome to HelpFinder!';
        const safeName = this.escapeHtml(name);
        const html = emailTemplates.welcome(safeName);
        return this.sendMail({ to: email, subject, html });
    }

    async sendResetPasswordEmail(email: string, token: string) {
        const resetLink = `http://localhost:3000/reset-password?token=${token}`;
        const subject = 'Reset Your Password - HelpFinder';
        const html = emailTemplates.resetPassword(resetLink);
        return this.sendMail({ to: email, subject, html });
    }

    async sendVerificationEmail(email: string, token: string) {
        const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

        await this.sendMail({
            to: email,
            subject: 'Verify your HelpFinder Email',
            html: emailTemplates.verifyEmail(url)
        });
    }

    async sendNewBidEmail(to: string, taskTitle: string, bidAmount: number, helperName: string) {
        const safeTitle = this.escapeHtml(taskTitle);
        const safeHelperName = this.escapeHtml(helperName);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        await this.sendMail({
            to,
            subject: `New Bid on "${safeTitle}"`,
            html: emailTemplates.newBid(safeHelperName, bidAmount, safeTitle, frontendUrl)
        });
    }

    async sendBidAcceptedEmail(to: string, taskTitle: string, bidAmount: number) {
        const safeTitle = this.escapeHtml(taskTitle);

        await this.sendMail({
            to,
            subject: `Bid Accepted: "${safeTitle}"`,
            html: `
                <h1>Congratulations!</h1>
                <p>Your bid of <strong>$${bidAmount}</strong> for "<strong>${safeTitle}</strong>" has been accepted!</p>
                <p>Please contact the requester to arrange the details.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">Go to HelpFinder</a>
            `
        });
    }

    async sendTaskStartedEmail(to: string, taskTitle: string, helperName: string) {
        const safeTitle = this.escapeHtml(taskTitle);
        const safeHelperName = this.escapeHtml(helperName);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        await this.sendMail({
            to,
            subject: `Task Started: "${safeTitle}"`,
            html: emailTemplates.taskStarted(safeHelperName, safeTitle, frontendUrl)
        });
    }

    async sendCompletionRequestedEmail(to: string, taskTitle: string, helperName: string) {
        const safeTitle = this.escapeHtml(taskTitle);
        const safeHelperName = this.escapeHtml(helperName);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        await this.sendMail({
            to,
            subject: `Completion Requested: "${safeTitle}"`,
            html: emailTemplates.completionRequested(safeHelperName, safeTitle, frontendUrl)
        });
    }

    async sendCompletionApprovedEmail(to: string, taskTitle: string) {
        const safeTitle = this.escapeHtml(taskTitle);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        await this.sendMail({
            to,
            subject: `Work Approved: "${safeTitle}"`,
            html: emailTemplates.completionApproved(safeTitle, frontendUrl)
        });
    }

    async sendCompletionRejectedEmail(to: string, taskTitle: string) {
        const safeTitle = this.escapeHtml(taskTitle);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        await this.sendMail({
            to,
            subject: `Completion Rejected: "${safeTitle}"`,
            html: emailTemplates.completionRejected(safeTitle, frontendUrl)
        });
    }

    async sendTaskReopenedEmail(to: string, taskTitle: string) {
        const safeTitle = this.escapeHtml(taskTitle);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        await this.sendMail({
            to,
            subject: `Task Reopened: "${safeTitle}"`,
            html: emailTemplates.taskReopened(safeTitle, frontendUrl)
        });
    }

    async sendAdminRestoreRequest(userEmail: string, userName: string) {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@helpfinder.com'; // Fallback
        const safeName = this.escapeHtml(userName);
        const subject = 'Account Restoration Request';
        const html = `
            <h1>Account Restoration Request</h1>
            <p>User <strong>${safeName}</strong> (${userEmail}) tried to register but has a deleted account.</p>
            <p>They have requested to restore their account.</p>
            <p>Please log in to the admin panel to review and restore this user.</p>
        `;

        await this.sendMail({
            to: adminEmail,
            subject,
            html
        });
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}
