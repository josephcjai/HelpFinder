import { Body, Controller, Get, Patch, Post, Request, UseGuards, UnauthorizedException } from '@nestjs/common'
import { JwtAuthGuard } from './jwt-auth.guard'
import { ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    async login(@Body() req: any) {
        // In a real app, use a LocalAuthGuard here to validate credentials first
        // For simplicity, we'll validate manually or assume the service handles it
        const user = await this.authService.validateUser(req.email, req.password)
        if (!user) {
            throw new UnauthorizedException('Invalid email or password')
        }
        return this.authService.login(user)
    }

    @Post('register')
    async register(@Body() body: any) {
        return this.authService.register(body.email, body.password, body.name)
    }

    @Post('forgot-password')
    async forgotPassword(@Body() body: { email: string }) {
        return this.authService.forgotPassword(body.email)
    }

    @Post('reset-password')
    async resetPassword(@Body() body: { token: string; newPass: string }) {
        return this.authService.resetPassword(body.token, body.newPass)
    }

    @Post('verify')
    async verifyEmail(@Body() body: { token: string }) {
        return this.authService.verifyEmail(body.token)
    }

    @Post('resend-verification')
    async resendVerification(@Body() body: { email: string }) {
        return this.authService.resendVerification(body.email)
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req: any) {
        return req.user
    }

    @UseGuards(JwtAuthGuard)
    @Patch('profile')
    async updateProfile(@Request() req: any, @Body() body: any) {
        const { address, zipCode, country, latitude, longitude, avatarIcon, avatarInitials, avatarColor, currency } = body
        return this.authService.updateProfile(req.user.id, {
            address,
            zipCode,
            country,
            latitude,
            longitude,
            avatarIcon,
            avatarInitials,
            avatarColor,
            currency
        })
    }
}
