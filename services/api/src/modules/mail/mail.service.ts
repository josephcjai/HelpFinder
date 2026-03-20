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
        const subject = 'Welcome to HelpFinder4U!';
        const safeName = this.escapeHtml(name);
        const html = emailTemplates.welcome(safeName);
        return this.sendMail({ to: email, subject, html });
    }

    async sendResetPasswordEmail(email: string, token: string) {
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        const subject = 'Reset Your Password - HelpFinder4U';
        const html = emailTemplates.resetPassword(resetLink);
        return this.sendMail({ to: email, subject, html });
    }

    async sendVerificationEmail(email: string, token: string) {
        const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

        await this.sendMail({
            to: email,
            subject: 'Verify your HelpFinder4U Email',
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
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">Go to HelpFinder4U</a>
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
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@helpfinder4u.com'; // Fallback
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

    async sendInvitationEmail(email: string, name: string, token: string) {
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        const safeName = this.escapeHtml(name);
        const subject = 'You have been invited to HelpFinder4U';
        const html = `
            <h1>Welcome ${safeName}!</h1>
            <p>An administrator has created an account for you on HelpFinder4U.</p>
            <p>Please click the link below to set your password and activate your account:</p>
            <a href="${resetLink}" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Set Password & Login</a>
            <p>If the button doesn't work, copy and paste this link:</p>
            <p>${resetLink}</p>
            <p>This link will expire in 1 hour.</p>
        `;

        await this.sendMail({
            to: email,
            subject,
            html
        });
    }

    async sendPasswordChangedEmail(email: string, name: string) {
        const safeName = this.escapeHtml(name);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        await this.sendMail({
            to: email,
            subject: 'Your HelpFinder4U Password Was Changed',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                    <h2 style="color: #1d4ed8;">Password Changed Successfully</h2>
                    <p>Hi <strong>${safeName}</strong>,</p>
                    <p>Your HelpFinder4U account password was just changed successfully.</p>
                    <div style="background: #fef9c3; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
                        <strong>⚠️ Wasn't you?</strong> If you did not make this change, please reset your password immediately and contact support.
                    </div>
                    <a href="${frontendUrl}/forgot-password" style="display: inline-block; padding: 10px 20px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset My Password</a>
                    <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">This is an automated security notification from HelpFinder4U.</p>
                </div>
            `
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
