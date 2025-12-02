import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { TasksService } from './tasks.service'
import { TaskEntity } from '../../entities/task.entity'
import { Repository } from 'typeorm'

const mockTask = {
    id: 'task-123',
    requesterId: 'user-123',
    title: 'Test Task',
    status: 'open',
}

describe('TasksService', () => {
    let service: TasksService
    let repo: Repository<TaskEntity>

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
                        findOneBy: jest.fn().mockResolvedValue(mockTask),
                        remove: jest.fn().mockResolvedValue(mockTask),
                    },
                },
            ],
        }).compile()

        service = module.get<TasksService>(TasksService)
        repo = module.get<Repository<TaskEntity>>(getRepositoryToken(TaskEntity))
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

    it('should allow owner to delete task', async () => {
        await service.delete('task-123', 'user-123')
        expect(repo.remove).toHaveBeenCalledWith(mockTask)
    })

    it('should allow admin to delete task', async () => {
        await service.delete('task-123', 'other-user', 'admin')
        expect(repo.remove).toHaveBeenCalledWith(mockTask)
    })

    it('should forbid non-owner non-admin to delete task', async () => {
        await expect(service.delete('task-123', 'other-user', 'user'))
            .rejects.toThrow('Forbidden')
    })
})
