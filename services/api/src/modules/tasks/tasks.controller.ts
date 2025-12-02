import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common'
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
    return this.tasks.create(req.user.id, body)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateTask(@Param('id') id: string, @Body() body: Partial<CreateTaskDto>, @Request() req: any): Promise<TaskEntity> {
    try {
      return await this.tasks.update(id, req.user.id, body, req.user.role)
    } catch (e: any) {
      if (e.message === 'Forbidden') {
        throw new ForbiddenException()
      }
      throw e
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteTask(@Param('id') id: string, @Request() req: any): Promise<void> {
    try {
      await this.tasks.delete(id, req.user.id, req.user.role)
    } catch (e: any) {
      if (e.message === 'Forbidden') {
        throw new ForbiddenException()
      }
      throw e
    }
  }
}

