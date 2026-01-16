import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { UsersService } from '../users/users.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        config: ConfigService,
        private usersService: UsersService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get<string>('JWT_SECRET') || 'dev_secret_key',
        })
    }

    async validate(payload: any) {
        console.log('JwtStrategy.validate checking payload:', payload)
        const user = await this.usersService.findById(payload.sub)
        if (!user) {
            console.error('JwtStrategy: User not found for payload', payload)
            throw new UnauthorizedException()
        }
        if (user.isBlocked) {
            console.error('JwtStrategy: User is blocked', user.id)
            throw new UnauthorizedException('User is blocked')
        }
        const { passwordHash, ...result } = user
        return result
    }
}
