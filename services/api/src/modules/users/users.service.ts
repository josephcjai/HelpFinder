import { ForbiddenException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, ILike } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import { UserEntity } from '../../entities/user.entity'
import { UserRole } from '@helpfinder/shared'
import { MailService } from '../mail/mail.service'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly repo: Repository<UserEntity>,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService
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

    async invite(email: string, name: string, role: string): Promise<UserEntity> {
        const existing = await this.findByEmail(email)
        if (existing) {
            throw new Error('User already exists')
        }

        // Generate random password (placeholder, since they will reset it)
        const randomPassword = crypto.randomBytes(16).toString('hex')
        const passwordHash = await bcrypt.hash(randomPassword, 10)

        const user = this.repo.create({
            email,
            name,
            passwordHash,
            role: role as UserRole,
            isVerified: true // Admin invites are auto-verified
        })
        const savedUser = await this.repo.save(user)

        // Generate reset token
        const payload = { email: user.email, sub: user.id, type: 'reset' }
        const token = this.jwtService.sign(payload, { expiresIn: '24h' }) // Longer expiration for invites

        // Send email
        await this.mailService.sendInvitationEmail(email, name, token)

        return savedUser
    }

    async findAll(search?: string): Promise<UserEntity[]> {
        if (!search) {
            return this.repo.find({ withDeleted: true })
        }

        return this.repo.find({
            where: [
                { name: ILike(`%${search}%`) },
                { email: ILike(`%${search}%`) }
            ],
            withDeleted: true
        })
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
