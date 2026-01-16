import { ForbiddenException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserEntity } from '../../entities/user.entity'
import { UserRole } from '@helpfinder/shared'

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly repo: Repository<UserEntity>
    ) { }

    async findByEmail(email: string): Promise<UserEntity | null> {
        return this.repo.findOneBy({ email })
    }

    async findById(id: string): Promise<UserEntity | null> {
        return this.repo.findOneBy({ id })
    }

    // Alias for compatibility/expectations
    async findOne(id: string): Promise<UserEntity | null> {
        return this.findById(id)
    }

    async create(email: string, passwordHash: string, name: string): Promise<UserEntity> {
        const user = this.repo.create({ email, passwordHash, name })
        return this.repo.save(user)
    }

    async findAll(): Promise<UserEntity[]> {
        return this.repo.find({ withDeleted: true })
    }

    async restore(id: string): Promise<UserEntity> {
        await this.repo.restore(id)
        // Clear the request flag upon restoration
        await this.repo.update(id, { restorationRequestedAt: undefined })
        return this.repo.findOneByOrFail({ id })
    }

    async requestRestoration(id: string): Promise<void> {
        await this.repo.update(id, { restorationRequestedAt: new Date() })
    }

    async findByEmailIncludingDeleted(email: string): Promise<UserEntity | null> {
        return this.repo.findOne({
            where: { email },
            withDeleted: true
        })
    }

    async delete(id: string): Promise<void> {
        const user = await this.repo.findOneBy({ id })
        if (user?.isSuperAdmin) {
            throw new ForbiddenException('Cannot delete Super Admin')
        }
        await this.repo.softDelete(id)
    }

    async updateRole(id: string, role: UserRole): Promise<UserEntity> {
        const user = await this.repo.findOneBy({ id })
        if (!user) throw new Error('User not found')
        user.role = role
        return this.repo.save(user)
    }

    async updateProfile(id: string, updates: Partial<UserEntity>): Promise<UserEntity> {
        const user = await this.repo.findOneBy({ id })
        if (!user) throw new Error('User not found')

        Object.assign(user, updates)
        Object.assign(user, updates)
        return this.repo.save(user)
    }

    async updatePassword(id: string, hash: string): Promise<UserEntity> {
        const user = await this.repo.findOneBy({ id })
        if (!user) throw new Error('User not found')
        user.passwordHash = hash
        return this.repo.save(user)
    }

    async save(user: UserEntity): Promise<UserEntity> {
        return this.repo.save(user)
    }

    async block(id: string): Promise<UserEntity> {
        const user = await this.repo.findOneBy({ id })
        if (!user) throw new Error('User not found')

        if (user.isSuperAdmin) {
            throw new ForbiddenException('Cannot block Super Admin')
        }

        user.isBlocked = true
        return this.repo.save(user)
    }

    async unblock(id: string): Promise<UserEntity> {
        const user = await this.repo.findOneBy({ id })
        if (!user) throw new Error('User not found')

        user.isBlocked = false
        return this.repo.save(user)
    }
}
