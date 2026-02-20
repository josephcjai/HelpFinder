import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { getChats, getChatMessages, sendChatMessage, apiBase, getToken } from '../utils/api'
import { UserProfile } from '@helpfinder/shared'

export const ChatBox = ({ taskId, user, isArchived }: { taskId: string, user: UserProfile, isArchived: boolean }) => {
    const [room, setRoom] = useState<any>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const socketRef = useRef<Socket | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        const fetchChat = async () => {
            try {
                const chats = await getChats()
                const taskRoom = chats.find(c => c.taskId === taskId)
                if (taskRoom) {
                    setRoom(taskRoom)
                    const history = await getChatMessages(taskRoom.id)
                    setMessages(history)
                }
            } catch (err) {
                console.error("Failed to load chat", err)
            } finally {
                setLoading(false)
            }
        }
        fetchChat()
    }, [taskId])

    useEffect(() => {
        if (!room) return

        // Initialize Socket
        // We extract the pure hostname/port from apiBase 
        // socket.io usually expects just the domain/port without paths unless specified
        const url = new URL(apiBase)
        const socket = io(`${url.protocol}//${url.host}`, {
            transports: ['websocket', 'polling']
        })
        socketRef.current = socket

        socket.on('connect', () => {
            socket.emit('join', { userId: user.id })
            socket.emit('joinRoom', { roomId: room.id })
        })

        socket.on('newMessage', (msg: any) => {
            if (msg.roomId === room.id) {
                setMessages(prev => {
                    // Prevent duplicates in case HTTP request was faster
                    if (prev.find(m => m.id === msg.id)) return prev
                    return [...prev, msg]
                })
            }
        })

        return () => {
            socket.disconnect()
        }
    }, [room, user.id])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !room || isArchived) return

        const content = newMessage
        setNewMessage('') // Optimistic clear

        try {
            // Send via WebSocket
            if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('sendMessage', {
                    roomId: room.id,
                    senderId: user.id,
                    content
                })
            } else {
                // Fallback to REST
                const msg = await sendChatMessage(room.id, content)
                setMessages(prev => {
                    if (prev.find(m => m.id === msg.id)) return prev
                    return [...prev, msg]
                })
            }
        } catch (err) {
            console.error("Failed to send message", err)
            // Rollback optimistic clear
            setNewMessage(content)
        }
    }

    if (loading) return <div className="text-secondary text-sm p-4 text-center">Loading chat...</div>
    if (!room) return <div className="text-secondary text-sm p-4 bg-slate-50 rounded-lg text-center border overflow-hidden">Chat will be securely established once a bid is accepted.</div>

    return (
        <div className="flex flex-col h-[500px] bg-white border rounded-xl shadow-sm overflow-hidden mt-4">
            <div className="bg-slate-50 border-b p-4 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-slate-800">Task Chat</h3>
                    <p className="text-xs text-secondary">
                        {isArchived ? 'This chat is archived (Task completed/cancelled)' : 'Messages are end-to-end secured'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${isArchived ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                    <span className="text-xs text-slate-500">{isArchived ? 'Archived' : 'Live'}</span>
                </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-sm text-secondary mt-10">No messages yet. Say hello!</div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.senderId === user.id
                        return (
                            <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${isMe
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white border text-slate-800 rounded-tl-none shadow-sm'
                                    }`}>
                                    {msg.content}
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 px-1">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {!isArchived && (
                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-2"
                        disabled={isArchived}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isArchived}
                        className="btn btn-primary bg-blue-600 hover:bg-blue-700 disabled:opacity-50 !py-2 !px-4"
                    >
                        <span className="material-icons-round text-[18px]">send</span>
                    </button>
                </form>
            )}
        </div>
    )
}
