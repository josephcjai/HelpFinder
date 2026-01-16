import { Controller, Get, Delete, Param, UseGuards, Patch, Body, Request, ForbiddenException, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { UserRole } from '@helpfinder/shared'

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @Roles('admin')
  async findAll() {
    return this.usersService.findAll()
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
