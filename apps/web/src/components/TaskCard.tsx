import { Task, UserProfile } from '@helpfinder/shared'
import { BidList } from './BidList'
import { requestCompletion, approveCompletion, rejectCompletion, reopenTask, authenticatedFetch } from '../utils/api'
import { useToast } from './ui/Toast'
import { useModal } from './ui/ModalProvider'

interface TaskCardProps {
    task: Task
    user: UserProfile | null
    onEdit: (task: Task) => void
    onDelete: (taskId: string) => void
    onRefresh: () => void
}

export const TaskCard = ({ task, user, onEdit, onDelete, onRefresh }: TaskCardProps) => {
    const { showToast } = useToast()
    const { showConfirmation } = useModal()

    const handleDelete = () => {
        showConfirmation({
            title: `Delete "${task.title}"?`,
            message: 'This action cannot be undone.',
            onConfirm: async () => {
                try {
                    const res = await authenticatedFetch(`/tasks/${task.id}`, { method: 'DELETE' })
                    if (res.ok) {
                        onDelete(task.id)
                        showToast('Task deleted successfully', 'success')
                    } else {
                        const text = await res.text()
                        showToast(`Failed to delete task: ${text}`, 'error')
                    }
                } catch (err) {
                    showToast('Failed to delete task', 'error')
                }
            },
            isDangerous: true
        })
    }

    const handleRequestCompletion = () => {
        showConfirmation({
            title: `Mark "${task.title}" as Done?`,
            message: 'Are you sure you want to mark this task as done?',
            onConfirm: async () => {
                try {
                    await requestCompletion(task.id)
                    showToast('Completion requested successfully', 'success')
                    onRefresh()
                } catch (e) {
                    showToast('Failed to request completion', 'error')
                }
            }
        })
    }

    const handleApproveCompletion = () => {
        showConfirmation({
            title: `Approve "${task.title}"?`,
            message: 'This will close the task and mark it as completed.',
            onConfirm: async () => {
                try {
                    await approveCompletion(task.id)
                    showToast('Task completed successfully', 'success')
                    onRefresh()
                } catch (e) {
                    showToast('Failed to approve completion', 'error')
                }
            }
        })
    }

    const handleRejectCompletion = () => {
        showConfirmation({
            title: `Reject "${task.title}"?`,
            message: 'The task will return to "In Progress" status.',
            onConfirm: async () => {
                try {
                    await rejectCompletion(task.id)
                    showToast('Completion rejected', 'info')
                    onRefresh()
                } catch (e) {
                    showToast('Failed to reject completion', 'error')
                }
            },
            isDangerous: true
        })
    }

    const handleReopenTask = () => {
        showConfirmation({
            title: `Reopen "${task.title}"?`,
            message: 'Are you sure you want to reopen this task?',
            onConfirm: async () => {
                try {
                    await reopenTask(task.id)
                    showToast('Task reopened successfully', 'success')
                    onRefresh()
                } catch (e) {
                    showToast('Cannot reopen task (limit 14 days)', 'error')
                }
            }
        })
    }

    return (
        <div className="card card-hover flex flex-col h-full relative group">
            <div className="flex justify-between items-start mb-4">
                <h3 className="heading-2" style={{ fontSize: '1.25rem', lineHeight: '1.4' }}>{task.title}</h3>
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
                        <button onClick={() => onEdit(task)} className="btn btn-sm btn-secondary">Edit</button>
                        <button onClick={handleDelete} className="btn btn-sm btn-danger">Delete</button>
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
                        <button onClick={handleRequestCompletion} className="btn btn-sm btn-primary w-full">
                            Mark as Done
                        </button>
                    )}

                    {/* Requester: Approve/Reject Completion */}
                    {task.status === 'review_pending' && task.requesterId === user.id && (
                        <div className="flex gap-2 w-full">
                            <button onClick={handleApproveCompletion} className="btn btn-sm btn-success flex-1">
                                Approve
                            </button>
                            <button onClick={handleRejectCompletion} className="btn btn-sm btn-danger flex-1">
                                Reject
                            </button>
                        </div>
                    )}

                    {/* Requester: Reopen Task */}
                    {task.status === 'completed' && task.requesterId === user.id && (
                        <button onClick={handleReopenTask} className="btn btn-sm btn-secondary w-full">
                            Reopen Task
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
