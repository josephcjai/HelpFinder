import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'

interface ConfirmModalProps {
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    onCancel: () => void
    confirmText?: string
    cancelText?: string
    isDangerous?: boolean
    requireAgreement?: boolean
    agreementText?: string
}

export const ConfirmModal = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDangerous = false,
    requireAgreement = false,
    agreementText = 'I agree to the terms',
}: ConfirmModalProps) => {
    const [mounted, setMounted] = useState(false)
    const [agreed, setAgreed] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    useEffect(() => {
        if (isOpen) setAgreed(false)
    }, [isOpen])

    if (!isOpen || !mounted) return null

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
                <h3 className="heading-2 mb-2" style={{ fontSize: '1.5rem' }}>{title}</h3>
                <p className="text-secondary mb-6">{message}</p>
                {requireAgreement && (
                    <label className="flex items-start gap-2 mb-6 cursor-pointer text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <input
                            type="checkbox"
                            className="mt-1 flex-shrink-0"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                        />
                        <span>{agreementText}</span>
                    </label>
                )}
                <div className="flex justify-end gap-3">
                    <button onClick={onCancel} className="btn btn-secondary">
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={requireAgreement && !agreed}
                        className={`btn ${isDangerous ? 'btn-danger' : 'btn-primary'} ${requireAgreement && !agreed ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
