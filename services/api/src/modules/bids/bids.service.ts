import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BidEntity } from '../../entities/bid.entity'
import { ContractEntity } from '../../entities/contract.entity'
import { TaskEntity } from '../../entities/task.entity'
import { CreateBidDto } from './dto'

@Injectable()
export class BidsService {
  constructor(
    @InjectRepository(BidEntity)
    private readonly bidRepo: Repository<BidEntity>,
    @InjectRepository(ContractEntity)
    private readonly contractRepo: Repository<ContractEntity>,
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>
  ) { }

  async listForTask(taskId: string): Promise<BidEntity[]> {
    return this.bidRepo.find({ where: { taskId }, order: { createdAt: 'DESC' } })
  }

  async create(taskId: string, helperId: string, dto: CreateBidDto): Promise<BidEntity> {
    const task = await this.taskRepo.findOneBy({ id: taskId })
    if (!task) throw new NotFoundException('Task not found')

    const bid = this.bidRepo.create({
      taskId,
      helperId,
      ...dto,
    })
    return this.bidRepo.save(bid)
  }

  async accept(bidId: string): Promise<ContractEntity> {
    const bid = await this.bidRepo.findOneBy({ id: bidId })
    if (!bid) throw new NotFoundException('Bid not found')

    bid.status = 'accepted'
    await this.bidRepo.save(bid)

    const contract = this.contractRepo.create({
      taskId: bid.taskId,
      helperId: bid.helperId,
      agreedAmount: bid.amount,
    })
    return this.contractRepo.save(contract)
  }
}

