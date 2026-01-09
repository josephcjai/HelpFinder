import { Task, Bid, Category, UserProfile } from '@helpfinder/shared'

export const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'

export const getToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token')
    }
    return null
}

export const setToken = (token: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('token', token)
    }
}

export const removeToken = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
    }
}

export const authenticatedFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = getToken()
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    const response = await fetch(`${apiBase}${endpoint}`, {
        ...options,
        headers,
    })

    if (response.status === 401) {
        removeToken()
        window.location.href = '/login'
    }

    return response
}

export const getUserProfile = async (): Promise<UserProfile | null> => {
    const res = await authenticatedFetch('/auth/profile')
    if (res.ok) {
        return res.json()
    }
    return null
}

export const updateUserProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    const res = await authenticatedFetch('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(updates),
    })
    if (res.ok) return res.json()
    if (res.ok) return res.json()
    throw new Error('Failed to update profile')
}

export const forgotPassword = async (email: string) => {
    const res = await authenticatedFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
    })
    if (res.ok) return res.json()
    throw new Error('Failed to send reset email')
}

export const resetPassword = async (token: string, newPass: string) => {
    const res = await authenticatedFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPass })
    })
    if (res.ok) return res.json()
    if (res.ok) return res.json()
    throw new Error('Failed to reset password')
}

export const verifyEmail = async (token: string) => {
    const res = await authenticatedFetch('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ token })
    })
    if (res.ok) return res.json()
    throw new Error('Verification failed')
}

export const resendVerification = async (email: string) => {
    const res = await authenticatedFetch('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email })
    })
    if (res.ok) return res.json()
    throw new Error('Failed to resend verification')
}

export const getTasks = async (lat?: number, lng?: number, radius?: number, category?: string): Promise<Task[]> => {
    const params = new URLSearchParams()
    if (lat !== undefined) params.append('lat', lat.toString())
    if (lng !== undefined) params.append('lng', lng.toString())
    if (radius !== undefined) params.append('radius', radius.toString())
    if (category) params.append('category', category)

    const res = await authenticatedFetch(`/tasks?${params.toString()}`)
    if (res.ok) {
        return res.json()
    }
    throw new Error('Failed to fetch tasks')
}

export const getTask = async (id: string): Promise<Task> => {
    const res = await authenticatedFetch(`/tasks/${id}`)
    if (res.ok) {
        return res.json()
    }
    throw new Error('Failed to fetch task')
}

export const createTask = async (task: Partial<Task>) => {
    return authenticatedFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify(task)
    })
}

export const updateTask = async (id: string, task: Partial<Task>) => {
    return authenticatedFetch(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(task)
    })
}

export const deleteTask = async (id: string) => {
    return authenticatedFetch(`/tasks/${id}`, {
        method: 'DELETE'
    })
}

export const placeBid = async (taskId: string, amount: number, message: string) => {
    const res = await authenticatedFetch(`/tasks/${taskId}/bids`, {
        method: 'POST',
        body: JSON.stringify({ amount, message })
    })
    if (res.ok) {
        return res.json()
    }
    throw new Error('Failed to place bid')
}

export const updateBid = async (bidId: string, amount: number, message: string) => {
    const res = await authenticatedFetch(`/bids/${bidId}`, {
        method: 'PATCH',
        body: JSON.stringify({ amount, message })
    })
    if (res.ok) {
        return res.json()
    }
    throw new Error('Failed to update bid')
}

export const getBids = async (taskId: string): Promise<Bid[]> => {
    const res = await authenticatedFetch(`/tasks/${taskId}/bids`)
    if (res.ok) {
        return res.json()
    }
    return []
}

export const withdrawBid = async (bidId: string) => {
    const res = await authenticatedFetch(`/bids/${bidId}`, {
        method: 'DELETE'
    })
    if (res.ok) {
        return res.json()
    }
    throw new Error('Failed to withdraw bid')
}

