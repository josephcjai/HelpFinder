export type UserRole = 'user' | 'admin'

export interface UserProfile {
    id: string
    email: string
    name: string
    role: UserRole
    isSuperAdmin?: boolean
    latitude?: number | null
    longitude?: number | null
    address?: string
    country?: string
    zipCode?: string
    avatarIcon?: string | null
    avatarInitials?: string | null
    avatarColor?: string | null
}

export const USER_AVATARS = [
    'face', 'face_3', 'face_4', 'face_5', 'face_6',
    'sentiment_very_satisfied', 'sentiment_satisfied', 'mood',
    'psychology', 'support_agent', 'engineering', 'masks',
    'emoji_people', 'accessibility', 'hiking', 'sports_soccer',
    'nightlife', 'school', 'science', 'palette', 'cookie'
]

export interface Category {
    id: string
    name: string
    icon?: string
    color?: string
    createdAt: Date
    updatedAt: Date
}

export const CATEGORY_ICONS = [
    'yard', 'home_repair_service', 'local_shipping', 'pets', 'computer',
    'cleaning_services', 'brush', 'build', 'shopping_basket', 'restaurant',
    'directions_car', 'child_friendly', 'school', 'fitness_center', 'spa',
    'local_hospital', 'palette', 'camera_alt', 'music_note', 'flight',
    'sports_esports', 'work', 'gavel', 'lightbulb', 'security'
]

export const CATEGORY_COLORS = [
    'slate', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald',
    'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia',
    'pink', 'rose'
]

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
    latitude?: number | null
    longitude?: number | null
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
    task?: Task
}
