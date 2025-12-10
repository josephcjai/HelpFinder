import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { TasksService } from './tasks.service'
import { TaskEntity } from '../../entities/task.entity'
import { ContractEntity } from '../../entities/contract.entity'
import { NotificationsService } from '../notifications/notifications.service'
import { Repository } from 'typeorm'

const mockTask = {
    id: 'task-123',
    requesterId: 'user-123',
    title: 'Test Task',
    status: 'open',
} as TaskEntity

describe('TasksService', () => {
    let service: TasksService
    let repo: any
    let contractRepo: any
    let notificationsService: any

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TasksService,
                {
                    provide: getRepositoryToken(TaskEntity),
                    useValue: {
                        create: jest.fn().mockReturnValue(mockTask),
                        save: jest.fn().mockResolvedValue(mockTask),
                        find: jest.fn().mockResolvedValue([mockTask]),
                        findOne: jest.fn().mockResolvedValue(mockTask),
                        findOneBy: jest.fn().mockResolvedValue(mockTask),
                        delete: jest.fn().mockResolvedValue({ affected: 1 }),
                        createQueryBuilder: jest.fn(() => ({
                            leftJoinAndSelect: jest.fn().mockReturnThis(),
                            orderBy: jest.fn().mockReturnThis(),
                            addSelect: jest.fn().mockReturnThis(),
                            where: jest.fn().mockReturnThis(),
                            andWhere: jest.fn().mockReturnThis(),
                            setParameters: jest.fn().mockReturnThis(),
                            getMany: jest.fn().mockResolvedValue([mockTask]),
                        })),
                        manager: {
                            findOne: jest.fn()
                        }
                    },
                },
                {
                    provide: getRepositoryToken(ContractEntity),
                    useValue: {
                        findOne: jest.fn(),
                        save: jest.fn(),
                    },
                },
                {
                    provide: NotificationsService,
                    useValue: {
                        create: jest.fn(),
                    },
                },
            ],
        }).compile()

        service = module.get<TasksService>(TasksService)
        repo = module.get(getRepositoryToken(TaskEntity))
        contractRepo = module.get(getRepositoryToken(ContractEntity))
        notificationsService = module.get(NotificationsService)
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    it('should create a task', async () => {
        const task = await service.create('user-123', { title: 'Test Task' })
        expect(task).toEqual(mockTask)
        expect(repo.create).toHaveBeenCalled()
        expect(repo.save).toHaveBeenCalled()
    })

    it('should delete a task', async () => {
        repo.findOneBy.mockResolvedValue(mockTask)
        repo.delete.mockResolvedValue({ affected: 1 })

        await service.delete('task-123', 'user-123', false)
        expect(repo.delete).toHaveBeenCalledWith('task-123')
    })

    it('should allow admin to delete any task', async () => {
        repo.findOneBy.mockResolvedValue(mockTask)
        repo.delete.mockResolvedValue({ affected: 1 })

        await service.delete('task-123', 'other-user', true)
        expect(repo.delete).toHaveBeenCalledWith('task-123')
    })

    it('should throw error if user is not owner', async () => {
        repo.findOneBy.mockResolvedValue(mockTask)

        await expect(service.delete('task-123', 'other-user', false))
            .rejects.toThrow('You are not authorized to delete this task')
    })

    it('should start task', async () => {
        const acceptedTask = { ...mockTask, status: 'accepted', bids: [{ id: 'bid-1', status: 'accepted', helper: { id: 'helper-1' } }] }
        repo.findOne.mockResolvedValue(acceptedTask)
        repo.save.mockResolvedValue({ ...acceptedTask, status: 'in_progress' })
        contractRepo.findOne.mockResolvedValue({ id: 'contract-1', status: 'pending' })
        contractRepo.save.mockImplementation((c: any) => c)

        const result = await service.startTask('task-123', 'helper-1')
        expect(result.status).toBe('in_progress')
        expect(contractRepo.save).toHaveBeenCalled()
    })

    it('should request completion', async () => {
        const taskWithBid = { ...mockTask, status: 'in_progress', bids: [{ id: 'bid-1', status: 'accepted', helper: { id: 'helper-1' } }] }
        repo.findOne.mockResolvedValue(taskWithBid)
        repo.save.mockResolvedValue({ ...taskWithBid, status: 'review_pending' })

        const result = await service.requestCompletion('task-1', 'helper-1')
        expect(result.status).toBe('review_pending')
    })

    it('should handle missing helper relation in requestCompletion', async () => {
        // Mock a bid where helper is undefined initially
        const taskWithBid = { ...mockTask, status: 'in_progress', bids: [{ id: 'bid-1', status: 'accepted' }] }
        repo.findOne.mockResolvedValue(taskWithBid)

        // Mock the manager.findOne fallback
        repo.manager = {
            findOne: jest.fn().mockResolvedValue({ id: 'bid-1', helper: { id: 'helper-1' } })
        }

        repo.save.mockResolvedValue({ ...taskWithBid, status: 'review_pending' })

        const result = await service.requestCompletion('task-1', 'helper-1')
        expect(result.status).toBe('review_pending')
        expect(repo.manager.findOne).toHaveBeenCalled()
    })

    it('should approve completion', async () => {
        repo.findOneBy.mockResolvedValue({ ...mockTask, status: 'review_pending' })
        repo.save.mockImplementation((t: any) => t)

        const result = await service.approveCompletion('task-1', 'user-123')
        expect(result.status).toBe('completed')
        expect(result.completedAt).toBeDefined()
    })

    it('should reject completion', async () => {
        repo.findOneBy.mockResolvedValue({ ...mockTask, status: 'review_pending' })
        repo.save.mockResolvedValue({ ...mockTask, status: 'in_progress' })

        const result = await service.rejectCompletion('task-1', 'user-123')
        expect(result.status).toBe('in_progress')
    })

    it('should reopen task within 2 weeks', async () => {
        const recentDate = new Date()
        recentDate.setDate(recentDate.getDate() - 5) // 5 days ago
        repo.findOneBy.mockResolvedValue({ ...mockTask, status: 'completed', completedAt: recentDate })
        repo.save.mockImplementation((t: any) => t)

        const result = await service.reopenTask('task-1', 'user-123')
        expect(result.status).toBe('in_progress')
        expect(result.completedAt).toBeUndefined()
    })

    it('should NOT reopen task after 2 weeks', async () => {
        const oldDate = new Date()
        oldDate.setDate(oldDate.getDate() - 20) // 20 days ago
        repo.findOneBy.mockResolvedValue({ ...mockTask, status: 'completed', completedAt: oldDate })

        await expect(service.reopenTask('task-1', 'user-123')).rejects.toThrow()
    })
})
