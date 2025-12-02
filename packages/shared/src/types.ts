export type UserRole = 'user' | 'admin'

export interface UserProfile {
    id: string
    email: string
    name: string
    role: UserRole
    isSuperAdmin?: boolean
}

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'

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
    status: TaskStatus
    createdAt: Date
    updatedAt: Date
}
