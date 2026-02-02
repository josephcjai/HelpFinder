import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { getUsers, deleteUser, updateUserRole, getUserProfile, removeToken, blockUser, unblockUser, restoreUser } from '../utils/api'
import { UserProfile } from '@helpfinder/shared'
import { UserAvatar } from '../components/UserAvatar'
import { Navbar } from '../components/Navbar'
import { AdminCategoryManager } from '../components/AdminCategoryManager'
import { ConfirmModal } from '../components/ui/ConfirmModal'

type User = {
    id: string
    email: string
    name: string
    role: 'user' | 'admin'
    isSuperAdmin?: boolean
    isBlocked?: boolean
    deletedAt?: string
    restorationRequestedAt?: string
}

export default function AdminDashboard() {
    const [users, setUsers] = useState<User[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked' | 'deleted'>('all')
    const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all')
    const [loading, setLoading] = useState(true)
    const [checkingAuth, setCheckingAuth] = useState(true)
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean
        title: string
        message: string
        action: () => Promise<void>
        isDangerous: boolean
        confirmText: string
    }>({
        isOpen: false,
        title: '',
        message: '',
        action: async () => { },
        isDangerous: false,
        confirmText: 'Confirm'
    })
    const router = useRouter()

    useEffect(() => {
        const init = async () => {
            try {
                const profile = await getUserProfile()
                if (!profile || profile.role !== 'admin') {
                    await router.push('/login')
                    return
                }
                setCurrentUser(profile)
                setCheckingAuth(false)
                loadUsers()
            } catch (error) {
                router.push('/login')
            }
        }
        init()
    }, [])

    const loadUsers = async () => {
        setLoading(true)
        try {
            const data = await getUsers(searchQuery)
            setUsers(data)
        } catch (error) {
            console.error('Failed to load users', error)
        }
        setLoading(false)
    }

    const handleDelete = (user: User) => {
        setConfirmation({
            isOpen: true,
            title: 'Delete User',
            message: `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
            confirmText: 'Delete',
            isDangerous: true,
            action: async () => {
                await deleteUser(user.id)
                loadUsers()
            }
        })
    }

    const handleRestore = (user: User) => {
        setConfirmation({
            isOpen: true,
            title: 'Restore User',
            message: `Are you sure you want to restore ${user.name}? This will grant them login access again.`,
            confirmText: 'Restore',
            isDangerous: false,
            action: async () => {
                await restoreUser(user.id)
                loadUsers()
            }
        })
    }

    const handleRoleChange = async (id: string, newRole: string) => {
        await updateUserRole(id, newRole)
        loadUsers()
    }

    const handleBlock = (user: User) => {
        const isBlocked = !!user.isBlocked
        setConfirmation({
            isOpen: true,
            title: isBlocked ? 'Unblock User' : 'Block User',
            message: `Are you sure you want to ${isBlocked ? 'unblock' : 'block'} ${user.name}?`,
            confirmText: isBlocked ? 'Unblock' : 'Block',
            isDangerous: !isBlocked,
            action: async () => {
                try {
                    if (isBlocked) {
                        await unblockUser(user.id)
                    } else {
                        await blockUser(user.id)
                    }
                    loadUsers()
                } catch (error) {
                    console.error('Failed to update block status', error)
                    alert('Failed to update block status')
                }
            }
        })
    }

    const handleLogout = () => {
        removeToken()
        router.push('/login')
    }

    // Real status logic
    const getUserStatus = (user: User) => {
        if (user.deletedAt) return 'Deleted'
        if (user.isBlocked) return 'Blocked'
        return 'Active'
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Deleted':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            case 'Blocked':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            case 'Active':
            default:
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
        }
    }

    if (checkingAuth) {
        return (
            <div className="flex justify-center items-center h-screen bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-body text-text-light dark:text-text-dark transition-colors duration-300">
            {/* Navbar */}
            <Navbar user={currentUser} onLogout={handleLogout} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Link */}
                <div className="mb-6">
                    <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary transition-colors dark:text-gray-400">
                        <span className="material-icons-round text-base mr-1">arrow_back</span>
                        Back to Home
                    </Link>
                </div>

                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white tracking-tight">
                            User Management
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">Manage users, roles, and platform settings efficiently.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="pl-9 pr-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                            />
                            <span className="material-icons-round absolute left-2 top-2 text-gray-400 text-lg">search</span>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="px-3 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="blocked">Blocked</option>
                                <option value="deleted">Deleted</option>
                            </select>
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value as any)}
                                className="px-3 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="all">All Roles</option>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-glow flex items-center gap-2">
                            <span className="material-icons-round text-lg">add</span> Add User
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border border-white/50 dark:border-white/5 rounded-2xl shadow-soft overflow-hidden mb-12">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading users...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
                                    {users.filter(u => {
                                        // Status Filter
                                        if (filterStatus === 'active' && (u.isBlocked || u.deletedAt)) return false
                                        if (filterStatus === 'blocked' && !u.isBlocked) return false
                                        if (filterStatus === 'deleted' && !u.deletedAt) return false

                                        // Role Filter
                                        if (filterRole !== 'all' && u.role !== filterRole) return false

                                        return true
                                    }).map(u => (
                                        <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        {/* @ts-ignore */}
                                                        <UserAvatar user={u} size="md" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{u.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {u.isSuperAdmin ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                        Super Admin
                                                    </span>
                                                ) : u.deletedAt ? (
                                                    <span className="text-gray-400 dark:text-gray-600 text-xs italic">
                                                        —
                                                    </span>
                                                ) : (
                                                    <select
                                                        value={u.role}
                                                        onChange={e => handleRoleChange(u.id, e.target.value)}
                                                        className="block w-32 pl-3 pr-10 py-1.5 text-xs border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-white dark:bg-surface-dark dark:text-white shadow-sm"
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                )}
                                                {u.deletedAt && (
                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                                                        DELETED
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(getUserStatus(u))}`}>
                                                    {getUserStatus(u)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {u.isSuperAdmin ? (
                                                    <span className="text-gray-400 dark:text-gray-600 text-xs italic">Protected</span>
                                                ) : u.deletedAt ? (
                                                    <div className="flex justify-end gap-2">
                                                        {u.restorationRequestedAt ? (
                                                            <button
                                                                onClick={() => handleRestore(u)}
                                                                className="text-green-600 hover:text-green-700 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                                                                title="Restore User"
                                                            >
                                                                <span className="material-icons-round text-sm">restore_from_trash</span>
                                                                <span className="hidden sm:inline">Restore</span>
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-400 dark:text-gray-600 text-xs italic">Deleted</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleBlock(u)}
                                                            className={`px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 ${u.isBlocked
                                                                ? 'text-yellow-600 hover:text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/40'
                                                                : 'text-gray-600 hover:text-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                                }`}
                                                            title={u.isBlocked ? "Unblock User" : "Block User"}
                                                        >
                                                            <span className="material-icons-round text-sm">
                                                                {u.isBlocked ? 'lock_open' : 'block'}
                                                            </span>
                                                            <span className="hidden sm:inline">{u.isBlocked ? 'Unblock' : 'Block'}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(u)}
                                                            className="text-danger hover:text-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                                                            title="Delete User"
                                                        >
                                                            <span className="material-icons-round text-sm">delete</span>
                                                            <span className="hidden sm:inline">Delete</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30 flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Showing {users.length} users</p>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Prev</button>
                            <button className="px-3 py-1 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Next</button>
                        </div>
                    </div>
                </div>

                <AdminCategoryManager />
            </div>

            <ConfirmModal
                isOpen={confirmation.isOpen}
                title={confirmation.title}
                message={confirmation.message}
                confirmText={confirmation.confirmText}
                isDangerous={confirmation.isDangerous}
                onConfirm={async () => {
                    await confirmation.action()
                    setConfirmation(prev => ({ ...prev, isOpen: false }))
                }}
                onCancel={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
            />

            <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                    <p>© 2024 HelpFinder. All rights reserved.</p>
                    <div className="flex gap-4">
                        <a className="hover:text-primary transition-colors" href="#">Privacy</a>
                        <a className="hover:text-primary transition-colors" href="#">Terms</a>
                        <a className="hover:text-primary transition-colors" href="#">Support</a>
                    </div>
                </div>
            </footer>
        </div >
    )
}
