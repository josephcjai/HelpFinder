import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ContractEntity } from '../../entities/contract.entity'
import { TaskEntity } from '../../entities/task.entity'
import { TasksController } from './tasks.controller'
import { TasksService } from './tasks.service'
import { NotificationsModule } from '../notifications/notifications.module'
import { MailModule } from '../mail/mail.module'

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity, ContractEntity]), NotificationsModule, MailModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService]
})
export class TasksModule { }

