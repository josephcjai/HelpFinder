import { Injectable, NotFoundException, ForbiddenException, BadRequestException, HttpException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Brackets } from 'typeorm'
import { TaskEntity } from '../../entities/task.entity'
import { BidEntity } from '../../entities/bid.entity'
import { UserEntity } from '../../entities/user.entity'
import { ContractEntity } from '../../entities/contract.entity'
import { NotificationsService } from '../notifications/notifications.service'
import { MailService } from '../mail/mail.service'
import { CreateTaskDto } from './dto'

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly repo: Repository<TaskEntity>,
    @InjectRepository(ContractEntity)
    private readonly contractRepo: Repository<ContractEntity>,
    private readonly notifications: NotificationsService,
    private readonly mailService: MailService
  ) { }

  async findAll(lat?: number, lng?: number, radiusInKm: number = 50, category?: string): Promise<TaskEntity[]> {
    const query = this.repo.createQueryBuilder('task')
      .leftJoinAndSelect('task.bids', 'bids')
      .leftJoinAndSelect('bids.helper', 'helper')
      .leftJoinAndSelect('task.category', 'category') // Join category
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

    if (category) {
      query.andWhere(new Brackets(qb => {
        qb.where('category.id = :category', { category })
          .orWhere('task.categoryId IS NULL')
      }))
    }

    const results = await query.getMany()
    return results
  }

  async findOne(id: string): Promise<TaskEntity> {
    const task = await this.repo.findOne({
      where: { id },
      relations: ['bids', 'bids.helper', 'requester', 'category']
    })
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`)
    }
    return task
  }

  async create(requesterId: string, dto: CreateTaskDto): Promise<TaskEntity> {
    const user = await this.repo.manager.findOne(UserEntity, { where: { id: requesterId } })
    if (!user) throw new NotFoundException('User not found')

    const now = new Date();
    const lastSent = user.lastTaskCreatedAt;
    const isSameDay = lastSent &&
      lastSent.getDate() === now.getDate() &&
      lastSent.getMonth() === now.getMonth() &&
      lastSent.getFullYear() === now.getFullYear();

    if (!isSameDay) {
      user.tasksCreatedCount = 0;
    }

    if (user.tasksCreatedCount >= 10) {
      throw new HttpException('Daily task creation limit reached (10/day). Please try again tomorrow.', 429);
    }

    const task = this.repo.create({
      requesterId,
      ...dto,
      categoryId: dto.categoryId, // Map categoryId
      latitude: dto.latitude,
      longitude: dto.longitude,
      address: dto.address,
      country: dto.country,
      zipCode: dto.zipCode,
    })

    // Update user stats
    user.tasksCreatedCount += 1;
    user.lastTaskCreatedAt = now;
    await this.repo.manager.save(user);

    return this.repo.save(task)
  }

  async update(id: string, userId: string, updates: Partial<TaskEntity>, userRole?: string): Promise<TaskEntity> {
    const task = await this.repo.findOne({ where: { id }, relations: ['bids', 'bids.helper'] })
    if (!task) {
      throw new NotFoundException('Task not found')
    }
    if (task.requesterId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('You are not authorized to update this task')
    }

    if (task.status !== 'open' && userRole !== 'admin') {
      throw new ForbiddenException('Cannot edit task after a bid has been accepted')
    }

    // Check if there are any active bids (not rejected)
    const activeBids = task.bids?.filter(b => b.status !== 'rejected')
    if (activeBids && activeBids.length > 0 && userRole !== 'admin') {
      throw new ForbiddenException('Cannot edit task while there are active bids. Please reject all bids first.')
    }

    // Check for critical updates if task has an accepted bid
    const acceptedBid = task.bids?.find(b => b.status === 'accepted')
    if (acceptedBid && acceptedBid.helper) {
      const criticalFields = ['title', 'description', 'budgetMin', 'budgetMax']
      const hasCriticalUpdate = criticalFields.some(field => updates[field as keyof TaskEntity] !== undefined)

      if (hasCriticalUpdate) {
        await this.notifications.create({
          userId: acceptedBid.helper.id,
          message: `The task "${task.title}" you are working on has been modified by the requester. Please review the changes.`,
          type: 'warning',
          resourceId: task.id
        })
      }
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

  async startTask(taskId: string, userId: string): Promise<TaskEntity> {
    const task = await this.repo.findOne({ where: { id: taskId }, relations: ['bids', 'bids.helper'] })
    if (!task) throw new NotFoundException('Task not found')

    if (task.status !== 'accepted') {
      throw new BadRequestException('Task must be in accepted status to start')
    }

    const acceptedBid = task.bids?.find(b => b.status === 'accepted')
    if (!acceptedBid || !acceptedBid.helper || acceptedBid.helper.id !== userId) {
      throw new ForbiddenException('Only the assigned helper can start the task')
    }

    task.status = 'in_progress'
    await this.repo.save(task)

    // Update Contract Status
    const contract = await this.contractRepo.findOne({ where: { taskId: task.id } })
    if (contract) {
      contract.status = 'started'
      await this.contractRepo.save(contract)
    }

    // Notify Requester
    await this.notifications.create({
      userId: task.requesterId,
      message: `Task "${task.title}" has been started by ${acceptedBid.helper?.name || 'the helper'}.`,
      type: 'info',
      resourceId: task.id
    })

    // Load Requester email
    const requester = await this.repo.manager.findOne(UserEntity, { where: { id: task.requesterId } })
    if (requester?.email) {
      await this.mailService.sendTaskStartedEmail(requester.email, task.title, acceptedBid.helper?.name || 'Helper')
    }

    return task
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
    await this.repo.save(task)

    // Update Contract Status
    const contract = await this.contractRepo.findOne({ where: { taskId: task.id, helperId: userId } })
    if (contract) {
      contract.status = 'delivered'
      await this.contractRepo.save(contract)
    }

    // Notify Requester
    await this.notifications.create({
      userId: task.requesterId,
      message: `Task "${task.title}" marked as done. Please review and approve.`,
      type: 'success',
      resourceId: task.id
    })

    // Load Requester email
    const requester = await this.repo.manager.findOne(UserEntity, { where: { id: task.requesterId } })
    if (requester?.email) {
      await this.mailService.sendCompletionRequestedEmail(requester.email, task.title, acceptedBid.helper?.name || 'Helper')
    }

    return task
  }

  async approveCompletion(taskId: string, userId: string): Promise<TaskEntity> {
    const task = await this.repo.findOneBy({ id: taskId })
    if (!task) throw new NotFoundException('Task not found')
    if (task.requesterId !== userId) throw new ForbiddenException('Only the requester can approve completion')

    task.status = 'completed'
    task.completedAt = new Date()
    await this.repo.save(task)

    // Update Contract Status
    const contract = await this.contractRepo.findOne({ where: { taskId: task.id } })
    if (contract) {
      contract.status = 'approved'
      await this.contractRepo.save(contract)

      // Notify Helper
      await this.notifications.create({
        userId: contract.helperId,
        message: `Great job! Your work on "${task.title}" has been approved.`,
        type: 'success',
        resourceId: task.id
      })

      // Load Helper email
      const helper = await this.repo.manager.findOne(UserEntity, { where: { id: contract.helperId } })
      if (helper?.email) {
        await this.mailService.sendCompletionApprovedEmail(helper.email, task.title)
      }
    }

    return task
  }

  async rejectCompletion(taskId: string, userId: string): Promise<TaskEntity> {
    const task = await this.repo.findOneBy({ id: taskId })
    if (!task) throw new NotFoundException('Task not found')
    if (task.requesterId !== userId) throw new ForbiddenException('Only the requester can reject completion')

    task.status = 'in_progress'
    await this.repo.save(task)

    // Update Contract Status
    const contract = await this.contractRepo.findOne({ where: { taskId: task.id } })
    if (contract) {
      contract.status = 'started'
      await this.contractRepo.save(contract)

      // Notify Helper
      await this.notifications.create({
        userId: contract.helperId,
        message: `Completion rejected for "${task.title}". Please check feedback/requirements.`,
        type: 'warning',
        resourceId: task.id
      })

      // Load Helper email
      const helper = await this.repo.manager.findOne(UserEntity, { where: { id: contract.helperId } })
      if (helper?.email) {
        await this.mailService.sendCompletionRejectedEmail(helper.email, task.title)
      }
    }

    return task
  }

  async reopenTask(taskId: string, userId: string): Promise<TaskEntity> {
    const task = await this.repo.findOne({ where: { id: taskId }, relations: ['bids'] })
    if (!task) throw new NotFoundException('Task not found')
    if (task.requesterId !== userId) throw new ForbiddenException('Only the requester can reopen the task')
    if (task.status !== 'completed') throw new BadRequestException('Task is not in completed status')

    // Check if within 2 weeks (14 days)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    if (task.completedAt && task.completedAt < twoWeeksAgo) {
      throw new BadRequestException('Cannot reopen task after 14 days of completion')
    }

    // 1. Reset Task Status
    task.status = 'open'
    task.completedAt = undefined
    await this.repo.save(task)

    // 2. Reject the previously accepted bid (so they can bid again if needed, and others can bid)
    const acceptedBid = task.bids?.find(b => b.status === 'accepted')
    if (acceptedBid) {
      acceptedBid.status = 'rejected'
      // We need to save the bid. Since we don't have BidRepo injected yet, we can use the manager or add injection.
      // Using manager is cleaner for quick fix without changing constructor signature excessively.
      await this.repo.manager.save(BidEntity, acceptedBid)
    }

    // 3. Update Contract Status
    const contract = await this.contractRepo.findOne({ where: { taskId: task.id } })
    if (contract) {
      contract.status = 'cancelled'
      await this.contractRepo.save(contract)

      // Notify Helper
      await this.notifications.create({
        userId: contract.helperId,
        message: `Task "${task.title}" has been reopened by the requester. Your contract is cancelled. You may bid again.`,
        type: 'info',
        resourceId: task.id
      })

      // Load Helper email
      const helper = await this.repo.manager.findOne(UserEntity, { where: { id: contract.helperId } })
      if (helper?.email) {
        await this.mailService.sendTaskReopenedEmail(helper.email, task.title)
      }
    }

    return task
  }

  async findCreatedBy(userId: string): Promise<TaskEntity[]> {
    return this.repo.find({
      where: { requesterId: userId },
      relations: ['bids', 'bids.helper', 'category'],
      order: { createdAt: 'DESC' }
    })
  }

  async findAssignedTo(userId: string): Promise<TaskEntity[]> {
    // Find tasks where one of the bids is accepted AND the helper is the userId
    return this.repo.createQueryBuilder('task')
      .leftJoinAndSelect('task.bids', 'bid')
      .leftJoinAndSelect('bid.helper', 'helper')
      .leftJoinAndSelect('task.category', 'category')
      .leftJoinAndSelect('task.requester', 'requester')
      .where('bid.status = :status', { status: 'accepted' })
      .andWhere('helper.id = :userId', { userId })
      .orderBy('task.updatedAt', 'DESC')
      .getMany()
  }
}
