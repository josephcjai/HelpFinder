import { render, screen } from '@testing-library/react'
import Home from '../../pages/index'
import '@testing-library/jest-dom'
import { getToken, getUserProfile, getTasks } from '../../utils/api'

// Mock the API utils
jest.mock('../../utils/api', () => ({
    apiBase: 'http://localhost:4000',
    authenticatedFetch: jest.fn(),
    getToken: jest.fn(),
    getUserProfile: jest.fn(),
    removeToken: jest.fn(),
    getTasks: jest.fn(),
    getBids: jest.fn(),
    placeBid: jest.fn(),
    acceptBid: jest.fn(),
    requestCompletion: jest.fn(),
    approveCompletion: jest.fn(),
    rejectCompletion: jest.fn(),
    reopenTask: jest.fn(),
    getCategories: jest.fn().mockResolvedValue([]),
}))

jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode; href: string }) => {
        return <a href={href}>{children}</a>
    }
})

describe('Home Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders title', async () => {
        (getTasks as jest.Mock).mockResolvedValue([])
        render(<Home />)
        expect(await screen.findByText('HelpFinder')).toBeInTheDocument()
    })

    it('renders login link when not logged in', async () => {
        (getToken as jest.Mock).mockReturnValue(null);
        (getTasks as jest.Mock).mockResolvedValue([])
        render(<Home />)
        const loginLinks = await screen.findAllByText('Login')
        expect(loginLinks.length).toBeGreaterThan(0)
    })

    it('renders welcome message when logged in', async () => {
        (getToken as jest.Mock).mockReturnValue('mock_token');
        (getUserProfile as jest.Mock).mockResolvedValue({
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'user'
        });
        (getTasks as jest.Mock).mockResolvedValue([])

        render(<Home />)

        expect(await screen.findByText((content, node) => {
            // Logic splits by space and takes first part: "Test User" -> "Test"
            const hasText = (node: Element) => node.textContent === 'Welcome back, Test!'
            const nodeHasText = hasText(node as Element)
            const childrenDontHaveText = Array.from(node?.children || []).every(
                child => !hasText(child)
            )
            return nodeHasText && childrenDontHaveText
        })).toBeInTheDocument()
    })
})
