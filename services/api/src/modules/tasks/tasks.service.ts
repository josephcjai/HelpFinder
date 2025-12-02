import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TaskEntity } from '../../entities/task.entity'
import { CreateTaskDto } from './dto'

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly repo: Repository<TaskEntity>
  ) { }

  async list(): Promise<TaskEntity[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } })
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

  async delete(id: string, userId: string, userRole?: string): Promise<void> {
    const task = await this.repo.findOneBy({ id })
    if (!task) {
      throw new Error('Task not found')
    }
    if (task.requesterId !== userId && userRole !== 'admin') {
      throw new Error('Forbidden')
    }
    await this.repo.remove(task)
  }
}

