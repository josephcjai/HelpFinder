export type BidStatus = 'pending' | 'accepted' | 'withdrawn' | 'declined' | 'expired'

export interface BidEntity {
  id: string
  taskId: string
  helperId: string
  amount: number
  message?: string
  status: BidStatus
  createdAt: Date
  updatedAt: Date
}

