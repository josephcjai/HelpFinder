import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TaskEntity } from '../../entities/task.entity'
import { BidEntity } from '../../entities/bid.entity'
import { CreateTaskDto } from './dto'

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly repo: Repository<TaskEntity>
  ) { }

  async findAll(): Promise<TaskEntity[]> {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      relations: ['bids', 'bids.helper']
    })
  }

  async create(requesterId: string, dto: CreateTaskDto): Promise<TaskEntity> {
    const task = this.repo.create({
      requesterId,
      ...dto,
    })
    return this.repo.save(task)
  }

  async update(id: string, userId: string, updates: Partial<TaskEntity>, userRole?: string): Promise<TaskEntity> {
    const task = await this.repo.findOneBy({ id })
    if (!task) {
      throw new Error('Task not found')
    }
    if (task.requesterId !== userId && userRole !== 'admin') {
      throw new Error('Forbidden')
    }
    Object.assign(task, updates)
    return this.repo.save(task)
  }

  async delete(id: string, userId: string, isAdmin: boolean): Promise<void> {
    const task = await this.repo.findOneBy({ id })
    if (!task) return // Idempotent
    if (task.requesterId !== userId && !isAdmin) {
      throw new Error('Unauthorized')
    }
    await this.repo.delete(id)
  }

  async requestCompletion(taskId: string, userId: string): Promise<TaskEntity> {
    const task = await this.repo.findOne({ where: { id: taskId }, relations: ['bids', 'bids.helper'] })
    if (!task) throw new Error('Task not found')

    // Find the accepted bid to verify the user is the helper
    const acceptedBid = task.bids?.find(b => b.status === 'accepted')

    if (!acceptedBid) {
      throw new Error('No accepted bid found')
    }

    // Defensive check: Ensure helper is loaded
    if (!acceptedBid.helper) {
      // Attempt to load helper manually if missing (fallback)
      const bidWithHelper = await this.repo.manager.findOne(BidEntity, {
        where: { id: acceptedBid.id },
        relations: ['helper']
      })
      if (bidWithHelper && bidWithHelper.helper) {
        acceptedBid.helper = bidWithHelper.helper
      } else {
        throw new Error('Failed to load helper details for the accepted bid')
      }
    }

    if (acceptedBid.helper.id !== userId) {
      throw new Error('Only the assigned helper can request completion')
    }

    task.status = 'review_pending'
    return this.repo.save(task)
  }

  async approveCompletion(taskId: string, userId: string): Promise<TaskEntity> {
    const task = await this.repo.findOneBy({ id: taskId })
    if (!task) throw new Error('Task not found')
    if (task.requesterId !== userId) throw new Error('Unauthorized')

    task.status = 'completed'
    task.completedAt = new Date()
    return this.repo.save(task)
  }

  async rejectCompletion(taskId: string, userId: string): Promise<TaskEntity> {
    const task = await this.repo.findOneBy({ id: taskId })
    if (!task) throw new Error('Task not found')
    if (task.requesterId !== userId) throw new Error('Unauthorized')

    task.status = 'in_progress'
    return this.repo.save(task)
  }

  async reopenTask(taskId: string, userId: string): Promise<TaskEntity> {
    const task = await this.repo.findOneBy({ id: taskId })
    if (!task) throw new Error('Task not found')
    if (task.requesterId !== userId) throw new Error('Unauthorized')
    if (task.status !== 'completed') throw new Error('Task is not completed')

    // Check if within 2 weeks (14 days)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    if (task.completedAt && task.completedAt < twoWeeksAgo) {
      throw new Error('Cannot reopen task after 14 days')
    }

    task.status = 'in_progress'
    task.completedAt = undefined
    return this.repo.save(task)
  }
}
