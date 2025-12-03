import React, { createContext, useContext, useState, ReactNode } from 'react'
import { ConfirmModal } from './ConfirmModal'

interface ModalContextType {
    showConfirmation: (props: ConfirmationProps) => void
    closeConfirmation: () => void
}

interface ConfirmationProps {
    title: string
    message: string
    onConfirm: () => void
    isDangerous?: boolean
    confirmText?: string
    cancelText?: string
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export const ModalProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [config, setConfig] = useState<ConfirmationProps>({
        title: '',
        message: '',
        onConfirm: () => { },
    })

    const showConfirmation = (props: ConfirmationProps) => {
        setConfig(props)
        setIsOpen(true)
    }

    const closeConfirmation = () => {
        setIsOpen(false)
    }

    const handleConfirm = () => {
        config.onConfirm()
        closeConfirmation()
    }

    return (
        <ModalContext.Provider value={{ showConfirmation, closeConfirmation }}>
            {children}
            <ConfirmModal
                isOpen={isOpen}
                title={config.title}
                message={config.message}
                onConfirm={handleConfirm}
                onCancel={closeConfirmation}
                isDangerous={config.isDangerous}
                confirmText={config.confirmText}
                cancelText={config.cancelText}
            />
        </ModalContext.Provider>
    )
}

export const useModal = () => {
    const context = useContext(ModalContext)
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider')
    }
    return context
}
