import { useState, useEffect } from 'react'
import { Task, UserProfile, Bid } from '@helpfinder/shared'
import { getBids, placeBid, updateBid, acceptBid, withdrawBid, rejectBid } from '../utils/api'
import { authenticatedFetch } from '../utils/api'
import { formatCurrency } from '../utils/format' // Add this
import { UserAvatar } from './UserAvatar'
import { useToast } from './ui/Toast'
import { useModal } from './ui/ModalProvider'
import { ReviewsListModal } from './ReviewsListModal'

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
    const [agreedToTerms, setAgreedToTerms] = useState(false)

    // Reviews Modal State
    const [reviewModalOpen, setReviewModalOpen] = useState(false)
    const [selectedReviewUser, setSelectedReviewUser] = useState<{ id: string, name: string } | null>(null)

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
            setAgreedToTerms(false)
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
        setAgreedToTerms(false)
    }

    const handleAcceptBid = (bidId: string) => {
        const bid = bids.find(b => b.id === bidId)
        if (!bid) return

        showConfirmation({
            // @ts-ignore
            title: `Accept Bid of ${formatCurrency(bid.amount, task.currency || 'USD')}?`,
            message: `This will assign the task to ${bid.helper?.name || bid.helperName || 'the helper'}. IMPORTANT: All payments must be handled externally between you and the helper. HelpFinder is not liable for payment disputes or unfulfilled work.`,
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


    const handleRejectBid = (bidId: string) => {
        showConfirmation({
            title: 'Reject Bid?',
            message: 'Are you sure you want to reject this bid?',
            isDangerous: true,
            confirmText: 'Reject',
            onConfirm: async () => {
                try {
                    await rejectBid(bidId)
                    showToast('Bid rejected', 'success')
                    onBidPlaced?.() // Reload logic same as placed
                    loadBids()
                } catch (e) {
                    showToast('Failed to reject bid', 'error')
                }
            }
        })
    }

    const openReviews = (helperId: string, helperName: string) => {
        setSelectedReviewUser({ id: helperId, name: helperName })
        setReviewModalOpen(true)
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
                                        {/* @ts-ignore */}
                                        <div className="font-bold text-lg text-primary">{formatCurrency(bid.amount, task.currency || 'USD')}</div>
                                        <div className="flex items-center gap-3">
                                            <UserAvatar user={{ name: bid.helperName, ...bid.helper }} size="md" />
                                            <div>
                                                <div className="text-xs text-secondary">
                                                    {bid.helper?.name || bid.helperName || 'Helper'}
                                                </div>
                                                {/* Helper Rating */}
                                                <button
                                                    onClick={() => bid.helperId && openReviews(bid.helperId, bid.helperName || bid.helper?.name || 'Helper')}
                                                    className="flex items-center gap-1 text-xs text-yellow-500 hover:text-yellow-600 transition-colors cursor-pointer"
                                                >
                                                    <span className="material-icons-round text-[12px]">star</span>
                                                    <span className="font-bold">{bid.helper?.helperRating?.toFixed(1) || '0.0'}</span>
                                                    <span className="text-slate-400 hover:text-slate-500">({bid.helper?.helperRatingCount || 0})</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-600 break-words">{bid.message}</div>
                                </div>
                                <div className="flex-shrink-0">
                                    {bid.status === 'pending' && task.status === 'open' && (
                                        <div className="flex flex-col gap-2">
                                            <button onClick={() => handleAcceptBid(bid.id)} className="btn btn-sm btn-primary">
                                                Accept Bid
                                            </button>
                                            <button onClick={() => handleRejectBid(bid.id)} className="btn btn-sm btn-outline-danger">
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                    {bid.status === 'accepted' && <span className="badge badge-success">Accepted</span>}
                                    {bid.status === 'rejected' && <span className="badge badge-secondary">Rejected</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {/* Reviews Modal */}
                {selectedReviewUser && (
                    <ReviewsListModal
                        isOpen={reviewModalOpen}
                        onClose={() => setReviewModalOpen(false)}
                        userId={selectedReviewUser.id}
                        userName={selectedReviewUser.name}
                        initialRole="helper"
                    />
                )}
            </div>
        )
    }

    // Check if current user has already bid
    const myBid = bids.find(b => b.helperId === user.id)

    const handleWithdrawBid = (bidId: string) => {
        showConfirmation({
            title: 'Withdraw Bid?',
            message: myBid?.status === 'accepted'
                ? 'WARNING: This task is currently assigned to you. Withdrawing will cancel the contract and reopen the task for others. Are you sure?'
                : 'Are you sure you want to withdraw your bid?',
            isDangerous: true,
            confirmText: 'Withdraw',
            onConfirm: async () => {
                try {
                    await withdrawBid(bidId)
                    showToast('Bid withdrawn successfully', 'success')
                    onBidPlaced?.()
                    loadBids()
                } catch (e) {
                    showToast('Failed to withdraw bid', 'error')
                }
            }
        })
    }



    if (myBid && !showBidForm) {
        return (
            <div className="mt-4 border-t pt-4">
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className={`absolute top - 0 left - 0 w - 1 h - full ${myBid.status === 'accepted' ? 'bg-green-500' : 'bg-blue-500'} `}></div>

                    <div className="flex justify-between items-start mb-4 pl-2">
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Your Bid</h4>
                            <div className="flex items-center gap-2">
                                {/* @ts-ignore */}
                                <span className="font-bold text-3xl text-slate-800">{formatCurrency(myBid.amount, task.currency || 'USD')}</span>
                                <span className={`badge badge - ${myBid.status === 'accepted' ? 'success' : 'secondary'} `}>
                                    {myBid.status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {/* Allow editing if pending or rejected */}
                            {(myBid.status === 'pending' || myBid.status === 'rejected') && (
                                <>
                                    <button
                                        onClick={() => handleEditBid(myBid)}
                                        className="btn btn-sm btn-secondary bg-white text-xs"
                                    >
                                        {myBid.status === 'rejected' ? 'Bid Again' : 'Edit Bid'}
                                    </button>
                                    <button
                                        onClick={() => handleWithdrawBid(myBid.id)}
                                        className="btn btn-sm btn-danger bg-white text-xs"
                                    >
                                        Withdraw
                                    </button>
                                </>
                            )}
                        </div>
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
                task.status === 'open' && (
                    <button onClick={() => setShowBidForm(true)} className="btn btn-sm btn-secondary w-full">
                        Place a Bid
                    </button>
                )
            ) : (
                <form onSubmit={handlePlaceBid} className="flex-col gap-2">
                    <h4 className="font-bold text-sm mb-2">{editingBidId ? 'Edit Your Bid' : 'Place a Bid'}</h4>
                    <input
                        type="number"
                        className="input"
                        // @ts-ignore
                        placeholder={`Bid Amount (${task.currency || 'USD'})`}
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
                    <label className="flex items-start gap-2 my-3 cursor-pointer text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                        <input
                            type="checkbox"
                            className="mt-0.5 flex-shrink-0"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            required
                        />
                        <span>I agree to the Terms of Service. HelpFinder is a matching service and carries no liability.</span>
                    </label>
                    <div className="flex gap-2">
                        <button type="submit" disabled={!agreedToTerms} className={`btn btn-sm btn-primary flex-1 ${!agreedToTerms ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {editingBidId ? 'Update Bid' : 'Submit Bid'}
                        </button>
                        <button type="button" onClick={handleCancelBid} className="btn btn-sm btn-secondary">Cancel</button>
                    </div>
                </form>
            )}
        </div>
    )
}
