import { Task, UserProfile } from '@helpfinder/shared'
import { BidList } from './BidList'
import { authenticatedFetch, placeBid, startTask } from '../utils/api'
import { useToast } from './ui/Toast'
import { useModal } from './ui/ModalProvider'
import { useTaskOperations } from '../hooks/useTaskOperations'
import { useState } from 'react'
import { ConfirmModal } from './ui/ConfirmModal'
import { useRouter } from 'next/router'

interface TaskCardProps {
    task: Task
    user: UserProfile | null
    onEdit: (task: Task) => void
    onDelete: (taskId: string) => void
    onRefresh: () => void
}

export const TaskCard = ({ task, user, onEdit, onDelete, onRefresh }: TaskCardProps) => {
    const router = useRouter()
    const { showToast } = useToast()
    const { showConfirmation } = useModal()
    const [showAcceptConfirm, setShowAcceptConfirm] = useState(false)

    const {
        handleDelete,
        handleStartTask,
        handleRequestCompletion,
        handleApproveCompletion,
        handleRejectCompletion,
        handleReopenTask
    } = useTaskOperations({ onRefresh, onDelete })

    const handleAcceptPrice = async () => {
        if (!task || !task.budgetMin) return
        try {
            await placeBid(task.id, task.budgetMin, "I accept the offer price.")
            showToast('Bid placed successfully!', 'success')
            setShowAcceptConfirm(false)
            onRefresh()
        } catch (e) {
            showToast('Failed to place bid', 'error')
        }
    }

    const handleCardClick = (e: React.MouseEvent) => {
        // Prevent navigation if clicking on buttons, inputs, or links
        const target = e.target as HTMLElement
        if (
            target.tagName === 'BUTTON' ||
            target.tagName === 'INPUT' ||
            target.tagName === 'A' ||
            target.closest('button') ||
            target.closest('a') ||
            target.closest('input')
        ) {
            return
        }
        router.push(`/tasks/${task.id}`)
    }

    const isOwner = user && user.id === task.requesterId
    const isAdmin = user && user.role === 'admin'
    const isHelper = user && user.id !== task.requesterId && user.role !== 'admin'

    return (
        <>
            <div
                onClick={handleCardClick}
                className="group flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer h-full"
            >
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                        {task.title}
                    </h3>
                    <span className={`badge ${task.status === 'open' ? 'badge-success' : 'badge-secondary'}`}>
                        {task.status}
                    </span>
                </div>

                <div className="flex items-baseline gap-2">
                    {typeof task.budgetMin === 'number' ? (
                        <>
                            <p className="text-2xl font-bold text-primary">${task.budgetMin}</p>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Budget</span>
                        </>
                    ) : (
                        <p className="text-xl font-bold text-secondary italic">Negotiable</p>
                    )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mt-auto">
                    <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">location_on</span>
                        <span>{task.latitude ? 'Location Set' : 'Remote/No Loc'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">group</span>
                        <span>{task.bids?.length || 0} Bids</span>
                    </div>
                </div>

                {/* Category Chip */}
                {task.category && (
                    <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {task.category.name}
                        </span>
                    </div>
                )}


                {/* Action Area (Divider) */}
                <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-2 space-y-3">

                    {/* Helper: Place Bid / Accept Price */}
                    {task.status === 'open' && isHelper && task.budgetMin && (
                        <div>
                            {task.bids?.some(b => b.helperId === user.id) ? (
                                <div className="p-2 bg-blue-50 text-blue-700 text-sm text-center rounded font-medium">
                                    You have placed a bid
                                </div>
                            ) : (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowAcceptConfirm(true) }}
                                    className="btn btn-sm btn-primary w-full"
                                >
                                    Accept Price: ${task.budgetMin}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Owner/Admin: Edit/Delete */}
                    {(isOwner || isAdmin) && (
                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(task) }}
                                className="btn btn-sm btn-secondary"
                            >
                                Edit
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(task) }}
                                className="btn btn-sm btn-danger"
                            >
                                Delete
                            </button>
                        </div>
                    )}

                    {/* Helper: Start Task */}
                    {task.status === 'accepted' && isHelper && task.bids?.some(b => b.helperId === user.id && b.status === 'accepted') && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleStartTask(task) }}
                            className="btn btn-primary w-full"
                        >
                            Start Task
                        </button>
                    )}

                    {/* Requester: Waiting Message */}
                    {task.status === 'accepted' && isOwner && (
                        <div className="p-2 bg-yellow-50 text-yellow-800 rounded-lg text-sm text-center">
                            Waiting for helper start...
                        </div>
                    )}

                    {/* Completion Workflow */}
                    {user && (
                        <div className="flex gap-2 flex-wrap">
                            {/* Helper: Request Completion */}
                            {task.status === 'in_progress' && task.bids?.some(b => b.status === 'accepted' && b.helperId === user.id) && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleRequestCompletion(task) }}
                                    className="btn btn-sm btn-primary w-full"
                                >
                                    Mark as Done
                                </button>
                            )}

                            {/* Requester: Approve/Reject Completion */}
                            {task.status === 'review_pending' && isOwner && (
                                <div className="flex gap-2 w-full">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleApproveCompletion(task) }}
                                        className="btn btn-sm btn-success flex-1"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRejectCompletion(task) }}
                                        className="btn btn-sm btn-danger flex-1"
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}

                            {/* Requester: Reopen Task */}
                            {task.status === 'completed' && isOwner && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleReopenTask(task) }}
                                    className="btn btn-sm btn-secondary w-full"
                                >
                                    Reopen Task
                                </button>
                            )}
                        </div>
                    )}

                    {/* Bid List Collapsible/Inline - Only show on open tasks for owner or if user has bid */}
                    {task.status === 'open' && user && (
                        <div className="text-sm">
                            <BidList task={task} user={user} onBidAccepted={onRefresh} onBidPlaced={onRefresh} />
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={showAcceptConfirm}
                onCancel={() => setShowAcceptConfirm(false)}
                onConfirm={handleAcceptPrice}
                title="Accept Offer Price"
                message={`Are you sure you want to bid $${task?.budgetMin} for this task?`}
                confirmText="Yes, Place Bid"
            />
        </>
    )
}
