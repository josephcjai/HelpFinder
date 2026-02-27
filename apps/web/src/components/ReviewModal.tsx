import { useState, useEffect } from 'react'

interface ReviewModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (rating: number, comment: string) => Promise<void>
    title: string
    isSubmitting: boolean
    initialRating?: number
    initialComment?: string
}

export const ReviewModal = ({ isOpen, onClose, onSubmit, title, isSubmitting, initialRating = 0, initialComment = '' }: ReviewModalProps) => {
    const [rating, setRating] = useState(initialRating)
    const [comment, setComment] = useState(initialComment)
    const [hoverRating, setHoverRating] = useState(0)

    useEffect(() => {
        if (isOpen) {
            setRating(initialRating)
            setComment(initialComment)
        }
    }, [isOpen, initialRating, initialComment])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (rating === 0) return
        await onSubmit(rating, comment)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-card-dark rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
                        Please rate your experience. This feedback helps build trust in our community.
                    </p>

                    <div className="flex justify-center gap-2 mb-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="transition-transform hover:scale-110 focus:outline-none"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                            >
                                <span className={`material-icons-round text-4xl ${(hoverRating || rating) >= star
                                    ? 'text-yellow-400'
                                    : 'text-slate-200 dark:text-slate-700'
                                    }`}>
                                    star
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="text-center mb-6 font-semibold text-primary">
                        {rating === 1 && "Terrible"}
                        {rating === 2 && "Bad"}
                        {rating === 3 && "Okay"}
                        {rating === 4 && "Good"}
                        {rating === 5 && "Excellent!"}
                    </div>

                    <div className="mb-6">
                        <label className="label">Comment (Optional)</label>
                        <textarea
                            className="input min-h-[100px]"
                            placeholder="Share details about your experience..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={rating === 0 || isSubmitting}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
