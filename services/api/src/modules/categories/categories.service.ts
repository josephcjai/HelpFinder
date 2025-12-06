import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CategoryEntity } from '../../entities/category.entity'
import { CreateCategoryDto, UpdateCategoryDto } from './dto'

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(CategoryEntity)
        private readonly repo: Repository<CategoryEntity>
    ) { }

    async findAll(): Promise<CategoryEntity[]> {
        return this.repo.find({ order: { name: 'ASC' } })
    }

    async findOne(id: string): Promise<CategoryEntity> {
        const category = await this.repo.findOneBy({ id })
        if (!category) throw new NotFoundException('Category not found')
        return category
    }

    async create(dto: CreateCategoryDto): Promise<CategoryEntity> {
        const existing = await this.repo.findOneBy({ name: dto.name })
        if (existing) throw new ConflictException('Category already exists')

        const category = this.repo.create(dto)
        return this.repo.save(category)
    }

    async update(id: string, dto: UpdateCategoryDto): Promise<CategoryEntity> {
        const category = await this.findOne(id)

        if (dto.name !== category.name) {
            const existing = await this.repo.findOneBy({ name: dto.name })
            if (existing) throw new ConflictException('Category name already taken')
        }

        category.name = dto.name
        return this.repo.save(category)
    }

    async delete(id: string): Promise<void> {
        const result = await this.repo.delete(id)
        if (result.affected === 0) throw new NotFoundException('Category not found')
    }
}
