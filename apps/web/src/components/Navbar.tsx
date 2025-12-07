import Link from 'next/link'
import { UserProfile } from '@helpfinder/shared'
import { NotificationBell } from './NotificationBell'

interface NavbarProps {
    user: UserProfile | null
    onLogout: () => void
}

export const Navbar = ({ user, onLogout }: NavbarProps) => {
    return (
        <nav className="navbar glass">
            <div className="container">
                <Link href="/" className="nav-brand flex items-center gap-2">
                    <span>🤝</span> HelpFinder
                </Link>
                <div>
                    {user ? (
                        <div className="flex items-center gap-4">
                            <NotificationBell />
                            <span className="text-secondary text-sm hidden-mobile">Welcome, <b>{user.name}</b></span>
                            {user.role === 'admin' && (
                                <Link href="/admin" className="btn btn-sm btn-danger">
                                    Admin
                                </Link>
                            )}
                            <button onClick={onLogout} className="btn btn-sm btn-secondary">Logout</button>
                        </div>
                    ) : (
                        <div className="flex gap-4">
                            <Link href="/login" className="btn btn-sm btn-secondary">Login</Link>
                            <Link href="/register" className="btn btn-sm btn-primary">Register</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}
