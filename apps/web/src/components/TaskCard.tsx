import { Task, UserProfile } from '@helpfinder/shared'
import { BidList } from './BidList'
import { requestCompletion, approveCompletion, rejectCompletion, reopenTask, authenticatedFetch } from '../utils/api'

interface TaskCardProps {
    task: Task
    user: UserProfile | null
    onEdit: (task: Task) => void
    onDelete: (taskId: string) => void
    onRefresh: () => void
}

export const TaskCard = ({ task, user, onEdit, onDelete, onRefresh }: TaskCardProps) => {
    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this task?')) return
        try {
            const res = await authenticatedFetch(`/tasks/${task.id}`, { method: 'DELETE' })
            if (res.ok) {
                onDelete(task.id)
            } else {
                const text = await res.text()
                alert(`Failed to delete task: ${res.status} ${text}`)
            }
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="card">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="heading-2" style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{task.title}</h3>
                    <p className="text-secondary mb-4">{task.description || 'No description provided.'}</p>
                    <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center gap-2">
                            {typeof task.budgetMin === 'number' && (
                                <span className="font-bold text-lg text-primary">${task.budgetMin}</span>
                            )}
                            <span className={`badge badge-${task.status === 'open' ? 'success' : 'secondary'}`}>
                                {task.status.toUpperCase()}
                            </span>
                        </div>
                        {user && (user.id === task.requesterId || user.role === 'admin') && (
                            <div className="flex gap-2">
                                <button onClick={() => onEdit(task)} className="btn btn-sm btn-secondary">Edit</button>
                                <button onClick={handleDelete} className="btn btn-sm btn-danger">Delete</button>
                            </div>
                        )}
                    </div>

                    {task.status === 'open' && user && (
                        <BidList task={task} user={user} onBidAccepted={onRefresh} />
                    )}

                    {/* Completion Workflow Controls */}
                    {user && (
                        <div className="mt-4 flex gap-2">
                            {/* Helper: Request Completion */}
                            {task.status === 'in_progress' && task.bids?.some(b => b.status === 'accepted' && b.helperId === user.id) && (
                                <button onClick={async () => {
                                    if (confirm('Mark this task as done?')) {
                                        await requestCompletion(task.id)
                                        onRefresh()
                                    }
                                }} className="btn btn-sm btn-primary">
                                    Mark as Done
                                </button>
                            )}

                            {/* Requester: Approve/Reject Completion */}
                            {task.status === 'review_pending' && task.requesterId === user.id && (
                                <>
                                    <button onClick={async () => {
                                        if (confirm('Approve completion and close task?')) {
                                            await approveCompletion(task.id)
                                            onRefresh()
                                        }
                                    }} className="btn btn-sm btn-success">
                                        Approve & Close
                                    </button>
                                    <button onClick={async () => {
                                        if (confirm('Reject completion? Task will return to In Progress.')) {
                                            await rejectCompletion(task.id)
                                            onRefresh()
                                        }
                                    }} className="btn btn-sm btn-danger">
                                        Reject
                                    </button>
                                </>
                            )}

                            {/* Requester: Reopen Task */}
                            {task.status === 'completed' && task.requesterId === user.id && (
                                <button onClick={async () => {
                                    if (confirm('Reopen this task?')) {
                                        try {
                                            await reopenTask(task.id)
                                            onRefresh()
                                        } catch (e) { alert('Cannot reopen task (limit 14 days)') }
                                    }
                                }} className="btn btn-sm btn-secondary">
                                    Reopen Task
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
