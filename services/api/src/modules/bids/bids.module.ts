import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BidEntity } from '../../entities/bid.entity'
import { ContractEntity } from '../../entities/contract.entity'
import { TaskEntity } from '../../entities/task.entity'
import { BidsController } from './bids.controller'
import { BidsService } from './bids.service'

@Module({
  imports: [TypeOrmModule.forFeature([BidEntity, ContractEntity, TaskEntity])],
  controllers: [BidsController],
  providers: [BidsService],
  exports: [BidsService]
})
export class BidsModule { }
