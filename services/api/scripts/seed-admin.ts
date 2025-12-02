import { NestFactory } from '@nestjs/core'
import { AppModule } from '../src/modules/app.module'
import { UsersService } from '../src/modules/users/users.service'

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule)
    const usersService = app.get(UsersService)

    const email = process.argv[2]
    if (!email) {
        console.error('Please provide an email address')
        process.exit(1)
    }

    const user = await usersService.findByEmail(email)
    if (!user) {
        console.error('User not found')
        process.exit(1)
    }

    user.role = 'admin'
    user.isSuperAdmin = true
    await usersService.save(user)
    console.log(`User ${email} is now a SUPER ADMIN`)
    await app.close()
}

bootstrap()
