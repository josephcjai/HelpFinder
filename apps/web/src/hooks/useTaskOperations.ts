import { Task } from '@helpfinder/shared'
import { requestCompletion, approveCompletion, rejectCompletion, reopenTask, authenticatedFetch, startTask } from '../utils/api'
import { useToast } from '../components/ui/Toast'
import { useModal } from '../components/ui/ModalProvider'

interface UseTaskOperationsProps {
    onRefresh: () => void
    onDelete?: (taskId: string) => void
}

export const useTaskOperations = ({ onRefresh, onDelete }: UseTaskOperationsProps) => {
    const { showToast } = useToast()
    const { showConfirmation } = useModal()

    const handleDelete = (task: Task) => {
        showConfirmation({
            title: `Delete "${task.title}"?`,
            message: 'This action cannot be undone.',
            onConfirm: async () => {
                try {
                    const res = await authenticatedFetch(`/tasks/${task.id}`, { method: 'DELETE' })
                    if (res.ok) {
                        if (onDelete) onDelete(task.id)
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

    const handleStartTask = (task: Task) => {
        showConfirmation({
            title: `Start "${task.title}"?`,
            message: 'This will mark the task as In Progress. The requester will no longer be able to edit the task details.',
            confirmText: 'Start Task',
            onConfirm: async () => {
                try {
                    await startTask(task.id)
                    showToast('Task started successfully', 'success')
                    onRefresh()
                } catch (e) {
                    showToast('Failed to start task', 'error')
                }
            }
        })
    }

    const handleRequestCompletion = (task: Task) => {
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

    const handleApproveCompletion = (task: Task) => {
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

    const handleRejectCompletion = (task: Task) => {
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

    const handleReopenTask = (task: Task) => {
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

    return {
        handleDelete,
        handleStartTask,
        handleRequestCompletion,
        handleApproveCompletion,
        handleRejectCompletion,
        handleReopenTask
    }
}
