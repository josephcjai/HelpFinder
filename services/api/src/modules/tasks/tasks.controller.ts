import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { TaskEntity } from '../../entities/task.entity'
import { CreateTaskDto } from './dto'
import { TasksService } from './tasks.service'

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  getTasks(): TaskEntity[] {
    return this.tasks.list()
  }

  @Post()
  createTask(@Body() body: CreateTaskDto): TaskEntity {
    // TODO: replace hardcoded requester with auth context
    return this.tasks.create('demo-requester-1', body)
  }
}

