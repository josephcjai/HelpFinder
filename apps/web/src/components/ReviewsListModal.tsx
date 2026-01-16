import { useState, useEffect } from 'react'
import { Review, UserProfile } from '@helpfinder/shared'
import { authenticatedFetch } from '../utils/api'
import { format } from 'date-fns'

interface ReviewsListModalProps {
    isOpen: boolean
    onClose: () => void
    userId: string
    userName: string
    initialRole?: 'helper' | 'requester'
}

export const ReviewsListModal = ({ isOpen, onClose, userId, userName, initialRole }: ReviewsListModalProps) => {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(false)
    const [filterRole, setFilterRole] = useState<'all' | 'helper' | 'requester'>(initialRole || 'all')

    useEffect(() => {
        if (isOpen && userId) {
            fetchReviews()
        }
    }, [isOpen, userId])

    // Update internal filter if initialRole changes when opening
    useEffect(() => {
        if (isOpen && initialRole) {
            setFilterRole(initialRole)
        }
    }, [isOpen, initialRole])

    const fetchReviews = async () => {
        setLoading(true)
        try {
            // Fetch all reviews for user
            const res = await authenticatedFetch(`/reviews/user/${userId}`)
            if (res.ok) {
                const data = await res.json()
                setReviews(data)
            }
        } catch (e) {
            console.error('Failed to fetch reviews', e)
        } finally {
            setLoading(false)
        }
    }

    const filteredReviews = reviews.filter(r => {
        if (filterRole === 'all') return true
        return r.targetRole === filterRole
    })

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-card-dark rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                        <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white">
                            Reviews for {userName}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            See what others are saying
                        </p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <span className="material-icons-round text-slate-500">close</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex gap-2 overflow-x-auto">
                    <button
                        onClick={() => setFilterRole('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterRole === 'all'
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                    >
                        All Reviews
                    </button>
                    <button
                        onClick={() => setFilterRole('helper')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterRole === 'helper'
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                    >
                        As Helper
                    </button>
                    <button
                        onClick={() => setFilterRole('requester')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterRole === 'requester'
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                    >
                        As Requester
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredReviews.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                            <span className="material-icons-round text-4xl mb-2 opacity-50">reviews</span>
                            <p>No reviews found for this role.</p>
                        </div>
                    ) : (
                        filteredReviews.map((review) => (
                            <div key={review.id} className="border-b border-slate-100 dark:border-slate-700 last:border-0 pb-6 last:pb-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {review.reviewer?.avatarInitials || review.reviewer?.name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-800 dark:text-white">
                                                {review.reviewer?.name || 'Unknown User'}
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                <span>{format(new Date(review.createdAt), 'MMM d, yyyy')}</span>
                                                <span>•</span>
                                                <span className="capitalize text-slate-400">
                                                    Rated as {review.targetRole}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-yellow-500">
                                        <span className="material-icons-round text-lg">star</span>
                                        <span className="font-bold">{review.rating}</span>
                                    </div>
                                </div>

                                {/* Task Context */}
                                {review.task && (
                                    <div className="mb-3 pl-[52px]">
                                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400">
                                            <span className="material-icons-round text-[14px]">task</span>
                                            Task: {review.task.title}
                                        </div>
                                    </div>
                                )}

                                {/* Comment */}
                                <div className="pl-[52px] text-slate-600 dark:text-slate-300">
                                    {review.comment || (
                                        <span className="italic text-slate-400">No comment provided</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
