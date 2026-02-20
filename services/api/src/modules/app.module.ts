import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersModule } from './users/users.module'
import { TasksModule } from './tasks/tasks.module'
import { CategoriesModule } from './categories/categories.module'
import { BidsModule } from './bids/bids.module'
import { ContractsModule } from './contracts/contracts.module'
import { NotificationsModule } from './notifications/notifications.module'
import { AuthModule } from './auth/auth.module'
import { MailModule } from './mail/mail.module'
import { ReviewsModule } from './reviews/reviews.module'
import { MessagesModule } from './messages/messages.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: process.env.DB_SYNCHRONIZE === 'true', // Defaults to false (safe)
      }),
    }),
    UsersModule,
    CategoriesModule,
    TasksModule,
    BidsModule,
    ContractsModule,
    NotificationsModule,
    AuthModule,
    MailModule,
    ReviewsModule,
    MessagesModule,
  ],
})
export class AppModule { }
