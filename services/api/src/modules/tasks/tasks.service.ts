import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Brackets } from 'typeorm'
import { TaskEntity } from '../../entities/task.entity'
import { BidEntity } from '../../entities/bid.entity'
import { CreateTaskDto } from './dto'

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly repo: Repository<TaskEntity>
  ) { }

  async findAll(lat?: number, lng?: number, radiusInKm: number = 50): Promise<TaskEntity[]> {
    const query = this.repo.createQueryBuilder('task')
      .leftJoinAndSelect('task.bids', 'bids')
      .leftJoinAndSelect('bids.helper', 'helper')
      .orderBy('task.createdAt', 'DESC')

    if (lat !== undefined && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      // Haversine formula for distance in km
      // 6371 is Earth's radius in km
      query.addSelect(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(task.latitude)) * cos(radians(task.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(task.latitude))))`,
        'distance'
      )
        .where(new Brackets(qb => {
          qb.where(
            `(6371 * acos(cos(radians(:lat)) * cos(radians(task.latitude)) * cos(radians(task.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(task.latitude)))) <= :radius`
          ).orWhere('task.latitude IS NULL')
        }))
        .setParameters({ lat, lng, radius: radiusInKm })
        .orderBy('distance', 'ASC')
    }

    const results = await query.getMany()
    return results
  }

  async findOne(id: string): Promise<TaskEntity> {
    const task = await this.repo.findOne({
      where: { id },
      relations: ['bids', 'bids.helper', 'requester']
    })
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`)
    }
    return task
  }

  async create(requesterId: string, dto: CreateTaskDto): Promise<TaskEntity> {
    const task = this.repo.create({
      requesterId,
      ...dto,
      latitude: dto.latitude,
      longitude: dto.longitude,
      address: dto.address,
      country: dto.country,
      zipCode: dto.zipCode,
    })
    return this.repo.save(task)
  }

  async update(id: string, userId: string, updates: Partial<TaskEntity>, userRole?: string): Promise<TaskEntity> {
    const task = await this.repo.findOneBy({ id })
    if (!task) {
      throw new NotFoundException('Task not found')
    }
    if (task.requesterId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('You are not authorized to update this task')
    }
    Object.assign(task, updates)
    return this.repo.save(task)
  }

  async delete(id: string, userId: string, isAdmin: boolean): Promise<void> {
    const task = await this.repo.findOneBy({ id })
    if (!task) return // Idempotent
    if (task.requesterId !== userId && !isAdmin) {
      throw new ForbiddenException('You are not authorized to delete this task')
    }
    await this.repo.delete(id)
  }

  async requestCompletion(taskId: string, userId: string): Promise<TaskEntity> {
    const task = await this.repo.findOne({ where: { id: taskId }, relations: ['bids', 'bids.helper'] })
    if (!task) throw new NotFoundException('Task not found')

    // Find the accepted bid to verify the user is the helper
    const acceptedBid = task.bids?.find(b => b.status === 'accepted')

    if (!acceptedBid) {
      throw new BadRequestException('No accepted bid found for this task')
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
      throw new ForbiddenException('Only the assigned helper can request completion')
    }

    task.status = 'review_pending'
    return this.repo.save(task)
  }

  async approveCompletion(taskId: string, userId: string): Promise<TaskEntity> {
    const task = await this.repo.findOneBy({ id: taskId })
    if (!task) throw new NotFoundException('Task not found')
    if (task.requesterId !== userId) throw new ForbiddenException('Only the requester can approve completion')

    task.status = 'completed'
    task.completedAt = new Date()
    return this.repo.save(task)
  }

  async rejectCompletion(taskId: string, userId: string): Promise<TaskEntity> {
    const task = await this.repo.findOneBy({ id: taskId })
    if (!task) throw new NotFoundException('Task not found')
    if (task.requesterId !== userId) throw new ForbiddenException('Only the requester can reject completion')

    task.status = 'in_progress'
    return this.repo.save(task)
  }

  async reopenTask(taskId: string, userId: string): Promise<TaskEntity> {
    const task = await this.repo.findOneBy({ id: taskId })
    if (!task) throw new NotFoundException('Task not found')
    if (task.requesterId !== userId) throw new ForbiddenException('Only the requester can reopen the task')
    if (task.status !== 'completed') throw new BadRequestException('Task is not in completed status')

    // Check if within 2 weeks (14 days)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    if (task.completedAt && task.completedAt < twoWeeksAgo) {
      throw new BadRequestException('Cannot reopen task after 14 days of completion')
    }

    task.status = 'in_progress'
    task.completedAt = undefined
    return this.repo.save(task)
  }
}
