import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UsersService } from '../users/users.service'
import { MailService } from '../mail/mail.service'

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email)
        if (user && (await bcrypt.compare(pass, user.passwordHash))) {
            const { passwordHash, ...result } = user
            return result
        }
        return null
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role, name: user.name, isSuperAdmin: user.isSuperAdmin }
        return {
            access_token: this.jwtService.sign(payload),
        }
    }

    async register(email: string, pass: string, name: string) {
        const existing = await this.usersService.findByEmail(email)
        if (existing) {
            throw new UnauthorizedException('User already exists')
        }
        const hash = await bcrypt.hash(pass, 10)
        const user = await this.usersService.create(email, hash, name)

        // Initialize tracking
        user.verificationEmailsSentCount = 1;
        user.lastVerificationEmailSentAt = new Date();
        await this.usersService.save(user);

        // Generate verification token and send email
        const token = this.jwtService.sign({ email, sub: user.id, type: 'verify' }, { expiresIn: '24h' })
        await this.mailService.sendVerificationEmail(email, token)

        return this.login(user)
    }

    async verifyEmail(token: string) {
        try {
            const payload = this.jwtService.verify(token)
            if (payload.type !== 'verify') {
                throw new UnauthorizedException('Invalid token type')
            }

            const user = await this.usersService.findById(payload.sub)
            if (!user) {
                throw new UnauthorizedException('User not found')
            }

            if (user.isVerified) {
                return { message: 'Email already verified' }
            }

            user.isVerified = true
            await this.usersService.save(user)

            return { message: 'Email verified successfully', success: true }
        } catch (e) {
            throw new UnauthorizedException('Invalid or expired verification token')
        }
    }

    async resendVerification(email: string) {
        console.log(`[AuthService] Attempting to resend verification for: ${email}`);
        const user = await this.usersService.findByEmail(email);

        if (!user) {
            console.log(`[AuthService] User not found for email: ${email}`);
            return { message: 'If user exists, email sent' };
        }

        console.log(`[AuthService] User found: ${user.id}, isVerified: ${user.isVerified}`);

        if (user.isVerified) {
            console.log(`[AuthService] User already verified.`);
            return { message: 'Email already verified' };
        }

        const now = new Date();
        const lastSent = user.lastVerificationEmailSentAt;
        const isSameDay = lastSent &&
            lastSent.getDate() === now.getDate() &&
            lastSent.getMonth() === now.getMonth() &&
            lastSent.getFullYear() === now.getFullYear();

        if (!isSameDay) {
            // Reset count for new day
            user.verificationEmailsSentCount = 0;
        }

        if (user.verificationEmailsSentCount >= 10) {
            console.warn(`[AuthService] Rate limit exceeded for user: ${email}`);
            throw new UnauthorizedException('Too many verification requests. Please try again tomorrow.');
        }

        const token = this.jwtService.sign({ email, sub: user.id, type: 'verify' }, { expiresIn: '24h' });

        console.log(`[AuthService] Generated token, sending email...`);
        await this.mailService.sendVerificationEmail(email, token);

        // Update user stats
        user.verificationEmailsSentCount += 1;
        user.lastVerificationEmailSentAt = now;
        await this.usersService.save(user);

        console.log(`[AuthService] Email sent successfully. Count: ${user.verificationEmailsSentCount}`);

        return { message: 'Verification email sent' };
    }

    async updateProfile(userId: string, updates: any) {
        return this.usersService.updateProfile(userId, updates)
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findByEmail(email)
        if (!user) {
            // Return true even if user not found to prevent enumeration
            return { message: 'If email exists, reset link sent' }
        }

        const payload = { email: user.email, sub: user.id, type: 'reset' }
        const token = this.jwtService.sign(payload, { expiresIn: '1h' })

        await this.mailService.sendResetPasswordEmail(email, token)
        return { message: 'If email exists, reset link sent' }
    }

    async resetPassword(token: string, newPass: string) {
        try {
            const payload = this.jwtService.verify(token)
            if (payload.type !== 'reset') {
                throw new UnauthorizedException('Invalid token type')
            }

            const user = await this.usersService.findOne(payload.sub)
            if (!user) {
                throw new UnauthorizedException('User not found')
            }

            const hash = await bcrypt.hash(newPass, 10)
            await this.usersService.updatePassword(user.id, hash) // Need to ensure updatePassword exists or use generic update

            return { message: 'Password updated successfully' }
        } catch (e) {
            throw new UnauthorizedException('Invalid or expired token')
        }
    }
}
