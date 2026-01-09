import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { verifyEmail } from '../utils/api'
import { useToast } from '../components/ui/Toast'

export default function VerifyEmail() {
    const router = useRouter()
    const { token } = router.query
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
    const { showToast } = useToast()

    useEffect(() => {
        if (!router.isReady) return

        if (!token) {
            setStatus('error')
            return
        }

        verifyEmail(token as string)
            .then(() => {
                setStatus('success')
                showToast('Email verified successfully!', 'success')
            })
            .catch(() => {
                setStatus('error')
            })
    }, [router.isReady, token])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-900">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center">
                {status === 'verifying' && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4 dark:text-white">Verifying...</h2>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    </div>
                )}
                {status === 'success' && (
                    <div>
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-green-600">Email Verified!</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Your account is now fully verified.
                        </p>
                        <Link href="/" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                            Go to Dashboard
                        </Link>
                    </div>
                )}
                {status === 'error' && (
                    <div>
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-red-600">Verification Failed</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            The link may be invalid or expired.
                        </p>
                        <Link href="/" className="text-primary hover:underline">
                            Return to Home
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
