import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Task, UserProfile } from '@helpfinder/shared'
import { authenticatedFetch, getUserProfile, getToken } from '../../utils/api'
import { Navbar } from '../../components/Navbar'
import { BidList } from '../../components/BidList'
import { useTaskOperations } from '../../hooks/useTaskOperations'
import dynamic from 'next/dynamic'
import { CreateTaskForm } from '../../components/CreateTaskForm'

const MapComponent = dynamic(() => import('../../components/MapComponent'), { ssr: false })

export default function TaskDetailsPage() {
    const router = useRouter()
    const { id } = router.query
    const [task, setTask] = useState<Task | null>(null)
    const [user, setUser] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)

    const loadTask = async () => {
        if (!id) return
        try {
            const res = await authenticatedFetch(`/tasks/${id}`)
            if (res.ok) {
                const data = await res.json()
                setTask(data)
            } else {
                router.push('/')
            }
        } catch (e) {
            router.push('/')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const init = async () => {
            if (getToken()) {
                const profile = await getUserProfile()
                setUser(profile)
            }
            if (id) loadTask()
        }
        init()
    }, [id])

    const {
        handleDelete,
        handleRequestCompletion,
        handleApproveCompletion,
        handleRejectCompletion,
        handleReopenTask
    } = useTaskOperations({
        onRefresh: loadTask,
        onDelete: () => router.push('/')
    })

    if (loading) return <div className="flex justify-center p-12">Loading...</div>
    if (!task) return null

    const isOwner = user && user.id === task.requesterId
    const isAdmin = user && user.role === 'admin'
    const canEdit = isOwner || isAdmin

    const handleLogout = () => {
        localStorage.removeItem('token')
        setUser(null)
        router.push('/')
    }

    if (isEditing) {
        return (
            <>
                <Navbar user={user} onLogout={handleLogout} />
                <main className="container py-8">
                    <div className="max-w-2xl mx-auto">
                        <CreateTaskForm
                            editingTask={task}
                            onTaskSaved={(updatedTask) => {
                                setTask(updatedTask)
                                setIsEditing(false)
                            }}
                            onCancel={() => setIsEditing(false)}
                        />
                    </div>
                </main>
            </>
        )
    }

    return (
        <>
            <Navbar user={user} onLogout={handleLogout} />
            <main className="container py-8">
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/')}
                        className="btn btn-secondary btn-sm mb-6 gap-2 hover:bg-slate-100 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to Tasks
                    </button>

                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="heading-1 mb-2">{task.title}</h1>
                            <div className="flex gap-2 items-center">
                                <span className={`badge badge-${task.status === 'open' ? 'success' : 'secondary'}`}>
                                    {task.status.toUpperCase()}
                                </span>
                                <span className="text-secondary text-sm">
                                    Posted by {task.requester?.name || 'Unknown'}
                                </span>
                            </div>
                        </div>
                        {canEdit && (
                            <div className="flex gap-2">
                                <button onClick={() => setIsEditing(true)} className="btn btn-secondary">Edit</button>
                                <button onClick={() => handleDelete(task)} className="btn btn-danger">Delete</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Details */}
                    <div className="md:col-span-2 space-y-8">
                        <div className="card">
                            <h2 className="heading-2 mb-4">Description</h2>
                            <p className="text-lg text-slate-700 whitespace-pre-wrap">
                                {task.description || 'No description provided.'}
                            </p>
                        </div>

                        <div className="card">
                            <h2 className="heading-2 mb-4">Location</h2>
                            {(task.address || task.country || task.zipCode) && (
                                <div className="mb-4 text-slate-700 flex items-start gap-2">
                                    <span className="mt-1">📍</span>
                                    <div>
                                        {task.address && <div className="font-medium">{task.address}</div>}
                                        <div className="text-secondary">
                                            {[task.zipCode, task.country].filter(Boolean).join(', ')}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {task.latitude && task.longitude ? (
                                <div className="map-container">
                                    <MapComponent
                                        tasks={[task]}
                                        zoom={15}
                                        center={[task.latitude, task.longitude]}
                                    />
                                </div>
                            ) : (
                                <p className="text-secondary italic">No map location provided.</p>
                            )}
                        </div>

                        {/* Bidding Section */}
                        {task.status === 'open' && user && (
                            <div className="card">
                                <h2 className="heading-2 mb-4">Bids</h2>
                                <BidList task={task} user={user} onBidAccepted={loadTask} />
                            </div>
                        )}
                    </div>

                    {/* Right Column: Sidebar */}
                    <div className="space-y-6">
                        <div className="card bg-slate-50 border-slate-200">
                            <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-2">Budget</h3>
                            {typeof task.budgetMin === 'number' ? (
                                <span className="font-bold text-3xl text-primary">${task.budgetMin}</span>
                            ) : (
                                <span className="text-xl text-secondary italic">Negotiable</span>
                            )}
                        </div>

                        {/* Workflow Actions */}
                        {user && (
                            <div className="card">
                                <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-4">Actions</h3>
                                <div className="flex flex-col gap-2">
                                    {/* Helper: Request Completion */}
                                    {task.status === 'in_progress' && task.bids?.some(b => b.status === 'accepted' && b.helperId === user.id) && (
                                        <button onClick={() => handleRequestCompletion(task)} className="btn btn-primary w-full">
                                            Mark as Done
                                        </button>
                                    )}

                                    {/* Requester: Approve/Reject Completion */}
                                    {task.status === 'review_pending' && task.requesterId === user.id && (
                                        <>
                                            <div className="p-3 bg-amber-50 text-amber-800 rounded mb-2 text-sm">
                                                The helper has marked this task as done. Please review.
                                            </div>
                                            <button onClick={() => handleApproveCompletion(task)} className="btn btn-success w-full">
                                                Approve & Close
                                            </button>
                                            <button onClick={() => handleRejectCompletion(task)} className="btn btn-danger w-full">
                                                Reject
                                            </button>
                                        </>
                                    )}

                                    {/* Requester: Reopen Task */}
                                    {task.status === 'completed' && task.requesterId === user.id && (
                                        <button onClick={() => handleReopenTask(task)} className="btn btn-secondary w-full">
                                            Reopen Task
                                        </button>
                                    )}

                                    {/* Fallback if no actions */}
                                    {task.status === 'open' && !canEdit && (
                                        <p className="text-sm text-secondary">
                                            {user.id === task.requesterId ? 'Waiting for bids...' : 'Place a bid to start!'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    )
}
