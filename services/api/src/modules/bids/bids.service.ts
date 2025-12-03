import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BidEntity } from '../../entities/bid.entity'
import { TaskEntity } from '../../entities/task.entity'
import { UserEntity } from '../../entities/user.entity'

@Injectable()
export class BidsService {
  constructor(
    @InjectRepository(BidEntity)
    private readonly bidRepo: Repository<BidEntity>,
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,
  ) { }

  async placeBid(taskId: string, helper: UserEntity, amount: number, message?: string): Promise<BidEntity> {
    const task = await this.taskRepo.findOne({ where: { id: taskId }, relations: ['requester'] })
    if (!task) throw new NotFoundException('Task not found')

    if (task.requester.id === helper.id) {
      throw new ForbiddenException('You cannot bid on your own task')
    }
    if (task.status !== 'open') {
      throw new ForbiddenException('Task is not open for bidding')
    }

    const bid = this.bidRepo.create({
      task,
      helper,
      amount,
      message,
      status: 'pending'
    })
    return this.bidRepo.save(bid)
  }

  async updateBid(bidId: string, userId: string, amount: number, message?: string): Promise<BidEntity> {
    const bid = await this.bidRepo.findOne({ where: { id: bidId }, relations: ['helper', 'task'] })
    if (!bid) throw new NotFoundException('Bid not found')

    if (bid.helper.id !== userId) {
      throw new ForbiddenException('You can only edit your own bids')
    }

    if (bid.task.status !== 'open') {
      throw new ForbiddenException('Cannot edit bid when task is not open')
    }

    if (bid.status !== 'pending') {
      throw new ForbiddenException('Cannot edit bid that is already accepted or rejected')
    }

    bid.amount = amount
    if (message !== undefined) bid.message = message

    return this.bidRepo.save(bid)
  }

  async getBidsForTask(taskId: string): Promise<BidEntity[]> {
    return this.bidRepo.find({
      where: { task: { id: taskId } },
      relations: ['helper'],
      order: { amount: 'ASC' } // Lowest bids first
    })
  }

  async acceptBid(bidId: string, requesterId: string): Promise<BidEntity> {
    const bid = await this.bidRepo.findOne({
      where: { id: bidId },
      relations: ['task', 'task.requester']
    })
    if (!bid) throw new NotFoundException('Bid not found')

    if (bid.task.requester.id !== requesterId) {
      throw new ForbiddenException('Only the task owner can accept bids')
    }

    // 1. Update Bid Status
    bid.status = 'accepted'
    await this.bidRepo.save(bid)

    // 2. Update Task Status
    bid.task.status = 'in_progress'
    await this.taskRepo.save(bid.task)

    // 3. Reject other bids (optional, but good practice)
    // For simplicity, we'll leave them as pending or handle later

    return bid
  }
}
