import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { UsersService } from './users.service'
import { UserEntity } from '../../entities/user.entity'
import { Repository } from 'typeorm'

const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed',
    name: 'Test User',
    role: 'user',
    isSuperAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
} as UserEntity

describe('UsersService', () => {
    let service: UsersService
    let repo: Repository<UserEntity>

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(UserEntity),
                    useValue: {
                        create: jest.fn().mockReturnValue(mockUser),
                        save: jest.fn().mockResolvedValue(mockUser),
                        findOneBy: jest.fn().mockResolvedValue(mockUser),
                        find: jest.fn().mockResolvedValue([mockUser]),
                        delete: jest.fn().mockResolvedValue({ affected: 1 }),
                    },
                },
            ],
        }).compile()

        service = module.get<UsersService>(UsersService)
        repo = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity))
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    it('should find user by email', async () => {
        const user = await service.findByEmail('test@example.com')
        expect(user).toEqual(mockUser)
        expect(repo.findOneBy).toHaveBeenCalledWith({ email: 'test@example.com' })
    })

    it('should create a user', async () => {
        const user = await service.create('test@example.com', 'hashed', 'Test User')
        expect(user).toEqual(mockUser)
        expect(repo.create).toHaveBeenCalled()
        expect(repo.save).toHaveBeenCalled()
    })

    it('should update user role', async () => {
        const user = await service.updateRole('user-123', 'admin')
        expect(user).toEqual(mockUser)
        expect(repo.findOneBy).toHaveBeenCalledWith({ id: 'user-123' })
        expect(repo.save).toHaveBeenCalled()
    })

    it('should not delete super admin', async () => {
        const superAdmin = { ...mockUser, isSuperAdmin: true }
        jest.spyOn(repo, 'findOneBy').mockResolvedValue(superAdmin)

        await expect(service.delete('user-123')).rejects.toThrow('Cannot delete Super Admin')
    })

    it('should update user profile', async () => {
        const mockRepoUser = { ...mockUser }; // Clone to avoid side effects
        jest.spyOn(repo, 'findOneBy').mockResolvedValue(mockRepoUser)
        // Mock save to return the modified object
        jest.spyOn(repo, 'save').mockImplementation((u: any) => Promise.resolve(u))

        const updates = { address: 'New Address', latitude: 10, longitude: 20 }
        const result = await service.updateProfile('user-123', updates)

        expect(result.address).toBe('New Address')
        expect(result.latitude).toBe(10)
        expect(repo.save).toHaveBeenCalled()
    })
})
