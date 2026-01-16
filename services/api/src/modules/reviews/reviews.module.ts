import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ReviewsController } from './reviews.controller'
import { ReviewsService } from './reviews.service'
import { ReviewEntity } from '../../entities/review.entity'
import { TaskEntity } from '../../entities/task.entity'
import { UserEntity } from '../../entities/user.entity'

@Module({
    imports: [
        TypeOrmModule.forFeature([ReviewEntity, TaskEntity, UserEntity])
    ],
    controllers: [ReviewsController],
    providers: [ReviewsService],
    exports: [ReviewsService]
})
export class ReviewsModule { }
