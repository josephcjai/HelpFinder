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
        return this.login(user)
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
