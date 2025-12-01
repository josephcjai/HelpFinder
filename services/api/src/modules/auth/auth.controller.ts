import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common'
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
            return { error: 'Invalid credentials' }
        }
        return this.authService.login(user)
    }

    @Post('register')
    async register(@Body() body: any) {
        return this.authService.register(body.email, body.password, body.name)
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req: any) {
        return req.user
    }
}
