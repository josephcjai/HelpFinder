import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { getUsers, deleteUser, updateUserRole, getUserProfile } from '../utils/api'
import { UserProfile } from '@helpfinder/shared'
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
    const router = useRouter()

    useEffect(() => {
        const init = async () => {
            const profile = await getUserProfile()
            if (!profile || profile.role !== 'admin') {
                router.push('/')
                return
            }
            loadUsers()
        }
        init()
    }, [])

    const loadUsers = async () => {
        setLoading(true)
        const data = await getUsers()
        setUsers(data)
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

    return (
        <>
            <nav className="navbar">
                <div className="container">
                    <div className="nav-brand">HelpFinder Admin</div>
                    <Link href="/" className="btn btn-secondary">Back to Home</Link>
                </div>
            </nav>

            <main className="container">
                <h1 className="heading-1">User Management</h1>
                <p className="text-secondary mb-8">Manage users and their roles.</p>

                {loading ? <p>Loading...</p> : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td>{u.name}</td>
                                        <td>{u.email}</td>
                                        <td>
                                            <select
                                                value={u.role}
                                                onChange={e => handleRoleChange(u.id, e.target.value)}
                                                className="input"
                                                style={{ padding: '0.25rem', fontSize: '0.875rem' }}
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td>
                                            {u.isSuperAdmin ? (
                                                <span className="text-secondary" style={{ fontSize: '0.875rem' }}>Super Admin</span>
                                            ) : (
                                                <button
                                                    onClick={() => handleDelete(u.id)}
                                                    className="btn btn-danger"
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-12">
                    <AdminCategoryManager />
                </div>
            </main >
        </>
    )
}
