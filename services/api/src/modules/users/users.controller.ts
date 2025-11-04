import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('users')
@Controller('users')
export class UsersController {
  @Get('me')
  me() {
    // Placeholder until auth is added
    return { id: 'demo-user', role: 'helper' }
  }
}

