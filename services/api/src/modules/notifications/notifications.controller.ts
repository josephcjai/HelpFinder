import { Controller, Get, Post, Param, UseGuards, Request, Patch } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { NotificationsService } from './notifications.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
    constructor(private readonly notifications: NotificationsService) { }

    @Get()
    async getMyNotifications(@Request() req: any) {
        return this.notifications.findAllForUser(req.user.id)
    }

    @Patch(':id/read')
    async markAsRead(@Param('id') id: string, @Request() req: any) {
        return this.notifications.markAsRead(id, req.user.id)
    }

    @Post('read-all')
    async markAllAsRead(@Request() req: any) {
        return this.notifications.markAllAsRead(req.user.id)
    }
}
