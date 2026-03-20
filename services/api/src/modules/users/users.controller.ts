import { Controller, Get, Delete, Param, UseGuards, Patch, Body, Request, ForbiddenException, Post, Query, BadRequestException } from '@nestjs/common'
import { ApiTags, ApiQuery } from '@nestjs/swagger'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { UserRole } from '@helpfinder/shared'
import * as bcrypt from 'bcrypt'
import { MailService } from '../mail/mail.service'

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) { }

  @Get()
  @Roles('admin')
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Query('search') search?: string) {
    return this.usersService.findAll(search)
  }

  @Patch('me/password')
  async changePassword(
    @Request() req: any,
    @Body() body: { currentPassword: string; newPassword: string }
  ) {
    const user = await this.usersService.findById(req.user.id)
    if (!user) throw new BadRequestException('User not found')

    const isMatch = await bcrypt.compare(body.currentPassword, user.passwordHash)
    if (!isMatch) throw new BadRequestException('Current password is incorrect')

    if (!body.newPassword || body.newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters')
    }

    const hash = await bcrypt.hash(body.newPassword, 10)
    await this.usersService.updatePassword(req.user.id, hash)
    // Fire-and-forget security notification email
    this.mailService.sendPasswordChangedEmail(user.email, user.name).catch(() => {})
    return { message: 'Password updated successfully' }
  }

  @Post('invite')
  @Roles('admin')
  async invite(@Body() body: { email: string; name: string; role: string }) {
    return this.usersService.invite(body.email, body.name, body.role)
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.usersService.delete(id)
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async restore(@Param('id') id: string) {
    return this.usersService.restore(id)
  }

  @Patch(':id/role')
  @Roles('admin')
  async updateRole(@Param('id') id: string, @Body('role') role: UserRole, @Request() req: any) {
    const targetUser = await this.usersService.findById(id)
    if (!targetUser) throw new Error('User not found')

    // Rule 1: Cannot touch Super Admin
    if (targetUser.isSuperAdmin) {
      throw new ForbiddenException('Cannot modify Super Admin')
    }

    // Rule 2: Only Super Admin can demote other Admins
    if (targetUser.role === 'admin' && !req.user.isSuperAdmin) {
      throw new ForbiddenException('Only Super Admin can modify other Admins')
    }

    // Rule 3: Cannot demote yourself (already covered by Rule 2 if you are an admin trying to change your own role, but good to be explicit)
    if (targetUser.id === req.user.id) {
      throw new ForbiddenException('Cannot change your own role')
    }

    return this.usersService.updateRole(id, role)
  }

  @Patch(':id/block')
  @Roles('admin')
  async blockUser(@Param('id') id: string, @Request() req: any) {
    if (req.user.id === id) {
      throw new ForbiddenException('Cannot block yourself')
    }
    return this.usersService.block(id)
  }

  @Patch(':id/unblock')
  @Roles('admin')
  async unblockUser(@Param('id') id: string) {
    return this.usersService.unblock(id)
  }
}
