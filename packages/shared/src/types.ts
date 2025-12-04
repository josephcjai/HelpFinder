export type UserRole = 'user' | 'admin'

export interface UserProfile {
    id: string
    email: string
    name: string
    role: UserRole
    isSuperAdmin?: boolean
}

export type TaskStatus = 'open' | 'in_progress' | 'review_pending' | 'completed' | 'cancelled'

export interface Task {
    id: string
    requesterId: string
    title: string
    description?: string
    category?: string
    budgetMin?: number
    budgetMax?: number
    latitude?: number
    longitude?: number
    address?: string
    status: TaskStatus
    completedAt?: Date
    createdAt: Date
    updatedAt: Date
    bids?: Bid[]
}

export type BidStatus = 'pending' | 'accepted' | 'rejected'

export interface Bid {
    id: string
    taskId: string
    helperId: string
    amount: number
    message?: string
    status: BidStatus
    createdAt: Date
    helperName?: string // For UI convenience
    helper?: UserProfile
}
