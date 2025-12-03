import { Test, TestingModule } from '@nestjs/testing'
import { TasksController } from './tasks.controller'
import { TasksService } from './tasks.service'
import { CreateTaskDto } from './dto'

describe('TasksController', () => {
    let controller: TasksController
    let service: TasksService

    const mockTask = { id: 'task-1', title: 'Test Task', requesterId: 'user-1' }
    const mockUser = { id: 'user-1', role: 'user' }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TasksController],
            providers: [
                {
                    provide: TasksService,
                    useValue: {
                        findAll: jest.fn().mockResolvedValue([mockTask]),
                        create: jest.fn().mockResolvedValue(mockTask),
                        update: jest.fn().mockResolvedValue(mockTask),
                        delete: jest.fn().mockResolvedValue(undefined),
                        requestCompletion: jest.fn().mockResolvedValue({ status: 'review_pending' }),
                        approveCompletion: jest.fn().mockResolvedValue({ status: 'completed' }),
                        rejectCompletion: jest.fn().mockResolvedValue({ status: 'in_progress' }),
                        reopenTask: jest.fn().mockResolvedValue({ status: 'in_progress' }),
                    },
                },
            ],
        }).compile()

        controller = module.get<TasksController>(TasksController)
        service = module.get<TasksService>(TasksService)
    })

    it('should be defined', () => {
        expect(controller).toBeDefined()
    })

    it('should get all tasks', async () => {
        expect(await controller.getTasks()).toEqual([mockTask])
    })

    it('should create a task', async () => {
        const dto: CreateTaskDto = { title: 'New Task', description: 'Desc' }
        expect(await controller.createTask(dto, { user: mockUser })).toEqual(mockTask)
        expect(service.create).toHaveBeenCalledWith('user-1', dto)
    })

    it('should update a task', async () => {
        const dto: Partial<CreateTaskDto> = { title: 'Updated' }
        expect(await controller.updateTask('task-1', dto, { user: mockUser })).toEqual(mockTask)
        expect(service.update).toHaveBeenCalledWith('task-1', 'user-1', dto, 'user')
    })

    it('should delete a task', async () => {
        await controller.delete('task-1', { user: mockUser })
        expect(service.delete).toHaveBeenCalledWith('task-1', 'user-1', false)
    })

    it('should request completion', async () => {
        await controller.requestCompletion('task-1', { user: mockUser })
        expect(service.requestCompletion).toHaveBeenCalledWith('task-1', 'user-1')
    })

    it('should approve completion', async () => {
        await controller.approveCompletion('task-1', { user: mockUser })
        expect(service.approveCompletion).toHaveBeenCalledWith('task-1', 'user-1')
    })

    it('should reject completion', async () => {
        await controller.rejectCompletion('task-1', { user: mockUser })
        expect(service.rejectCompletion).toHaveBeenCalledWith('task-1', 'user-1')
    })

    it('should reopen task', async () => {
        await controller.reopenTask('task-1', { user: mockUser })
        expect(service.reopenTask).toHaveBeenCalledWith('task-1', 'user-1')
    })
})
