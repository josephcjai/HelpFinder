export type UserRole = 'requester' | 'helper'

export interface UserEntity {
  id: string
  email: string
  phone?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

