import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ChatRoomEntity } from '../../entities/chat-room.entity'
import { MessageEntity } from '../../entities/message.entity'

@Injectable()
export class MessagesService {
    constructor(
        @InjectRepository(ChatRoomEntity)
        private readonly roomRepo: Repository<ChatRoomEntity>,
        @InjectRepository(MessageEntity)
        private readonly messageRepo: Repository<MessageEntity>
    ) { }

    async getUserRooms(userId: string): Promise<ChatRoomEntity[]> {
        return this.roomRepo.find({
            where: [
                { requesterId: userId },
                { helperId: userId }
            ],
            relations: ['task', 'requester', 'helper'],
            order: { updatedAt: 'DESC' }
        })
    }

    async getRoomMessages(roomId: string, userId: string): Promise<MessageEntity[]> {
        const room = await this.roomRepo.findOneBy({ id: roomId })
        if (!room) throw new NotFoundException('Chat room not found')

        if (room.requesterId !== userId && room.helperId !== userId) {
            throw new ForbiddenException('You do not have access to this chat room')
        }

        return this.messageRepo.find({
            where: { roomId },
            relations: ['sender'],
            order: { createdAt: 'ASC' }
        })
    }

    async sendMessage(roomId: string, senderId: string, content: string): Promise<MessageEntity> {
        const room = await this.roomRepo.findOneBy({ id: roomId })
        if (!room) throw new NotFoundException('Chat room not found')

        if (room.requesterId !== senderId && room.helperId !== senderId) {
            throw new ForbiddenException('You do not have access to this chat room')
        }

        if (room.status === 'archived') {
            throw new BadRequestException('This chat room is archived. You can no longer send messages.')
        }

        const message = this.messageRepo.create({
            roomId,
            senderId,
            content,
            isRead: false
        })

        const savedMessage = await this.messageRepo.save(message)

        // Update the room's updatedAt timestamp to bubble it up in the UI
        room.updatedAt = new Date()
        await this.roomRepo.save(room)

        return this.messageRepo.findOne({
            where: { id: savedMessage.id },
            relations: ['sender']
        }) as Promise<MessageEntity>
    }

    async markAsRead(roomId: string, userId: string): Promise<void> {
        const room = await this.roomRepo.findOneBy({ id: roomId })
        if (!room) return

        if (room.requesterId !== userId && room.helperId !== userId) return

        await this.messageRepo.createQueryBuilder()
            .update(MessageEntity)
            .set({ isRead: true })
            .where('roomId = :roomId', { roomId })
            .andWhere('senderId != :userId', { userId }) // Only mark messages sent by the OTHER person as read
            .execute()
    }
}
