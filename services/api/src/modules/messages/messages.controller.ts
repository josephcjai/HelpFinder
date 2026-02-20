import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common'
import { MessagesService } from './messages.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { SendMessageDto } from './dto'

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @Get()
    async getRooms(@Request() req: any) {
        return this.messagesService.getUserRooms(req.user.id)
    }

    @Get(':roomId/messages')
    async getMessages(@Param('roomId') roomId: string, @Request() req: any) {
        return this.messagesService.getRoomMessages(roomId, req.user.id)
    }

    @Post(':roomId/messages')
    async sendMessage(
        @Param('roomId') roomId: string,
        @Body() dto: SendMessageDto,
        @Request() req: any
    ) {
        return this.messagesService.sendMessage(roomId, req.user.id, dto.content)
    }

    @Post(':roomId/read')
    async markAsRead(@Param('roomId') roomId: string, @Request() req: any) {
        await this.messagesService.markAsRead(roomId, req.user.id)
        return { success: true }
    }
}
