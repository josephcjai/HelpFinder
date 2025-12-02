import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UsersService } from '../users/users.service'

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService
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
}
