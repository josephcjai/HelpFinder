import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getUserProfile, updateUserProfile, getMyCreatedTasks, getMyJobs, getMyBids } from '../utils/api'
import { UserProfile, Task, Bid } from '@helpfinder/shared'
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

    // Tabs
    const [activeTab, setActiveTab] = useState<'settings' | 'activity'>('activity')

    // Dashboard Data
    const [createdTasks, setCreatedTasks] = useState<Task[]>([])
    const [myJobs, setMyJobs] = useState<Task[]>([])
    const [myBids, setMyBids] = useState<Bid[]>([])

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
                const query = [profile.zipCode, profile.country].filter(Boolean).join(', ')
                if (query) {
                    geocodeAddress(query).then(res => {
                        if (res) {
                            setMapCenter([res.lat, res.lon])
                        }
                    })
                }
            }

            // Fetch Dashboard Data
            try {
                const [created, jobs, bids] = await Promise.all([
                    getMyCreatedTasks(),
                    getMyJobs(),
                    getMyBids()
                ])
                setCreatedTasks(created)
                setMyJobs(jobs)
                setMyBids(bids)
            } catch (err) {
                console.error('Failed to load dashboard data', err)
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
            <Navbar user={user} onLogout={() => { localStorage.removeItem('token'); router.push('/login') }} />
            <main className="container pb-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="heading-1">My Dashboard</h1>
                        <p className="text-secondary">Welcome back, {user?.name}</p>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('activity')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'activity' ? 'bg-white shadow text-primary' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            My Activity
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-white shadow text-primary' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            Profile Settings
                        </button>
                    </div>
                </div>

                {activeTab === 'settings' ? (
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 max-w-3xl mx-auto animate-fade-in">
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
                ) : (
                    <div className="space-y-8 animate-fade-in">
                        {/* Jobs in Progress (As Helper) */}
                        <section>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-green-600">work</span>
                                Jobs I'm Doing
                            </h2>
                            {myJobs.length === 0 ? (
                                <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 text-center text-sm text-secondary">
                                    You have no active jobs. <Link href="/" className="text-primary hover:underline">Find tasks</Link> to bid on!
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {myJobs.map(job => (
                                        <Link key={job.id} href={`/tasks/${job.id}`} className="block bg-white p-5 rounded-xl border border-slate-200 hover:border-primary hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-900 truncate">{job.title}</h3>
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                    {job.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-3">{job.category?.name || 'Uncategorized'}</p>
                                            <div className="text-sm font-medium text-gray-900">
                                                Budget: ${job.budgetMin} - ${job.budgetMax}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Tasks Created (As Requester) */}
                            <section>
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-600">post_add</span>
                                    Tasks I Created
                                </h2>
                                {createdTasks.length === 0 ? (
                                    <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 text-center text-sm text-secondary">
                                        You haven't posted any tasks yet.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {createdTasks.map(task => (
                                            <Link key={task.id} href={`/tasks/${task.id}`} className="block bg-white p-4 rounded-xl border border-slate-200 hover:border-primary transition-colors">
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-900">{task.title}</span>
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${task.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {task.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between mt-2 text-xs text-secondary">
                                                    <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                                                    <span>{task.bids?.length || 0} Bids</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* My Bids (As Helper) */}
                            <section>
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-purple-600">gavel</span>
                                    My Bids
                                </h2>
                                {myBids.length === 0 ? (
                                    <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 text-center text-sm text-secondary">
                                        You haven't placed any bids yet.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {myBids.map(bid => (
                                            <Link key={bid.id} href={`/tasks/${bid.task?.id}`} className="block bg-white p-4 rounded-xl border border-slate-200 hover:border-primary transition-colors">
                                                <div className="mb-1 font-medium text-gray-900">{bid.task?.title || 'Unavailable Task'}</div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-primary font-bold">${bid.amount}</span>
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${bid.status === 'accepted' ? 'bg-green-100 text-green-700' : bid.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                        {bid.status}
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                )}
            </main>
        </>
    )
}
