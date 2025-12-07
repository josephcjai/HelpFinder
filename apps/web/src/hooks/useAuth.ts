import { useState, useEffect } from 'react'
import { UserProfile } from '@helpfinder/shared'
import { getUserProfile, getToken } from '../utils/api'

export const useAuth = () => {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadUser = async () => {
            const token = getToken()
            if (token) {
                try {
                    const profile = await getUserProfile()
                    setUser(profile)
                } catch (e) {
                    console.error('Failed to load user profile', e)
                }
            }
            setLoading(false)
        }
        loadUser()
    }, [])

    return { user, loading }
}
