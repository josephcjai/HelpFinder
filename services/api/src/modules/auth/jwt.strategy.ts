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
        const user = await this.usersService.findById(payload.sub)
        if (!user) {
            throw new UnauthorizedException('User no longer exists')
        }
        // Return the fresh user record from DB so profile updates are reflected immediately
        // without requiring re-login
        if (user.isBlocked) {
            throw new UnauthorizedException('User is blocked');
        }
        const { passwordHash, ...result } = user
        return result
    }
}
