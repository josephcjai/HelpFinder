import { Controller, Post, Get, Body, Param, UseGuards, Request, Patch, Delete } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { BidsService } from './bids.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('bids')
@Controller()
@UseGuards(JwtAuthGuard)
export class BidsController {
  constructor(private readonly bidsService: BidsService) { }

  @Post('tasks/:taskId/bids')
  async placeBid(
    @Param('taskId') taskId: string,
    @Body('amount') amount: number,
    @Body('message') message: string,
    @Request() req: any
  ) {
    return this.bidsService.placeBid(taskId, req.user, amount, message)
  }

  @Patch('bids/:bidId')
  async updateBid(
    @Param('bidId') bidId: string,
    @Body('amount') amount: number,
    @Body('message') message: string,
    @Request() req: any
  ) {
    return this.bidsService.updateBid(bidId, req.user.id, amount, message)
  }

  @Get('tasks/:taskId/bids')
  async getBids(@Param('taskId') taskId: string) {
    return this.bidsService.getBidsForTask(taskId)
  }

  @Post('bids/:bidId/accept')
  async acceptBid(@Param('bidId') bidId: string, @Request() req: any) {
    return this.bidsService.acceptBid(bidId, req.user.id)
  }

  @Delete('bids/:bidId')
  async withdrawBid(@Param('bidId') bidId: string, @Request() req: any) {
    return this.bidsService.withdrawBid(bidId, req.user.id)
  }
}
