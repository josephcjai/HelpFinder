
import { useState } from 'react'

interface AddUserModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: { name: string, email: string, role: string }) => Promise<void>
}

export function AddUserModal({ isOpen, onClose, onSubmit }: AddUserModalProps) {
    const [email, setEmail] = useState('')
    const [name, setName] = useState('')
    const [role, setRole] = useState('user')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            await onSubmit({ name, email, role })
            onClose()
            // Reset form
            setName('')
            setEmail('')
            setRole('user')
        } catch (err: any) {
            setError(err.message || 'Failed to invite user')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all border border-white/10">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Invite New User</h2>
                <p className="text-sm text-gray-500 mb-6">
                    Enter the user's details. They will receive an email to set their password.
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white"
                            placeholder="john@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white appearance-none"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="flex gap-3 justify-end mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Sending Invite...
                                </>
                            ) : (
                                <>
                                    <span className="material-icons-round text-sm">send</span>
                                    Send Invite
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
