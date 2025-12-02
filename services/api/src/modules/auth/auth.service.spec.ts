import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'
import * as bcrypt from 'bcrypt'

jest.mock('bcrypt')

const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    name: 'Test User',
    role: 'user',
}

describe('AuthService', () => {
    let service: AuthService
    let usersService: UsersService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UsersService,
                    useValue: {
                        findByEmail: jest.fn().mockResolvedValue(mockUser),
                        create: jest.fn().mockResolvedValue(mockUser),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue('mock_token'),
                    },
                },
            ],
        }).compile()

        service = module.get<AuthService>(AuthService)
        usersService = module.get<UsersService>(UsersService)
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    it('should validate user with correct password', async () => {
        (bcrypt.compare as jest.Mock).mockResolvedValue(true)
        const result = await service.validateUser('test@example.com', 'password')
        expect(result).toEqual({
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'user',
        })
    })

    it('should return null for invalid password', async () => {
        (bcrypt.compare as jest.Mock).mockResolvedValue(false)
        const result = await service.validateUser('test@example.com', 'wrong_password')
        expect(result).toBeNull()
    })

    it('should login and return token', async () => {
        const result = await service.login(mockUser)
        expect(result).toEqual({ access_token: 'mock_token' })
    })
})
