import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { BidsService } from './bids.service'
import { BidEntity } from '../../entities/bid.entity'
import { TaskEntity } from '../../entities/task.entity'
import { UserEntity } from '../../entities/user.entity'
import { ContractEntity } from '../../entities/contract.entity'
import { ForbiddenException, NotFoundException } from '@nestjs/common'

const mockUser = { id: 'user-1' } as UserEntity
const mockRequester = { id: 'requester-1' } as UserEntity
const mockTask = { id: 'task-1', requester: mockRequester, status: 'open' } as TaskEntity
const mockBid = { id: 'bid-1', task: mockTask, helper: mockUser, amount: 50, status: 'pending' } as BidEntity

describe('BidsService', () => {
    let service: BidsService
    let bidRepo: any
    let taskRepo: any
    let contractRepo: any

    beforeEach(async () => {
        // Reset mocks
        mockTask.status = 'open'
        mockBid.status = 'pending'

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BidsService,
                {
                    provide: getRepositoryToken(BidEntity),
                    useValue: {
                        create: jest.fn().mockReturnValue(mockBid),
                        save: jest.fn().mockImplementation((b: any) => Promise.resolve(b)),
                        find: jest.fn().mockResolvedValue([mockBid]),
                        findOne: jest.fn().mockResolvedValue(mockBid),
                        remove: jest.fn().mockResolvedValue({}),
                    },
                },
                {
                    provide: getRepositoryToken(TaskEntity),
                    useValue: {
                        findOne: jest.fn().mockResolvedValue(mockTask),
                        save: jest.fn().mockResolvedValue(mockTask),
                    },
                },
                {
                    provide: getRepositoryToken(ContractEntity),
                    useValue: {
                        create: jest.fn().mockReturnValue({ id: 'contract-1' }),
                        save: jest.fn().mockResolvedValue({ id: 'contract-1' }),
                        findOne: jest.fn().mockResolvedValue({ id: 'contract-1' }),
                    },
                },
            ],
        }).compile()

        service = module.get<BidsService>(BidsService)
        bidRepo = module.get(getRepositoryToken(BidEntity))
        taskRepo = module.get(getRepositoryToken(TaskEntity))
        contractRepo = module.get(getRepositoryToken(ContractEntity))
    })

    it('should place a bid', async () => {
        const bid = await service.placeBid('task-1', mockUser, 50, 'I can help')
        expect(bid).toEqual(mockBid)
        expect(bidRepo.create).toHaveBeenCalled()
        expect(bidRepo.save).toHaveBeenCalled()
    })

    it('should not allow bidding on own task', async () => {
        await expect(service.placeBid('task-1', mockRequester, 50)).rejects.toThrow(ForbiddenException)
    })

    it('should accept a bid', async () => {
        const acceptedBid = await service.acceptBid('bid-1', 'requester-1')
        expect(acceptedBid.status).toBe('accepted')
        expect(acceptedBid.task.status).toBe('accepted')
        expect(bidRepo.save).toHaveBeenCalled()
        expect(taskRepo.save).toHaveBeenCalled()
        expect(contractRepo.create).toHaveBeenCalled()
    })

    it('should not allow non-owner to accept bid', async () => {
        await expect(service.acceptBid('bid-1', 'other-user')).rejects.toThrow(ForbiddenException)
    })

    it('should update a bid', async () => {
        const updatedBid = { ...mockBid, amount: 75, message: 'Updated message' }
        bidRepo.findOne.mockResolvedValue(mockBid)
        bidRepo.save.mockResolvedValue(updatedBid)

        const result = await service.updateBid('bid-1', 'user-1', 75, 'Updated message')
        expect(result.amount).toBe(75)
        expect(result.message).toBe('Updated message')
    })

    it('should not allow updating bid if not owner', async () => {
        bidRepo.findOne.mockResolvedValue(mockBid)
        await expect(service.updateBid('bid-1', 'other-user', 75)).rejects.toThrow(ForbiddenException)
    })

    it('should not allow updating bid if task is not open', async () => {
        const closedTaskBid = { ...mockBid, task: { ...mockTask, status: 'in_progress' } }
        bidRepo.findOne.mockResolvedValue(closedTaskBid)
        await expect(service.updateBid('bid-1', 'user-1', 75)).rejects.toThrow('Cannot edit bid when task is not open')
    })
})
