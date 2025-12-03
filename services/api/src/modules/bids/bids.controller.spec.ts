import { Test, TestingModule } from '@nestjs/testing'
import { BidsController } from './bids.controller'
import { BidsService } from './bids.service'

describe('BidsController', () => {
    let controller: BidsController
    let service: BidsService

    const mockBid = { id: 'bid-1', amount: 50, message: 'Hello' }
    const mockUser = { id: 'user-1' }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BidsController],
            providers: [
                {
                    provide: BidsService,
                    useValue: {
                        getBidsForTask: jest.fn().mockResolvedValue([mockBid]),
                        placeBid: jest.fn().mockResolvedValue(mockBid),
                        updateBid: jest.fn().mockResolvedValue(mockBid),
                        acceptBid: jest.fn().mockResolvedValue({ ...mockBid, status: 'accepted' }),
                    },
                },
            ],
        }).compile()

        controller = module.get<BidsController>(BidsController)
        service = module.get<BidsService>(BidsService)
    })

    it('should be defined', () => {
        expect(controller).toBeDefined()
    })

    it('should get bids for a task', async () => {
        expect(await controller.getBids('task-1')).toEqual([mockBid])
        expect(service.getBidsForTask).toHaveBeenCalledWith('task-1')
    })

    it('should place a bid', async () => {
        expect(await controller.placeBid('task-1', 50, 'Hello', { user: mockUser })).toEqual(mockBid)
        expect(service.placeBid).toHaveBeenCalledWith('task-1', mockUser, 50, 'Hello')
    })

    it('should update a bid', async () => {
        expect(await controller.updateBid('bid-1', 60, 'Updated', { user: mockUser })).toEqual(mockBid)
        expect(service.updateBid).toHaveBeenCalledWith('bid-1', 'user-1', 60, 'Updated')
    })

    it('should accept a bid', async () => {
        expect(await controller.acceptBid('bid-1', { user: mockUser })).toEqual({ ...mockBid, status: 'accepted' })
        expect(service.acceptBid).toHaveBeenCalledWith('bid-1', 'user-1')
    })
})
