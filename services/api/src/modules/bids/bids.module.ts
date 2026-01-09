import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BidsService } from './bids.service'
import { BidsController } from './bids.controller'
import { BidEntity } from '../../entities/bid.entity'
import { TaskEntity } from '../../entities/task.entity'
import { ContractEntity } from '../../entities/contract.entity'
import { NotificationEntity } from '../../entities/notification.entity' // Added this import

import { NotificationsModule } from '../notifications/notifications.module'
import { MailModule } from '../mail/mail.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([BidEntity, TaskEntity, ContractEntity, NotificationEntity]),
    NotificationsModule,
    MailModule // Added MailModule here
  ],
  providers: [BidsService],
  controllers: [BidsController],
  exports: [BidsService]
})
export class BidsModule { }
