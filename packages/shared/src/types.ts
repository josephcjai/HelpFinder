export type UserRole = 'user' | 'admin'

export interface UserProfile {
    id: string
    email: string
    name: string
    role: UserRole
    isSuperAdmin?: boolean
    latitude?: number
    longitude?: number
    address?: string
    country?: string
    zipCode?: string
}

export interface Category {
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
}

export type TaskStatus = 'open' | 'accepted' | 'in_progress' | 'review_pending' | 'completed' | 'cancelled'

export interface Task {
    id: string
    requesterId: string
    title: string
    description?: string
    categoryId?: string
    category?: Category
    budgetMin?: number
    budgetMax?: number
    latitude?: number
    longitude?: number
    address?: string
    country?: string
    zipCode?: string
    status: TaskStatus
    completedAt?: Date
    createdAt: Date
    updatedAt: Date
    bids?: Bid[]
    requester?: UserProfile
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
