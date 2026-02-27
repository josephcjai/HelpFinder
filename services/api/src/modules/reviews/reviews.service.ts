import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ReviewEntity } from '../../entities/review.entity'
import { TaskEntity } from '../../entities/task.entity'
import { UserEntity } from '../../entities/user.entity'
import { CreateReviewDto, UpdateReviewDto } from './dto'

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(ReviewEntity)
        private readonly repo: Repository<ReviewEntity>,
        @InjectRepository(TaskEntity)
        private readonly taskRepo: Repository<TaskEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>
    ) { }

    async create(reviewerId: string, dto: CreateReviewDto): Promise<ReviewEntity> {

        const task = await this.taskRepo.findOne({
            where: { id: dto.taskId },
            relations: ['bids', 'bids.helper']
        })

        if (!task) throw new NotFoundException('Task not found')

        // 1. Validate Task Status
        if (task.status !== 'completed') {
            throw new BadRequestException('You can only review completed tasks')
        }

        // 2. Identify Role and Validate Participant
        const acceptedBid = task.bids?.find(b => b.status === 'accepted')
        if (!acceptedBid || !acceptedBid.helper) {
            throw new BadRequestException('Task has no accepted helper')
        }

        const helperId = acceptedBid.helper.id
        const requesterId = task.requesterId

        // Validate if Reviewer was involved
        if (reviewerId !== helperId && reviewerId !== requesterId) {
            throw new ForbiddenException('You did not participate in this task')
        }

        // Validate Target Role and Target User
        // If Reviewer is Helper -> They rate Requester
        // If Reviewer is Requester -> They rate Helper
        if (reviewerId === helperId) {
            if (dto.targetRole !== 'requester') {
                throw new BadRequestException('As a helper, you can only rate the requester')
            }
            if (dto.targetUserId !== requesterId) {
                throw new BadRequestException('Invalid target user ID')
            }
        } else if (reviewerId === requesterId) {
            if (dto.targetRole !== 'helper') {
                throw new BadRequestException('As a requester, you can only rate the helper')
            }
            if (dto.targetUserId !== helperId) {
                throw new BadRequestException('Invalid target user ID')
            }
        }

        // 3. Check for Duplicate Review
        const existing = await this.repo.findOne({
            where: {
                taskId: dto.taskId,
                reviewerId: reviewerId,
                targetUserId: dto.targetUserId
            }
        })

        if (existing) {
            throw new ConflictException('You have already reviewed this user for this task')
        }

        // 4. Create Review
        const review = this.repo.create({
            taskId: dto.taskId,
            reviewerId,
            targetUserId: dto.targetUserId,
            targetRole: dto.targetRole,
            rating: dto.rating,
            comment: dto.comment
        })

        await this.repo.save(review)

        // 5. Update Target User Stats
        await this.updateUserRating(dto.targetUserId, dto.targetRole, dto.rating)

        return review
    }

    private async updateUserRating(userId: string, role: 'helper' | 'requester', newRating: number) {
        const user = await this.userRepo.findOneBy({ id: userId })
        if (!user) {
            console.error(`User ${userId} not found when updating rating`)
            return
        }



        if (role === 'helper') {
            const currentRating = Number(user.helperRating) || 0
            const currentCount = Number(user.helperRatingCount) || 0

            // Calculate new average
            const totalScore = (currentRating * currentCount) + newRating
            user.helperRatingCount = currentCount + 1
            user.helperRating = totalScore / user.helperRatingCount
        } else {
            const currentRating = Number(user.requesterRating) || 0
            const currentCount = Number(user.requesterRatingCount) || 0

            const totalScore = (currentRating * currentCount) + newRating
            user.requesterRatingCount = currentCount + 1
            user.requesterRating = totalScore / user.requesterRatingCount
        }


        await this.userRepo.save(user)
    }

    async findByUser(userId: string, role?: 'helper' | 'requester'): Promise<ReviewEntity[]> {
        const where: any = { targetUserId: userId }
        if (role) {
            where.targetRole = role
        }
        return this.repo.find({
            where,
            order: { createdAt: 'DESC' },
            relations: ['reviewer', 'task']
        })
    }

    async findByTask(taskId: string): Promise<ReviewEntity[]> {
        return this.repo.find({
            where: { taskId },
            relations: ['reviewer']
        })
    }

    async update(reviewerId: string, reviewId: string, dto: UpdateReviewDto): Promise<ReviewEntity> {
        const review = await this.repo.findOneBy({ id: reviewId })
        if (!review) throw new NotFoundException('Review not found')

        if (review.reviewerId !== reviewerId) {
            throw new ForbiddenException('You can only edit your own reviews')
        }

        // Check 30 day limit
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        if (review.createdAt < thirtyDaysAgo) {
            throw new BadRequestException('Reviews can only be edited within 30 days of creation')
        }

        const oldRating = review.rating

        if (dto.rating) review.rating = dto.rating
        if (dto.comment !== undefined) review.comment = dto.comment

        const updatedReview = await this.repo.save(review)

        // Only update stats if rating changed
        if (dto.rating && oldRating !== dto.rating) {
            await this.recalculateUserRating(review.targetUserId, review.targetRole, oldRating, dto.rating)
        }

        return updatedReview
    }

    private async recalculateUserRating(userId: string, role: 'helper' | 'requester', oldRating: number, newRating: number) {
        const user = await this.userRepo.findOneBy({ id: userId })
        if (!user) return

        if (role === 'helper') {
            const currentRating = Number(user.helperRating) || 0
            const currentCount = Number(user.helperRatingCount) || 1

            const totalScore = (currentRating * currentCount) - oldRating + newRating
            user.helperRating = totalScore / currentCount
        } else {
            const currentRating = Number(user.requesterRating) || 0
            const currentCount = Number(user.requesterRatingCount) || 1

            const totalScore = (currentRating * currentCount) - oldRating + newRating
            user.requesterRating = totalScore / currentCount
        }
        await this.userRepo.save(user)
    }
}
