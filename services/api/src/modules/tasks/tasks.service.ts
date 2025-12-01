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
}

