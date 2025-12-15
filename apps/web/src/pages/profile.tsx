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
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="font-display font-extrabold text-4xl md:text-5xl text-secondary dark:text-white mb-2 tracking-tight">My Dashboard</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">Track your jobs, manage listings, and monitor your bids.</p>
                    </div>
                    <div className="bg-white dark:bg-card-dark p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex shadow-sm self-start md:self-end">
                        <button
                            onClick={() => setActiveTab('activity')}
                            className={`px-6 py-2.5 font-semibold rounded-xl text-sm transition-colors ${activeTab === 'activity'
                                ? 'bg-primary/10 text-primary dark:text-blue-400'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            My Activity
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`px-6 py-2.5 font-medium rounded-xl text-sm transition-colors ${activeTab === 'settings'
                                ? 'bg-primary/10 text-primary dark:text-blue-400 font-semibold'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            Profile Settings
                        </button>
                    </div>
                </header>

                {activeTab === 'settings' ? (
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 max-w-3xl mx-auto animate-fade-in">
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="border-b border-slate-100 pb-6 mb-6">
                                <h2 className="text-xl font-bold mb-4 font-display">Account Details</h2>
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
                                <h2 className="text-xl font-bold mb-4 font-display">Address & Location</h2>
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
                                    className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all transform hover:-translate-y-0.5"
                                    disabled={saving}
                                    style={{ minWidth: '150px' }}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                        <div className="lg:col-span-7 flex flex-col gap-10">
                            {/* Jobs I'm Doing */}
                            <section>
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="material-icons-round text-success text-2xl">work_history</span>
                                    <h2 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100">Jobs I'm Doing</h2>
                                </div>
                                {myJobs.length === 0 ? (
                                    <div className="bg-slate-50 p-8 rounded-2xl border border-dashed border-slate-200 text-center text-slate-500">
                                        You have no active jobs. <Link href="/" className="text-primary hover:underline font-semibold">Find tasks</Link> to bid on!
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {myJobs.map(job => (
                                            <div key={job.id} className="group bg-card-light dark:bg-card-dark rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-soft hover:shadow-lg transition-all duration-300 relative overflow-hidden cursor-pointer" onClick={() => router.push(`/tasks/${job.id}`)}>
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="bg-blue-100 dark:bg-blue-900/30 text-primary dark:text-blue-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                                        {job.status.replace('_', ' ')}
                                                    </span>
                                                    <button className="text-slate-300 hover:text-slate-500 dark:hover:text-slate-300"><span className="material-icons-round">more_horiz</span></button>
                                                </div>
                                                <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-1 group-hover:text-primary transition-colors truncate">{job.title}</h3>
                                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{job.category?.name || 'Uncategorized'}</p>
                                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                                                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold">
                                                        <span className="material-icons-round text-sm text-slate-400">payments</span>
                                                        ${job.budgetMin} - ${job.budgetMax}
                                                    </div>
                                                    {job.status === 'completed' && (
                                                        <span className="text-xs text-green-500 dark:text-green-400 font-medium flex items-center gap-1">
                                                            <span className="material-icons-round text-[14px]">check_circle</span> Paid
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Tasks I Created */}
                            <section>
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="material-icons-round text-primary text-2xl">post_add</span>
                                    <h2 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100">Tasks I Created</h2>
                                </div>
                                {createdTasks.length === 0 ? (
                                    <div className="bg-slate-50 p-8 rounded-2xl border border-dashed border-slate-200 text-center text-slate-500">
                                        You haven't posted any tasks yet.
                                    </div>
                                ) : (
                                    <div className="bg-card-light dark:bg-card-dark rounded-2xl border border-slate-100 dark:border-slate-700 shadow-soft overflow-hidden">
                                        {createdTasks.map((task, idx) => (
                                            <div key={task.id} className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group ${idx !== createdTasks.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`} onClick={() => router.push(`/tasks/${task.id}`)}>
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 flex-shrink-0">
                                                        <span className="material-icons-round">handyman</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-display font-bold text-slate-800 dark:text-white text-lg group-hover:text-primary transition-colors">{task.title}</h3>
                                                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                            <span className="flex items-center gap-1"><span className="material-icons-round text-sm">calendar_today</span> {new Date(task.createdAt).toLocaleDateString()}</span>
                                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                            <span className="text-slate-400">{task.category?.name || 'General'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 self-end sm:self-center pl-16 sm:pl-0">
                                                    <div className="text-right">
                                                        <span className="block text-xs text-slate-400 uppercase font-bold tracking-wider">Status</span>
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold mt-1 ${task.status === 'open' ? 'bg-green-100 text-green-700' :
                                                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {task.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <div className="text-right border-l border-slate-100 dark:border-slate-700 pl-4">
                                                        <span className="block text-xs text-slate-400 uppercase font-bold tracking-wider">Bids</span>
                                                        <span className="block text-lg font-bold text-slate-700 dark:text-slate-200">{task.bids?.length || 0}</span>
                                                    </div>
                                                    <span className="material-icons-round text-slate-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>

                        <div className="lg:col-span-5">
                            <section className="h-full">
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="material-icons-round text-accent text-2xl">gavel</span>
                                    <h2 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100">My Bids</h2>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {myBids.length === 0 ? (
                                        <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 text-center text-sm text-secondary">
                                            You haven't placed any bids yet.
                                        </div>
                                    ) : (
                                        myBids.map(bid => (
                                            // @ts-ignore
                                            <div key={bid.id} className="bg-card-light dark:bg-card-dark rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-soft hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group" onClick={() => router.push(`/tasks/${bid.task?.id}`)}>
                                                <div className="flex justify-between items-start mb-2">
                                                    {/* @ts-ignore */}
                                                    <h3 className="font-display font-semibold text-lg text-slate-800 dark:text-white group-hover:text-primary transition-colors">{bid.task?.title || 'Unknown Task'}</h3>
                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase ${bid.status === 'accepted' ? 'bg-success/10 text-success' :
                                                        bid.status === 'pending' ? 'bg-accent/10 text-accent' :
                                                            'bg-red-100 text-red-600'
                                                        }`}>
                                                        {bid.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between mt-4">
                                                    <div>
                                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">My Offer</p>
                                                        <p className="text-xl font-bold text-primary dark:text-blue-400">${bid.amount}</p>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                                        <span className="material-icons-round text-slate-400 dark:text-slate-300 group-hover:text-white">arrow_forward</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center mt-2 group hover:border-primary/40 transition-colors cursor-pointer" onClick={() => router.push('/')}>
                                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <span className="material-icons-round text-slate-400">add</span>
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Find more tasks to bid on</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </main>
        </>
    )
}
