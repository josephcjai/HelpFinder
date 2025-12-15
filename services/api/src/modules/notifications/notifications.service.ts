import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { NotificationEntity } from '../../entities/notification.entity'
import { CreateNotificationDto } from './dto'

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(NotificationEntity)
        private readonly repo: Repository<NotificationEntity>
    ) { }

    async create(dto: CreateNotificationDto): Promise<NotificationEntity> {
        const notification = this.repo.create(dto)
        return this.repo.save(notification)
    }

    async findAllForUser(userId: string): Promise<NotificationEntity[]> {
        return this.repo.find({
            where: { userId },
            order: { createdAt: 'DESC' }
        })
    }

    async markAsRead(id: string, userId: string): Promise<void> {
        await this.repo.update({ id, userId }, { isRead: true })
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.repo.update({ userId, isRead: false }, { isRead: true })
    }

    async delete(id: string, userId: string): Promise<void> {
        await this.repo.delete({ id, userId })
    }
}
