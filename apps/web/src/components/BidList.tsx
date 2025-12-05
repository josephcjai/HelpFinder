import { useState, useEffect } from 'react'
import { Task, UserProfile, Bid } from '@helpfinder/shared'
import { getBids, placeBid, updateBid, acceptBid } from '../utils/api'
import { useToast } from './ui/Toast'
import { useModal } from './ui/ModalProvider'

interface BidListProps {
    task: Task
    user: UserProfile
    onBidAccepted: () => void
    onBidPlaced?: () => void
}

export const BidList = ({ task, user, onBidAccepted, onBidPlaced }: BidListProps) => {
    const [bids, setBids] = useState<Bid[]>([])
    const [bidAmount, setBidAmount] = useState('')
    const [bidMessage, setBidMessage] = useState('')
    const [showBidForm, setShowBidForm] = useState(false)
    const [editingBidId, setEditingBidId] = useState<string | null>(null)

    const { showToast } = useToast()
    const { showConfirmation } = useModal()

    useEffect(() => {
        loadBids()
    }, [task.id, task.bids])

    const loadBids = async () => {
        try {
            const data = await getBids(task.id)
            setBids(data)
        } catch (e) {
            console.error('Failed to load bids', e)
        }
    }

    const handlePlaceBid = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingBidId) {
                await updateBid(editingBidId, Number(bidAmount), bidMessage)
                showToast('Bid updated successfully!', 'success')
            } else {
                await placeBid(task.id, Number(bidAmount), bidMessage)
                showToast('Bid placed successfully!', 'success')
            }
            setBidAmount('')
            setBidMessage('')
            setShowBidForm(false)
            setEditingBidId(null)
            loadBids()
            onBidPlaced?.()
        } catch (e) {
            showToast('Failed to save bid', 'error')
        }
    }

    const handleEditBid = (bid: Bid) => {
        setEditingBidId(bid.id)
        setBidAmount(bid.amount.toString())
        setBidMessage(bid.message || '')
        setShowBidForm(true)
    }

    const handleCancelBid = () => {
        setShowBidForm(false)
        setEditingBidId(null)
        setBidAmount('')
        setBidMessage('')
    }

    const handleAcceptBid = (bidId: string) => {
        const bid = bids.find(b => b.id === bidId)
        if (!bid) return

        showConfirmation({
            title: `Accept Bid of $${bid.amount}?`,
            message: `This will assign the task to ${bid.helper?.name || bid.helperName || 'the helper'}.`,
            onConfirm: async () => {
                try {
                    await acceptBid(bidId)
                    showToast('Bid accepted successfully', 'success')
                    onBidAccepted()
                } catch (e) {
                    showToast('Failed to accept bid', 'error')
                }
            }
        })
    }

    // If user is the requester, show received bids
    if (task.requesterId === user.id) {
        return (
            <div className="mt-4 border-t pt-4">
                <h4 className="font-bold mb-2">Bids Received ({bids.length})</h4>
                {bids.length === 0 ? <p className="text-sm text-secondary">No bids yet.</p> : (
                    <div className="flex-col gap-2">
                        {bids.map(bid => (
                            <div key={bid.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-wrap gap-4 justify-between items-center">
                                <div className="flex-1 min-w-[200px]">
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <div className="font-bold text-lg text-primary">${bid.amount}</div>
                                        <div className="text-xs text-secondary">
                                            by {bid.helper?.name || bid.helperName || 'Helper'}
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-600 break-words">{bid.message}</div>
                                </div>
                                <div className="flex-shrink-0">
                                    {bid.status === 'pending' && task.status === 'open' && (
                                        <button onClick={() => handleAcceptBid(bid.id)} className="btn btn-sm btn-primary">
                                            Accept Bid
                                        </button>
                                    )}
                                    {bid.status === 'accepted' && <span className="badge badge-success">Accepted</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    // Check if current user has already bid
    const myBid = bids.find(b => b.helperId === user.id)

    if (myBid && !showBidForm) {
        return (
            <div className="mt-4 border-t pt-4">
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>

                    <div className="flex justify-between items-start mb-4 pl-2">
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Your Bid</h4>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-3xl text-slate-800">${myBid.amount}</span>
                                <span className={`badge badge-${myBid.status === 'accepted' ? 'success' : 'secondary'}`}>
                                    {myBid.status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                        {myBid.status === 'pending' && task.status === 'open' && (
                            <button onClick={() => handleEditBid(myBid)} className="btn btn-sm btn-secondary bg-white text-xs">
                                Edit Bid
                            </button>
                        )}
                    </div>

                    {myBid.message && (
                        <div className="mt-3 pl-2 text-slate-600 bg-slate-50 p-3 rounded-lg text-sm border border-slate-100">
                            "{myBid.message}"
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // If user is a helper (not the requester)
    return (
        <div className="mt-4 border-t pt-4">
            {!showBidForm ? (
                <button onClick={() => setShowBidForm(true)} className="btn btn-sm btn-secondary w-full">
                    Place a Bid
                </button>
            ) : (
                <form onSubmit={handlePlaceBid} className="flex-col gap-2">
                    <h4 className="font-bold text-sm mb-2">{editingBidId ? 'Edit Your Bid' : 'Place a Bid'}</h4>
                    <input
                        type="number"
                        className="input"
                        placeholder="Bid Amount ($)"
                        value={bidAmount}
                        onChange={e => setBidAmount(e.target.value)}
                        required
                    />
                    <input
                        className="input"
                        placeholder="Message (e.g. I can do it tomorrow)"
                        value={bidMessage}
                        onChange={e => setBidMessage(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button type="submit" className="btn btn-sm btn-primary flex-1">
                            {editingBidId ? 'Update Bid' : 'Submit Bid'}
                        </button>
                        <button type="button" onClick={handleCancelBid} className="btn btn-sm btn-secondary">Cancel</button>
                    </div>
                </form>
            )}
        </div>
    )
}
