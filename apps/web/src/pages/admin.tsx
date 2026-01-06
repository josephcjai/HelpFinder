import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { getUsers, deleteUser, updateUserRole, getUserProfile, removeToken } from '../utils/api'
import { UserProfile } from '@helpfinder/shared'
import { UserAvatar } from '../components/UserAvatar'
import { Navbar } from '../components/Navbar'
import { AdminCategoryManager } from '../components/AdminCategoryManager'

type User = {
    id: string
    email: string
    name: string
    role: 'user' | 'admin'
    isSuperAdmin?: boolean
}

export default function AdminDashboard() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [checkingAuth, setCheckingAuth] = useState(true)
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
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
            const data = await getUsers()
            setUsers(data)
        } catch (error) {
            console.error('Failed to load users', error)
        }
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return
        await deleteUser(id)
        loadUsers()
    }

    const handleRoleChange = async (id: string, newRole: string) => {
        await updateUserRole(id, newRole)
        loadUsers()
    }

    const handleLogout = () => {
        removeToken()
        router.push('/login')
    }

    // Mock status logic (could be real if backend provided)
    const getUserStatus = (user: User) => 'Active'
    const getStatusColor = (status: string) => 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'

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
                        <button className="px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm flex items-center gap-2">
                            <span className="material-icons-round text-lg">filter_list</span> Filter
                        </button>
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
                                    {users.map(u => (
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
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(getUserStatus(u))}`}>
                                                    {getUserStatus(u)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {u.isSuperAdmin ? (
                                                    <span className="text-gray-400 dark:text-gray-600 text-xs italic">Protected</span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleDelete(u.id)}
                                                        className="text-danger hover:text-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                                                    >
                                                        <span className="material-icons-round text-sm">delete</span> Delete
                                                    </button>
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
        </div>
    )
}
