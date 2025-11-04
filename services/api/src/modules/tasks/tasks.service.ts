import { Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { TaskEntity } from '../../entities/task.entity'
import { dataStore } from '../../store/data.store'
import { CreateTaskDto } from './dto'

@Injectable()
export class TasksService {
  list(): TaskEntity[] {
    dataStore.seed()
    return dataStore.tasks
  }

  create(requesterId: string, dto: CreateTaskDto): TaskEntity {
    const now = new Date()
    const task: TaskEntity = {
      id: randomUUID(),
      requesterId,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      budgetMin: dto.budgetMin,
      budgetMax: dto.budgetMax,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    }
    dataStore.tasks.unshift(task)
    return task
  }
}

