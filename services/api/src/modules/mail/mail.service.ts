import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

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
        const html = `
      <h1>Welcome, ${safeName}!</h1>
      <p>We are excited to have you on board.</p>
      <p>Explore thousands of tasks or find help today.</p>
    `;
        return this.sendMail({ to: email, subject, html });
    }

    async sendResetPasswordEmail(email: string, token: string) {
        const resetLink = `http://localhost:3000/reset-password?token=${token}`;
        const subject = 'Reset Your Password - HelpFinder';
        const html = `
            <h1>Password Reset Request</h1>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <a href="${resetLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>If you didn't request this, please ignore this email.</p>
        `;
        return this.sendMail({ to: email, subject, html });
    }

    async sendVerificationEmail(email: string, token: string) {
        const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

        await this.sendMail({
            to: email,
            subject: 'Verify your HelpFinder Email',
            html: `
        <h1>Verify your email</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${url}">Verify Email</a>
      `,
        });
    }

    async sendNewBidEmail(to: string, taskTitle: string, bidAmount: number, helperName: string) {
        const safeTitle = this.escapeHtml(taskTitle);
        const safeHelperName = this.escapeHtml(helperName);

        await this.sendMail({
            to,
            subject: `New Bid on "${safeTitle}"`,
            html: `
                <h1>New Bid Received</h1>
                <p><strong>${safeHelperName}</strong> has placed a bid of <strong>$${bidAmount}</strong> on your task "<strong>${safeTitle}</strong>".</p>
                <p>Login to HelpFinder to review and accept the bid.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">Go to HelpFinder</a>
            `
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

        await this.sendMail({
            to,
            subject: `Task Started: "${safeTitle}"`,
            html: `
                <h1>Work has begun!</h1>
                <p><strong>${safeHelperName}</strong> has started working on your task "<strong>${safeTitle}</strong>".</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">View Task</a>
            `
        });
    }

    async sendCompletionRequestedEmail(to: string, taskTitle: string, helperName: string) {
        const safeTitle = this.escapeHtml(taskTitle);
        const safeHelperName = this.escapeHtml(helperName);

        await this.sendMail({
            to,
            subject: `Completion Requested: "${safeTitle}"`,
            html: `
                <h1>Task Completed?</h1>
                <p><strong>${safeHelperName}</strong> has marked "<strong>${safeTitle}</strong>" as complete.</p>
                <p>Please review the work and approve or reject the completion request.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">Review Work</a>
            `
        });
    }

    async sendCompletionApprovedEmail(to: string, taskTitle: string) {
        const safeTitle = this.escapeHtml(taskTitle);

        await this.sendMail({
            to,
            subject: `Work Approved: "${safeTitle}"`,
            html: `
                <h1>Great Job!</h1>
                <p>Your work on "<strong>${safeTitle}</strong>" has been approved by the requester.</p>
                <p>The payment will now be processed according to platform terms.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">View Details</a>
            `
        });
    }

    async sendCompletionRejectedEmail(to: string, taskTitle: string) {
        const safeTitle = this.escapeHtml(taskTitle);

        await this.sendMail({
            to,
            subject: `Completion Rejected: "${safeTitle}"`,
            html: `
                <h1>Action Required</h1>
                <p>Your completion request for "<strong>${safeTitle}</strong>" was rejected by the requester.</p>
                <p>Please check the task details for feedback and ensure all requirements are met before requesting completion again.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">View Task</a>
            `
        });
    }

    async sendTaskReopenedEmail(to: string, taskTitle: string) {
        const safeTitle = this.escapeHtml(taskTitle);

        await this.sendMail({
            to,
            subject: `Task Reopened: "${safeTitle}"`,
            html: `
                <h1>Task Reopened</h1>
                <p>The task "<strong>${safeTitle}</strong>" has been reopened by the requester.</p>
                <p>The previous contract has been cancelled. You may need to review the task or bid again.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">View Task</a>
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
