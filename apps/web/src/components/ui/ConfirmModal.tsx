import React from 'react'

interface ConfirmModalProps {
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    onCancel: () => void
    confirmText?: string
    cancelText?: string
    isDangerous?: boolean
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
}: ConfirmModalProps) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
                <h3 className="heading-2 mb-2" style={{ fontSize: '1.5rem' }}>{title}</h3>
                <p className="text-secondary mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={onCancel} className="btn btn-secondary">
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`btn ${isDangerous ? 'btn-danger' : 'btn-primary'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
