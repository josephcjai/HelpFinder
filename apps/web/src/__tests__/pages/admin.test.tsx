import { render, screen, waitFor } from '@testing-library/react'
import AdminDashboard from '../../pages/admin'
import '@testing-library/jest-dom'
import { useRouter } from 'next/router'

// Mock API and Router
jest.mock('../../utils/api', () => ({
    getUsers: jest.fn(),
    deleteUser: jest.fn(),
    updateUserRole: jest.fn(),
    getUserProfile: jest.fn(),
    getCategories: jest.fn().mockResolvedValue([]),
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
}))

jest.mock('next/router', () => ({
    useRouter: jest.fn(),
}))

jest.mock('../../components/ui/Toast', () => ({
    useToast: jest.fn(() => ({ showToast: jest.fn() })),
}))

import { getUserProfile, getUsers } from '../../utils/api'

describe('Admin Dashboard', () => {
    const mockPush = jest.fn()

    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    })

    it('redirects if not admin', async () => {
        (getUserProfile as jest.Mock).mockResolvedValue({ role: 'user' })
        render(<AdminDashboard />)
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'))
    })

    it('renders user list if admin', async () => {
        (getUserProfile as jest.Mock).mockResolvedValue({ role: 'admin' });
        (getUsers as jest.Mock).mockResolvedValue([
            { id: '1', name: 'User 1', email: 'u1@test.com', role: 'user' }
        ])

        render(<AdminDashboard />)
        expect(await screen.findByText('User 1')).toBeInTheDocument()
    })
})
