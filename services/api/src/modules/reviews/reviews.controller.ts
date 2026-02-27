import { Controller, Post, Body, UseGuards, Request, Get, Param, Query, Patch } from '@nestjs/common'
import { ReviewsService } from './reviews.service'
import { CreateReviewDto, UpdateReviewDto } from './dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req: any, @Body() dto: CreateReviewDto) {

        return this.reviewsService.create(req.user.id, dto)
    }

    @Get('user/:userId')
    findByUser(@Param('userId') userId: string, @Query('role') role?: 'helper' | 'requester') {
        return this.reviewsService.findByUser(userId, role)
    }

    @Get('task/:taskId')
    findByTask(@Param('taskId') taskId: string) {
        return this.reviewsService.findByTask(taskId)
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateReviewDto) {
        return this.reviewsService.update(req.user.id, id, dto)
    }
}
