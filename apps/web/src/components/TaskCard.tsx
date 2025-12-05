import { Task, UserProfile } from '@helpfinder/shared'
import { BidList } from './BidList'
import { authenticatedFetch } from '../utils/api'
import { useToast } from './ui/Toast'
import { useModal } from './ui/ModalProvider'
import { useTaskOperations } from '../hooks/useTaskOperations'
import Link from 'next/link'

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

    const {
        handleDelete,
        handleRequestCompletion,
        handleApproveCompletion,
        handleRejectCompletion,
        handleReopenTask
    } = useTaskOperations({ onRefresh, onDelete })

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
        <div
            onClick={handleCardClick}
            className="card card-hover flex flex-col h-full relative group cursor-pointer transition-all hover:shadow-md"
        >
            <div className="flex justify-between items-start mb-4">
                <h3 className="heading-2 hover:text-primary transition-colors" style={{ fontSize: '1.25rem', lineHeight: '1.4' }}>
                    {task.title}
                </h3>
                <span className={`badge badge-${task.status === 'open' ? 'success' : 'secondary'}`}>
                    {task.status.toUpperCase()}
                </span>
            </div>

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

                {user && (user.id === task.requesterId || user.role === 'admin') && (
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
                    <BidList task={task} user={user} onBidAccepted={onRefresh} />
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
    )
}
