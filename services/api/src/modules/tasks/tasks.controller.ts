import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { TaskEntity } from '../../entities/task.entity'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CreateTaskDto } from './dto'
import { TasksService } from './tasks.service'

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) { }

  @Get()
  async getTasks(): Promise<TaskEntity[]> {
    return this.tasks.list()
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createTask(@Body() body: CreateTaskDto, @Request() req: any): Promise<TaskEntity> {
    return this.tasks.create(req.user.userId, body)
  }
}

