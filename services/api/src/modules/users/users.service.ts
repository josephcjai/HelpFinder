import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserEntity } from '../../entities/user.entity'

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly repo: Repository<UserEntity>
    ) { }

    async findByEmail(email: string): Promise<UserEntity | null> {
        return this.repo.findOneBy({ email })
    }

    async create(data: Partial<UserEntity>): Promise<UserEntity> {
        const user = this.repo.create(data)
        return this.repo.save(user)
    }
}
