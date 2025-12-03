import { useState, useEffect } from 'react'
import { Task, UserProfile, Bid } from '@helpfinder/shared'
import { getBids, placeBid, updateBid, acceptBid } from '../utils/api'

interface BidListProps {
    task: Task
    user: UserProfile
    onBidAccepted: () => void
}

export const BidList = ({ task, user, onBidAccepted }: BidListProps) => {
    const [bids, setBids] = useState<Bid[]>([])
    const [bidAmount, setBidAmount] = useState('')
    const [bidMessage, setBidMessage] = useState('')
    const [showBidForm, setShowBidForm] = useState(false)
    const [editingBidId, setEditingBidId] = useState<string | null>(null)

    useEffect(() => {
        loadBids()
    }, [task.id])

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
                alert('Bid updated successfully!')
            } else {
                await placeBid(task.id, Number(bidAmount), bidMessage)
                alert('Bid placed successfully!')
            }
            setBidAmount('')
            setBidMessage('')
            setShowBidForm(false)
            setEditingBidId(null)
            loadBids()
        } catch (e) {
            alert('Failed to save bid')
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

    const handleAcceptBid = async (bidId: string) => {
        if (!confirm('Accept this bid? This will assign the task.')) return
        await acceptBid(bidId)
        onBidAccepted()
    }

    // If user is the requester, show received bids
    if (task.requesterId === user.id) {
        return (
            <div className="mt-4 border-t pt-4">
                <h4 className="font-bold mb-2">Bids Received ({bids.length})</h4>
                {bids.length === 0 ? <p className="text-sm text-secondary">No bids yet.</p> : (
                    <div className="flex-col gap-2">
                        {bids.map(bid => (
                            <div key={bid.id} className="p-3 bg-slate-50 rounded border flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-primary">${bid.amount}</div>
                                    <div className="text-sm">{bid.message}</div>
                                    <div className="text-xs text-secondary">
                                        by {bid.helper?.name || bid.helperName || 'Helper'}
                                        {bid.helper?.email && <span className="text-gray-400 ml-1">({bid.helper.email})</span>}
                                    </div>
                                </div>
                                {bid.status === 'pending' && task.status === 'open' && (
                                    <button onClick={() => handleAcceptBid(bid.id)} className="btn btn-sm btn-primary">
                                        Accept
                                    </button>
                                )}
                                {bid.status === 'accepted' && <span className="badge badge-success">Accepted</span>}
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
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-bold text-blue-800">You have placed a bid on this task.</p>
                        {myBid.status === 'pending' && task.status === 'open' && (
                            <button onClick={() => handleEditBid(myBid)} className="text-xs text-blue-600 hover:underline">
                                Edit Bid
                            </button>
                        )}
                    </div>
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="font-bold text-lg">${myBid.amount}</span>
                            <span className="text-secondary text-sm ml-2">{myBid.message}</span>
                        </div>
                        <span className={`badge badge-${myBid.status === 'accepted' ? 'success' : 'secondary'}`}>
                            {myBid.status.toUpperCase()}
                        </span>
                    </div>
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
