import Link from 'next/link'
import { UserProfile } from '@helpfinder/shared'

interface NavbarProps {
    user: UserProfile | null
    onLogout: () => void
}

export const Navbar = ({ user, onLogout }: NavbarProps) => {
    return (
        <nav className="navbar">
            <div className="container">
                <div className="nav-brand">HelpFinder</div>
                <div>
                    {user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-secondary">Welcome, <b>{user.name}</b></span>
                            {user.role === 'admin' && (
                                <Link href="/admin" className="btn btn-danger">
                                    Admin Dashboard
                                </Link>
                            )}
                            <button onClick={onLogout} className="btn btn-secondary">Logout</button>
                        </div>
                    ) : (
                        <div className="flex gap-4">
                            <Link href="/login" className="btn btn-secondary">Login</Link>
                            <Link href="/register" className="btn btn-primary">Register</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}
