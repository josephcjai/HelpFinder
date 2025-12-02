import { render, screen } from '@testing-library/react'
import Home from './index'
import '@testing-library/jest-dom'

// Mock the API utils
jest.mock('../utils/api', () => ({
    apiBase: 'http://localhost:4000',
    authenticatedFetch: jest.fn(),
    getToken: jest.fn(),
    getUserProfile: jest.fn(),
    removeToken: jest.fn(),
}))

import { getToken, getUserProfile } from '../utils/api'

describe('Home Page', () => {
    it('renders title', async () => {
        render(<Home />)
        expect(await screen.findByText('HelpFinder')).toBeInTheDocument()
    })

    it('renders login link when not logged in', async () => {
        (getToken as jest.Mock).mockReturnValue(null)
        render(<Home />)
        // Wait for loading to finish
        expect(await screen.findByText('Login')).toBeInTheDocument()
    })

    it('renders welcome message when logged in', async () => {
        (getToken as jest.Mock).mockReturnValue('mock_token');
        (getUserProfile as jest.Mock).mockResolvedValue({
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'user'
        })

        render(<Home />)

        // Wait for the profile to load
        expect(await screen.findByText((content, node) => {
            const hasText = (node: Element) => node.textContent === 'Welcome, Test User'
            const nodeHasText = hasText(node as Element)
            const childrenDontHaveText = Array.from(node?.children || []).every(
                child => !hasText(child)
            )
            return nodeHasText && childrenDontHaveText
        })).toBeInTheDocument()
    })
})