export const rejectBid = async (bidId: string) => {
    const res = await authenticatedFetch(`/bids/${bidId}/reject`, {
        method: 'POST'
    })
    if (res.ok) {
        return res.json()
    }
    throw new Error('Failed to reject bid')
}

export const deleteNotification = async (id: string) => {
    return authenticatedFetch(`/notifications/${id}`, {
        method: 'DELETE',
    })
}

export const acceptBid = async (bidId: string) => {
    const res = await authenticatedFetch(`/bids/${bidId}/accept`, {
        method: 'POST'
    })
    if (res.ok) {
        return res.json()
    }
    throw new Error('Failed to accept bid')
}

export const startTask = async (taskId: string) => {
    const res = await authenticatedFetch(`/tasks/${taskId}/start`, {
        method: 'POST'
    })
    if (res.ok) {
        return res.json()
    }
    throw new Error('Failed to start task')
}

export const requestCompletion = async (taskId: string) => {
    const res = await authenticatedFetch(`/tasks/${taskId}/complete-request`, {
        method: 'POST'
    })
    if (res.ok) {
        return res.json()
    }
    const text = await res.text()
    console.error('Request completion failed:', res.status, text)
    throw new Error(`Failed to request completion: ${text}`)
}

export const approveCompletion = async (taskId: string) => {
    const res = await authenticatedFetch(`/tasks/${taskId}/complete-approve`, {
        method: 'POST'
    })
    if (res.ok) {
        return res.json()
    }
    throw new Error('Failed to approve completion')
}

export const rejectCompletion = async (taskId: string) => {
    const res = await authenticatedFetch(`/tasks/${taskId}/complete-reject`, {
        method: 'POST'
    })
    if (res.ok) {
        return res.json()
    }
    throw new Error('Failed to reject completion')
}

export const reopenTask = async (taskId: string) => {
    const res = await authenticatedFetch(`/tasks/${taskId}/reopen`, {
        method: 'POST'
    })
    if (res.ok) {
        return res.json()
    }
    throw new Error('Failed to reopen task')
}

export const getUsers = async () => {
    const res = await authenticatedFetch('/users')
    if (res.ok) {
        return res.json()
    }
    throw new Error('Failed to fetch users')
}

export const getMyCreatedTasks = async (): Promise<Task[]> => {
    const res = await authenticatedFetch('/tasks/my-created')
    if (res.ok) return res.json()
    throw new Error('Failed to fetch my created tasks')
}

export const getMyJobs = async (): Promise<Task[]> => {
    const res = await authenticatedFetch('/tasks/my-jobs')
    if (res.ok) return res.json()
    throw new Error('Failed to fetch my jobs')
}

export const getMyBids = async (): Promise<Bid[]> => {
    const res = await authenticatedFetch('/bids/my-bids')
    if (res.ok) return res.json()
    throw new Error('Failed to fetch my bids')
}

export const deleteUser = async (id: string) => {
    return authenticatedFetch(`/users/${id}`, {
        method: 'DELETE'
    })
}

export const updateUserRole = async (id: string, role: string) => {
    return authenticatedFetch(`/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role })
    })
}

// Categories
export const getCategories = async (): Promise<Category[]> => {
    const res = await authenticatedFetch(`/categories`)
    if (res.ok) return res.json()
    throw new Error('Failed to fetch categories')
}

export const createCategory = async (name: string, icon?: string, color?: string): Promise<Category> => {
    const res = await authenticatedFetch(`/categories`, {
        method: 'POST',
        body: JSON.stringify({ name, icon, color })
    })
    if (res.ok) return res.json()
    throw new Error('Failed to create category')
}

export const updateCategory = async (id: string, name: string, icon?: string, color?: string): Promise<Category> => {
    const res = await authenticatedFetch(`/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, icon, color })
    })
    if (res.ok) return res.json()
    throw new Error('Failed to update category')
}

export const deleteCategory = async (id: string): Promise<void> => {
    const res = await authenticatedFetch(`/categories/${id}`, {
        method: 'DELETE'
    })
    if (!res.ok) throw new Error('Failed to delete category')
}
