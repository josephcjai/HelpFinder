import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { authenticatedFetch } from '../utils/api'
import Link from 'next/link'

type Notification = {
    id: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    resourceId?: string
    isRead: boolean
    createdAt: string
}

export const NotificationBell = () => {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const unreadCount = notifications.filter(n => !n.isRead).length

    const loadNotifications = async () => {
        if (!user) return
        try {
            const res = await authenticatedFetch('/notifications')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
            }
        } catch (e) {
            console.error('Failed to load notifications')
        }
    }

    useEffect(() => {
        loadNotifications()
        const interval = setInterval(loadNotifications, 30000) // Poll every 30s
        return () => clearInterval(interval)
    }, [user])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleMarkAsRead = async (id: string) => {
        try {
            await authenticatedFetch(`/notifications/${id}/read`, { method: 'PATCH' })
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
        } catch (e) {
            console.error('Failed to mark as read')
        }
    }

    const handleMarkAllRead = async () => {
        try {
            await authenticatedFetch('/notifications/read-all', { method: 'POST' })
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        } catch (e) {
            console.error('Failed to mark all as read')
        }
    }

    if (!user) return null

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50">
                    <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-semibold text-slate-700">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-slate-500 text-sm">
                                No notifications
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notification.isRead ? 'bg-blue-50/50' : ''}`}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1">
                                            {notification.type === 'warning' && '⚠️'}
                                            {notification.type === 'success' && '✅'}
                                            {notification.type === 'error' && '❌'}
                                            {notification.type === 'info' && 'ℹ️'}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-slate-700">{notification.message}</p>
                                            <div className="mt-2 flex justify-between items-center">
                                                <span className="text-xs text-slate-400">
                                                    {new Date(notification.createdAt).toLocaleDateString()}
                                                </span>
                                                {!notification.isRead && (
                                                    <button
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                        className="text-xs text-blue-600 hover:text-blue-800"
                                                    >
                                                        Mark read
                                                    </button>
                                                )}
                                            </div>
                                            {notification.resourceId && (
                                                <Link href={`/tasks/${notification.resourceId}`} className="text-xs text-blue-600 hover:underline mt-1 block">
                                                    View Task
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
