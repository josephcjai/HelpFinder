import { Module } from '@nestjs/common'
import { UsersModule } from './users/users.module'
import { TasksModule } from './tasks/tasks.module'
import { BidsModule } from './bids/bids.module'
import { ContractsModule } from './contracts/contracts.module'

@Module({
  imports: [UsersModule, TasksModule, BidsModule, ContractsModule],
})
export class AppModule {}

