import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BidsService } from './bids.service'
import { BidsController } from './bids.controller'
import { BidEntity } from '../../entities/bid.entity'
import { TaskEntity } from '../../entities/task.entity'

@Module({
  imports: [TypeOrmModule.forFeature([BidEntity, TaskEntity])],
  providers: [BidsService],
  controllers: [BidsController],
  exports: [BidsService]
})
export class BidsModule { }
