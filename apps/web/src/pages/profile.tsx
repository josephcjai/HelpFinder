import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getUserProfile, updateUserProfile } from '../utils/api'
import { UserProfile } from '@helpfinder/shared'
import { Navbar } from '../components/Navbar'
import { useToast } from '../components/ui/Toast'

import { geocodeAddress } from '../utils/geocoding'

// Dynamically import MapComponent to avoid SSR issues
const MapComponent = dynamic(() => import('../components/MapComponent'), { ssr: false })

export default function ProfilePage() {
    const router = useRouter()
    const { showToast } = useToast()
    const [user, setUser] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Form State
    const [address, setAddress] = useState('')
    const [country, setCountry] = useState('')
    const [zipCode, setZipCode] = useState('')
    const [lat, setLat] = useState<number | undefined>(undefined)
    const [lng, setLng] = useState<number | undefined>(undefined)
    const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined)

    useEffect(() => {
        const init = async () => {
            const profile = await getUserProfile()
            if (!profile) {
                router.push('/login')
                return
            }
            setUser(profile)

            // Hydrate form
            setAddress(profile.address || '')
            setCountry(profile.country || '')
            setZipCode(profile.zipCode || '')
            setLat(profile.latitude)
            setLng(profile.longitude)

            if (profile.latitude && profile.longitude) {
                setMapCenter([profile.latitude, profile.longitude])
            } else if (profile.zipCode || profile.country) {
                // Fallback: Geocode address fields to set map center
                const query = [profile.zipCode, profile.country].filter(Boolean).join(', ')
                if (query) {
                    geocodeAddress(query).then(res => {
                        if (res) {
                            setMapCenter([res.lat, res.lon])
                        }
                    })
                }
            }

            setLoading(false)
        }
        init()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const updated = await updateUserProfile({
                address,
                country,
                zipCode,
                latitude: lat,
                longitude: lng
            })
            setUser(updated)
            showToast('Profile updated successfully', 'success')
        } catch (error) {
            showToast('Failed to update profile', 'error')
            console.error(error)
        }
        setSaving(false)
    }

    if (loading) {
        return <div className="flex justify-center py-12">Loading...</div>
    }

    return (
        <>
            <Navbar user={user} onLogout={() => router.push('/login')} />
            <main className="container pb-12">
                <h1 className="heading-1 mb-8">My Profile</h1>

                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 max-w-3xl mx-auto">
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="border-b border-slate-100 pb-6 mb-6">
                            <h2 className="text-xl font-bold mb-4">Account Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label">Name</label>
                                    <input className="input bg-slate-50" value={user?.name} disabled />
                                </div>
                                <div>
                                    <label className="label">Email</label>
                                    <input className="input bg-slate-50" value={user?.email} disabled />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold mb-4">Address & Location</h2>
                            <p className="text-secondary mb-4 text-sm">
                                This location will be used as the default for map searches and when posting new tasks.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="md:col-span-2">
                                    <label className="label">Address</label>
                                    <input
                                        className="input"
                                        placeholder="e.g. 123 Main St"
                                        value={address}
                                        onChange={e => setAddress(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="label">City / Country</label>
                                    <input
                                        className="input"
                                        placeholder="e.g. New York, USA"
                                        value={country}
                                        onChange={e => setCountry(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="label">Zip Code</label>
                                    <input
                                        className="input"
                                        placeholder="e.g. 10001"
                                        value={zipCode}
                                        onChange={e => setZipCode(e.target.value)}
                                    />
                                </div>
                            </div>

                            <label className="label mb-2">Default Location (Click map to set)</label>
                            <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height: '300px' }}>
                                <MapComponent
                                    selectedLocation={lat && lng ? { lat, lng } : null}
                                    onLocationSelect={(l, lg) => { setLat(l); setLng(lg) }}
                                    zoom={13}
                                    center={mapCenter}
                                />
                            </div>
                            {lat && <p className="text-sm text-secondary mt-2">Selected Coordinates: {lat.toFixed(4)}, {lng?.toFixed(4)}</p>}
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-end">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                                style={{ minWidth: '150px' }}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    )
}
