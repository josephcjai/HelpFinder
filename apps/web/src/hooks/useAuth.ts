import { useState, useEffect } from 'react'
import { UserProfile } from '@helpfinder/shared'
import { getUserProfile, getToken, updateUserProfile } from '../utils/api'

export const useAuth = () => {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadUser = async () => {
            const token = getToken()
            if (token) {
                try {
                    const profile = await getUserProfile()
                    if (profile) {
                        setUser(profile)

                        // Auto-detect currency if not set
                        if (!profile.currency) {
                            try {
                                let detectedCurrency = Intl.NumberFormat().resolvedOptions().currency || 'USD'
                                try {
                                    const res = await fetch('https://ipapi.co/json/')
                                    if (res.ok) {
                                        const data = await res.json()
                                        if (data.currency) detectedCurrency = data.currency
                                    }
                                } catch (e) {
                                    console.warn('IP currency detection failed, falling back to browser locale', e)
                                }
                                // We do this silently
                                await updateUserProfile({ ...profile, currency: detectedCurrency })
                                setUser(prev => prev ? { ...prev, currency: detectedCurrency } : null)
                            } catch (err) {
                                console.warn('Failed to detect/save default currency', err)
                            }
                        }
                    }
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
