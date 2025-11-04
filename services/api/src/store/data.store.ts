import { randomUUID } from 'crypto'
import { BidEntity } from '../entities/bid.entity'
import { ContractEntity } from '../entities/contract.entity'
import { TaskEntity } from '../entities/task.entity'

class DataStore {
  tasks: TaskEntity[] = []
  bids: BidEntity[] = []
  contracts: ContractEntity[] = []

  seed() {
    if (this.tasks.length > 0) return
    const t1: TaskEntity = {
      id: randomUUID(),
      requesterId: 'demo-requester-1',
      title: 'Assemble IKEA bookshelf',
      description: 'Need help assembling a Billy bookshelf',
      category: 'assembly',
      budgetMin: 30,
      budgetMax: 60,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const t2: TaskEntity = {
      id: randomUUID(),
      requesterId: 'demo-requester-2',
      title: 'Garden cleanup for small yard',
      description: 'Weeding and leaf removal (2 hours est.)',
      category: 'garden',
      budgetMin: 50,
      budgetMax: 80,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.tasks.push(t1, t2)
  }
}

export const dataStore = new DataStore()

