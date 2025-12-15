import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BidsService } from './bids.service'
import { BidsController } from './bids.controller'
import { BidEntity } from '../../entities/bid.entity'
import { TaskEntity } from '../../entities/task.entity'
import { ContractEntity } from '../../entities/contract.entity'

import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([BidEntity, TaskEntity, ContractEntity]),
    NotificationsModule
  ],
  providers: [BidsService],
  controllers: [BidsController],
  exports: [BidsService]
})
export class BidsModule { }
