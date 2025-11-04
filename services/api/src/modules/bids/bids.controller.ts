import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { BidEntity } from '../../entities/bid.entity'
import { ContractEntity } from '../../entities/contract.entity'
import { CreateBidDto } from './dto'
import { BidsService } from './bids.service'

@ApiTags('bids')
@Controller()
export class BidsController {
  constructor(private readonly bids: BidsService) {}

  @Get('tasks/:taskId/bids')
  getBids(@Param('taskId') taskId: string): BidEntity[] {
    return this.bids.listForTask(taskId)
  }

  @Post('tasks/:taskId/bids')
  createBid(
    @Param('taskId') taskId: string,
    @Body() body: CreateBidDto
  ): BidEntity {
    // TODO: replace hardcoded helper with auth context
    return this.bids.create(taskId, 'demo-helper-1', body)
  }

  @Post('bids/:bidId/accept')
  acceptBid(@Param('bidId') bidId: string): ContractEntity {
    return this.bids.accept(bidId)
  }
}

