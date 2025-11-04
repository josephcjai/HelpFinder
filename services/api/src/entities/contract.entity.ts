export type ContractStatus = 'pending' | 'started' | 'delivered' | 'approved' | 'cancelled'

export interface ContractEntity {
  id: string
  taskId: string
  helperId: string
  agreedAmount: number
  status: ContractStatus
  createdAt: Date
  updatedAt: Date
}

