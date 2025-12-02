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

export const getUserProfile = async () => {
    const res = await authenticatedFetch('/auth/profile')
    if (res.ok) {
        return res.json()
    }
    return null
}

export const getUsers = async () => {
    const res = await authenticatedFetch('/users')
    if (res.ok) return res.json()
    return []
}

export const deleteUser = async (id: string) => {
    return authenticatedFetch(`/users/${id}`, { method: 'DELETE' })
}

export const updateUserRole = async (id: string, role: string) => {
    return authenticatedFetch(`/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role })
    })
}
