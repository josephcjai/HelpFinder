import { Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { BidEntity } from '../../entities/bid.entity'
import { ContractEntity } from '../../entities/contract.entity'
import { dataStore } from '../../store/data.store'
import { CreateBidDto } from './dto'

@Injectable()
export class BidsService {
  listForTask(taskId: string): BidEntity[] {
    return dataStore.bids.filter(b => b.taskId === taskId)
  }

  create(taskId: string, helperId: string, dto: CreateBidDto): BidEntity {
    const task = dataStore.tasks.find(t => t.id === taskId)
    if (!task) throw new NotFoundException('Task not found')
    const now = new Date()
    const bid: BidEntity = {
      id: randomUUID(),
      taskId,
      helperId,
      amount: dto.amount,
      message: dto.message,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }
    dataStore.bids.unshift(bid)
    return bid
  }

  accept(bidId: string): ContractEntity {
    const bid = dataStore.bids.find(b => b.id === bidId)
    if (!bid) throw new NotFoundException('Bid not found')
    bid.status = 'accepted'
    bid.updatedAt = new Date()
    const contract: ContractEntity = {
      id: randomUUID(),
      taskId: bid.taskId,
      helperId: bid.helperId,
      agreedAmount: bid.amount,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    dataStore.contracts.unshift(contract)
    return contract
  }
}

