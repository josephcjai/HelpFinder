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
        synchronize: true, // TODO: disable in production
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
  ],
})
export class AppModule { }
