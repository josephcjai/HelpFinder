import { Controller, Post, Body, UseGuards, Request, Get, Param, Query } from '@nestjs/common'
import { ReviewsService } from './reviews.service'
import { CreateReviewDto } from './dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req: any, @Body() dto: CreateReviewDto) {
        console.log('ReviewsController.create called:', { userId: req.user.id, dto })
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
}
