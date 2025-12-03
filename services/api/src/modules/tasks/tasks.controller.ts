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
    return this.tasks.findAll()
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
  async delete(@Param('id') id: string, @Request() req: any) {
    const isAdmin = req.user.role === 'admin'
    return this.tasks.delete(id, req.user.id, isAdmin)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/complete-request')
  async requestCompletion(@Param('id') id: string, @Request() req: any) {
    return this.tasks.requestCompletion(id, req.user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/complete-approve')
  async approveCompletion(@Param('id') id: string, @Request() req: any) {
    return this.tasks.approveCompletion(id, req.user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/complete-reject')
  async rejectCompletion(@Param('id') id: string, @Request() req: any) {
    return this.tasks.rejectCompletion(id, req.user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reopen')
  async reopenTask(@Param('id') id: string, @Request() req: any) {
    return this.tasks.reopenTask(id, req.user.id)
  }
}
