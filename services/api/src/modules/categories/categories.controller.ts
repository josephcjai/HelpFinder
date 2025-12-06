import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, ForbiddenException, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { CategoriesService } from './categories.service'
import { CreateCategoryDto, UpdateCategoryDto } from './dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categories: CategoriesService) { }

    @Get()
    async findAll() {
        return this.categories.findAll()
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() body: CreateCategoryDto, @Request() req: any) {
        if (req.user.role !== 'admin') throw new ForbiddenException('Only admins can create categories')
        return this.categories.create(body)
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    async update(@Param('id') id: string, @Body() body: UpdateCategoryDto, @Request() req: any) {
        if (req.user.role !== 'admin') throw new ForbiddenException('Only admins can update categories')
        return this.categories.update(id, body)
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req: any) {
        if (req.user.role !== 'admin') throw new ForbiddenException('Only admins can delete categories')
        return this.categories.delete(id)
    }
}
