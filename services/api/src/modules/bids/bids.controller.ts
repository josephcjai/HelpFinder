import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { BidEntity } from '../../entities/bid.entity'
import { ContractEntity } from '../../entities/contract.entity'
import { CreateBidDto } from './dto'
import { BidsService } from './bids.service'

@ApiTags('bids')
@Controller()
export class BidsController {
  constructor(private readonly bids: BidsService) { }

  @Get('tasks/:taskId/bids')
  async getBids(@Param('taskId') taskId: string): Promise<BidEntity[]> {
    return this.bids.listForTask(taskId)
  }

  @Post('tasks/:taskId/bids')
  async createBid(
    @Param('taskId') taskId: string,
    @Body() body: CreateBidDto
  ): Promise<BidEntity> {
    // TODO: replace hardcoded helper with auth context
    return this.bids.create(taskId, 'demo-helper-1', body)
  }

  @Post('bids/:bidId/accept')
  async acceptBid(@Param('bidId') bidId: string): Promise<ContractEntity> {
    return this.bids.accept(bidId)
  }
}

