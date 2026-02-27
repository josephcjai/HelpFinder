import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Task, UserProfile } from '@helpfinder/shared'
import { authenticatedFetch, getUserProfile, getToken, getTask } from '../../utils/api'
import { getCategoryColorClasses } from '../../utils/colors'
import { formatCurrency } from '../../utils/format' // Add this
import { Navbar } from '../../components/Navbar'
import { BidList } from '../../components/BidList'
import { useTaskOperations } from '../../hooks/useTaskOperations'
import dynamic from 'next/dynamic'
import { CreateTaskForm } from '../../components/CreateTaskForm'
import { placeBid } from '../../utils/api'
import { useToast } from '../../components/ui/Toast'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { ChatBox } from '../../components/ChatBox'
import { UserAvatar } from '../../components/UserAvatar'
import { ReviewModal } from '../../components/ReviewModal'
import { ReviewsListModal } from '../../components/ReviewsListModal'
import { createReview, getTaskReviews, updateReview } from '../../utils/api'

const MapComponent = dynamic(() => import('../../components/MapComponent'), { ssr: false })

export default function TaskDetailsPage() {
    const router = useRouter()
    const { id } = router.query
    const [task, setTask] = useState<Task | null>(null)
    const [user, setUser] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [showAcceptConfirm, setShowAcceptConfirm] = useState(false)
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [submittingReview, setSubmittingReview] = useState(false)
    const [myReview, setMyReview] = useState<any>(null)
    const [isEditingReview, setIsEditingReview] = useState(false)
    const { showToast } = useToast()

    // Reviews List Modal (viewing reviews)
    const [showReviewsListModal, setShowReviewsListModal] = useState(false)
    const [reviewsListTargetId, setReviewsListTargetId] = useState('')
    const [reviewsListTargetName, setReviewsListTargetName] = useState('')

    const handleReviewSubmit = async (rating: number, comment: string) => {
        if (!task || !user) return
        setSubmittingReview(true)

        try {
            if (isEditingReview && myReview) {
                await updateReview(myReview.id, rating, comment)
                showToast('Review updated successfully!', 'success')
            } else {
                // Determine role and target user
                const acceptedBid = task.bids?.find(b => b.status === 'accepted')
                let targetRole: 'helper' | 'requester' = 'helper'
                let targetUserId: string = ''

                if (user.id === task.requesterId) {
                    if (!acceptedBid) throw new Error('No accepted bid found')
                    targetRole = 'helper'
                    targetUserId = acceptedBid.helperId
                } else {
                    targetRole = 'requester'
                    targetUserId = task.requesterId
                }

                await createReview(task.id, targetUserId, targetRole, rating, comment)
                showToast('Review submitted successfully!', 'success')
            }
            setShowReviewModal(false)
            setIsEditingReview(false)
            loadReviews()
        } catch (e: any) {
            showToast(e.message || 'Failed to submit review.', 'error')
        } finally {
            setSubmittingReview(false)
        }
    }

    const loadReviews = async () => {
        if (!id || !user) return
        try {
            const reviews = await getTaskReviews(id as string)
            const mine = reviews.find((r: any) => r.reviewerId === user.id)
            setMyReview(mine || null)
        } catch (e) {
            console.error('Failed to load reviews')
        }
    }

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

    useEffect(() => {
        if (task && task.status === 'completed' && user) {
            loadReviews()
        }
    }, [task?.status, user?.id])

    const {
        handleDelete,
        handleStartTask,
        handleRequestCompletion,
        handleApproveCompletion,
        handleRejectCompletion,
        handleReopenTask
    } = useTaskOperations({
        onRefresh: loadTask,
        onDelete: () => router.push('/')
    })

    const handleAcceptPrice = async () => {
        if (!task || !task.budgetMin) return
        try {
            await placeBid(task.id, task.budgetMin, "I accept the offer price.")
            showToast('Bid placed successfully!', 'success')
            setShowAcceptConfirm(false)
            loadTask()
        } catch (e) {
            showToast('Failed to place bid', 'error')
        }
    }

    const openReviewsList = (userId: string, name: string) => {
        setReviewsListTargetId(userId)
        setReviewsListTargetName(name)
        setShowReviewsListModal(true)
    }

    if (loading) return <div className="flex justify-center p-12">Loading...</div>
    if (!task) return null

    const isOwner = user && user.id === task.requesterId
    const isAdmin = user && user.role === 'admin'
    // Can edit only if open AND no active bids (admin can always edit)
    const hasActiveBids = task.bids ? task.bids.some(b => b.status === 'pending' || b.status === 'accepted') : false

    const canEdit = (isOwner && task.status === 'open' && !hasActiveBids) || isAdmin

    const handleLogout = () => {
        localStorage.removeItem('token')
        router.push('/login')
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
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={() => router.push('/')}
                            className="btn btn-secondary btn-sm gap-2 hover:bg-slate-100 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            Back to Home
                        </button>
                        <button
                            onClick={() => router.push('/profile')}
                            className="btn btn-secondary btn-sm gap-2 hover:bg-slate-100 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">person</span>
                            Back to Dashboard
                        </button>
                    </div>

                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="heading-1 mb-2">{task.title}</h1>
                            <div className="flex gap-2 items-center">
                                <span className={`badge badge-${task.status === 'open' ? 'success' : 'secondary'}`}>
                                    {task.status.toUpperCase()}
                                </span>
                                <div className="flex items-center gap-2 text-secondary text-sm">
                                    {task.requester && <UserAvatar user={task.requester} size="sm" />}
                                    <div className="flex flex-col">
                                        <span>Posted by {task.requester?.name || 'Unknown'}</span>
                                        {/* Requester Rating */}
                                        <button
                                            onClick={() => task.requesterId && openReviewsList(task.requesterId, task.requester?.name || 'Requester')}
                                            className="flex items-center gap-1 text-xs text-yellow-500 hover:text-yellow-600 transition-colors cursor-pointer"
                                        >
                                            <span className="material-icons-round text-[12px]">star</span>
                                            <span className="font-bold">{task.requester?.requesterRating?.toFixed(1) || '0.0'}</span>
                                            <span className="text-slate-400 hover:text-slate-500">({task.requester?.requesterRatingCount || 0})</span>
                                        </button>
                                    </div>
                                </div>
                                {task.category && (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1 border border-transparent ${getCategoryColorClasses(task.category.color)}`}>
                                        {task.category.icon && <span className="material-icons-round text-[14px]">{task.category.icon}</span>}
                                        {task.category.name}
                                    </span>
                                )}
                            </div>
                        </div>
                        {(isOwner && task.status === 'open' || isAdmin) && (
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={() => {
                                        if (hasActiveBids && !isAdmin) {
                                            showToast('Cannot edit task while there are active bids. Please reject them first.', 'error')
                                        } else {
                                            setIsEditing(true)
                                        }
                                    }}
                                    className={`btn btn-secondary ${hasActiveBids && !isAdmin ? 'opacity-75' : ''}`}
                                    title={hasActiveBids && !isAdmin ? "Reject active bids to edit" : "Edit Task"}
                                >
                                    Edit
                                </button>
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
                                        tasks={[task] as any}
                                        zoom={15}
                                        center={[task.latitude, task.longitude]}
                                    />
                                </div>
                            ) : (
                                <p className="text-secondary italic">No map location provided.</p>
                            )}
                        </div>

                        {/* Bidding Section */}
                        {(task.status === 'open' || task.status === 'accepted') && user && (
                            <div className="card">
                                <h2 className="heading-2 mb-4">Bids</h2>
                                <BidList task={task} user={user} onBidAccepted={loadTask} onBidPlaced={loadTask} />
                            </div>
                        )}

                        {/* In-App Chat Section */}
                        {user && (task.status === 'accepted' || task.status === 'in_progress' || task.status === 'review_pending' || task.status === 'completed' || task.status === 'cancelled') && (
                            <div className="mt-8">
                                <ChatBox
                                    taskId={task.id}
                                    user={user}
                                    isArchived={['completed', 'cancelled'].includes(task.status)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Right Column: Sidebar */}
                    <div className="space-y-6">
                        <div className="card bg-slate-50 border-slate-200">
                            <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-2">Budget</h3>
                            {typeof task.budgetMin === 'number' ? (
                                // @ts-ignore
                                <span className="font-bold text-3xl text-primary">{formatCurrency(task.budgetMin, task.currency || 'USD')}</span>
                            ) : (
                                <span className="text-xl text-secondary italic">Negotiable</span>
                            )}
                        </div>

                        {/* Accept Price Option */}
                        {task.status === 'open' && user && !isOwner && task.budgetMin && (
                            <div className="card mt-4 bg-indigo-50 border-indigo-100">
                                <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-2">Instant Accept</h3>
                                {task.bids?.some(b => b.helperId === user.id) ? (
                                    <div className="p-3 bg-white/50 rounded text-indigo-800 text-sm font-medium text-center">
                                        You have already placed a bid on this task.
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm text-indigo-700 mb-3">
                                            {/* @ts-ignore */}
                                            Agree to the requested price of <strong>{formatCurrency(task.budgetMin, task.currency || 'USD')}</strong>?
                                        </p>
                                        <button
                                            onClick={() => setShowAcceptConfirm(true)}
                                            className="btn btn-primary w-full"
                                        >
                                            {/* @ts-ignore */}
                                            Accept Price: {formatCurrency(task.budgetMin, task.currency || 'USD')}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Workflow Actions */}
                        {user && (
                            <div className="card">
                                <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-4">Actions</h3>
                                <div className="flex flex-col gap-2">
                                    {/* Helper: Start Task */}
                                    {task.status === 'accepted' && task.bids?.some(b => b.status === 'accepted' && b.helperId === user.id) && (
                                        <button onClick={() => handleStartTask(task)} className="btn btn-primary w-full">
                                            Start Task
                                        </button>
                                    )}

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

                                    {/* Leave Review - For both Requester and Helper when completed */}
                                    {task.status === 'completed' && (
                                        (task.requesterId === user.id) ||
                                        (task.bids?.some(b => b.status === 'accepted' && b.helperId === user.id))
                                    ) && (
                                            myReview ? (
                                                <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold text-sm text-slate-700">Your Review</h4>
                                                        {((new Date().getTime() - new Date(myReview.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000) && (
                                                            <button
                                                                onClick={() => { setIsEditingReview(true); setShowReviewModal(true) }}
                                                                className="text-xs text-primary hover:underline font-medium"
                                                            >
                                                                Edit
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1 mb-2 text-yellow-500">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <span key={star} className={`material-icons-round text-sm ${star <= myReview.rating ? '' : 'text-slate-200'}`}>star</span>
                                                        ))}
                                                    </div>
                                                    {myReview.comment && <p className="text-sm text-slate-600 italic">"{myReview.comment}"</p>}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => { setIsEditingReview(false); setShowReviewModal(true) }}
                                                    className="btn btn-primary w-full mt-2 bg-gradient-to-r from-yellow-500 to-amber-500 border-none text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50"
                                                >
                                                    <span className="material-icons-round text-sm mr-2">star</span>
                                                    Leave Review
                                                </button>
                                            )
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
            </main >

            <ConfirmModal
                isOpen={showAcceptConfirm}
                onCancel={() => setShowAcceptConfirm(false)}
                onConfirm={handleAcceptPrice}
                title="Accept Offer Price"
                // @ts-ignore
                message={`Are you sure you want to bid ${formatCurrency(task?.budgetMin || 0, task?.currency || 'USD')} for this task?`}
                confirmText="Yes, Place Bid"
                requireAgreement={true}
                agreementText="I agree to the Terms of Service. HelpFinder is a matching service and carries no liability."
            />

            <ReviewModal
                isOpen={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                onSubmit={handleReviewSubmit}
                title={isEditingReview ? "Edit Your Review" : "Rate Your Experience"}
                isSubmitting={submittingReview}
                initialRating={isEditingReview && myReview ? myReview.rating : 0}
                initialComment={isEditingReview && myReview ? myReview.comment : ''}
            />

            {/* New Reviews List Modal (Read) */}
            <ReviewsListModal
                isOpen={showReviewsListModal}
                onClose={() => setShowReviewsListModal(false)}
                userId={reviewsListTargetId}
                userName={reviewsListTargetName}
                initialRole={reviewsListTargetId === task.requesterId ? "requester" : "helper"}
            />
        </>
    )
}
