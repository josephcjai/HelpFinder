import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common'
import { ApiQuery, ApiTags } from '@nestjs/swagger'
import { TaskEntity } from '../../entities/task.entity'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CreateTaskDto } from './dto'
import { TasksService } from './tasks.service'

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) { }

  @Get()
  @ApiQuery({ name: 'lat', required: false, type: Number })
  @ApiQuery({ name: 'lng', required: false, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  async getTasks(
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
    @Query('radius') radius?: number,
    @Query('category') category?: string,
  ): Promise<TaskEntity[]> {
    return this.tasks.findAll(lat, lng, radius, category)
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getTask(@Param('id') id: string): Promise<TaskEntity> {
    return this.tasks.findOne(id)
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createTask(@Body() body: CreateTaskDto, @Request() req: any): Promise<TaskEntity> {
    return this.tasks.create(req.user.id, body)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateTask(@Param('id') id: string, @Body() body: Partial<CreateTaskDto>, @Request() req: any): Promise<TaskEntity> {
    return this.tasks.update(id, req.user.id, body, req.user.role)
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
