export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'

export interface TaskEntity {
  id: string
  requesterId: string
  title: string
  description?: string
  category?: string
  budgetMin?: number
  budgetMax?: number
  latitude?: number
  longitude?: number
  status: TaskStatus
  createdAt: Date
  updatedAt: Date
}

