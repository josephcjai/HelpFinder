import { Task, UserProfile } from '@helpfinder/shared'
import { BidList } from './BidList'
import { authenticatedFetch } from '../utils/api'
import { useToast } from './ui/Toast'
import { useModal } from './ui/ModalProvider'
import { useTaskOperations } from '../hooks/useTaskOperations'
import Link from 'next/link'
import { useState } from 'react'
import { placeBid, startTask } from '../utils/api'
import { ConfirmModal } from './ui/ConfirmModal'

interface TaskCardProps {
    task: Task
    user: UserProfile | null
    onEdit: (task: Task) => void
    onDelete: (taskId: string) => void
    onRefresh: () => void
}

import { useRouter } from 'next/router'

// ... imports

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

    return (
        <>
            <div
                onClick={handleCardClick}
                className="card card-hover flex flex-col h-full relative group cursor-pointer transition-all hover:shadow-md"
            >
                <div className="flex justify-between items-start mb-4">
                    <h3 className="card-title hover:text-primary transition-colors">
                        {task.title}
                    </h3>
                    <span className={`badge badge-${task.status === 'open' ? 'success' : 'secondary'}`}>
                        {task.status.toUpperCase()}
                    </span>
                </div>

                {task.category && (
                    <div className="mb-2">
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            {task.category.name}
                        </span>
                    </div>
                )}

                <p className="text-secondary mb-6 flex-grow">{task.description || 'No description provided.'}</p>

                <div className="flex justify-between items-end mt-auto pt-4 border-t border-slate-100 w-full">
                    <div>
                        <div className="text-xs text-secondary uppercase font-bold tracking-wider mb-1">Budget</div>
                        {typeof task.budgetMin === 'number' ? (
                            <span className="font-bold text-2xl text-primary">${task.budgetMin}</span>
                        ) : (
                            <span className="text-secondary italic">Negotiable</span>
                        )}
                    </div>

                    {user && (user.id === task.requesterId || user.role === 'admin') && task.status === 'open' && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                </div>

                {task.status === 'open' && user && (
                    <div className="mt-4">
                        <div className="mt-4">
                            <BidList task={task} user={user} onBidAccepted={onRefresh} onBidPlaced={onRefresh} />
                        </div>
                    </div>
                )}

                {/* Accept Price Option */}
                {task.status === 'open' && user && user.id !== task.requesterId && user.role !== 'admin' && task.budgetMin && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
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

                {/* Helper Actions */}
                {task.status === 'accepted' && user && task.bids?.some(b => b.helperId === user.id && b.status === 'accepted') && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleStartTask(task)
                        }}
                        className="btn btn-primary w-full mt-4"
                    >
                        Start Task
                    </button>
                )}

                {/* Requester Status Message */}
                {task.status === 'accepted' && user && task.requesterId === user.id && (
                    <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm text-center">
                        Waiting for helper to start the task...
                    </div>
                )}

                {/* Completion Workflow Controls */}
                {user && (
                    <div className="mt-4 flex gap-2 flex-wrap">
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
                        {task.status === 'review_pending' && task.requesterId === user.id && (
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
                        {task.status === 'completed' && task.requesterId === user.id && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleReopenTask(task) }}
                                className="btn btn-sm btn-secondary w-full"
                            >
                                Reopen Task
                            </button>
                        )}
                    </div>
                )}
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
