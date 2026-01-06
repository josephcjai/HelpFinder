import Link from 'next/link'
import { UserAvatar } from './UserAvatar'
import { UserProfile } from '@helpfinder/shared'
import { NotificationBell } from './NotificationBell'

interface NavbarProps {
    user: UserProfile | null
    onLogout: () => void
    isLoading?: boolean
}

export const Navbar = ({ user, onLogout, isLoading }: NavbarProps) => {
    return (
        <div className="w-full border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <header className="flex items-center justify-between whitespace-nowrap py-4">
                    <div className="flex items-center gap-4 text-gray-900 dark:text-white">
                        <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                            <div className="w-6 h-6 text-primary">
                                <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                    <path clipRule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" fillRule="evenodd"></path>
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold tracking-tight">HelpFinder</h2>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
                        {isLoading ? (
                            // Loading Skeleton
                            <div className="flex items-center gap-4 animate-pulse">
                                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                            </div>
                        ) : !user ? (
                            <>
                                <div className="flex items-center gap-9">
                                    <a className="text-sm font-medium text-gray-800 hover:text-primary dark:text-gray-200 dark:hover:text-primary transition-colors" href="#">How it works</a>
                                    <a className="text-sm font-medium text-gray-800 hover:text-primary dark:text-gray-200 dark:hover:text-primary transition-colors" href="#">Browse tasks</a>
                                    <a className="text-sm font-medium text-gray-800 hover:text-primary dark:text-gray-200 dark:hover:text-primary transition-colors" href="#">Become an expert</a>
                                </div>
                                <div className="flex gap-2">
                                    <Link href="/register" className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-wide hover:bg-primary/90 transition-colors">
                                        <span className="truncate">Sign Up</span>
                                    </Link>
                                    <Link href="/login" className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white text-sm font-bold leading-normal tracking-wide hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                        <span className="truncate">Log In</span>
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-4">
                                <NotificationBell />
                                <Link href="/profile" className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-700 group">
                                    <div className="text-right hidden md:block">
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">{user.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role}</p>
                                    </div>
                                    <UserAvatar user={user} size="md" className="group-hover:ring-2 ring-primary transition-all" />
                                </Link>
                                {user.role === 'admin' && (
                                    <Link href="/admin" className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
                                        Admin
                                    </Link>
                                )}
                                <button
                                    onClick={onLogout}
                                    className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white text-sm font-bold leading-normal tracking-wide hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button - Placeholder */}
                    <div className="md:hidden">
                        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>
                    </div>
                </header>
            </div>
        </div>
    )
}
