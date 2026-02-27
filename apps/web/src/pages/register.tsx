import { useState } from 'react'
import { useRouter } from 'next/router'
import { apiBase } from '../utils/api'
import Link from 'next/link'
import { useToast } from '../components/ui/Toast'

export default function Register() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const [error, setError] = useState('')
    const { showToast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!agreedToTerms) {
            setError('You must agree to the Terms of Service and Privacy Policy to register.')
            return
        }

        try {
            const res = await fetch(`${apiBase}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || 'Registration failed')
            }

            showToast('Registration successful! Please check your email to verify your account.', 'success')
            // Delay redirect slightly so toast can be seen (optional, but good UX)
            setTimeout(() => {
                router.push('/login')
            }, 2000)
        } catch (err: any) {
            setError(err.message)
        }
    }

    return (
        <div className="container" style={{ maxWidth: '400px', marginTop: '4rem' }}>
            <div className="card">
                <h1 className="heading-1" style={{ textAlign: 'center' }}>Register</h1>
                {error && <div className="mb-4" style={{ color: 'var(--danger)', textAlign: 'center' }}>{error}</div>}
                <form onSubmit={handleSubmit} className="flex-col gap-4">
                    <div>
                        <label className="label">Name</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="John Doe"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="label">Email</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="label">Password</label>
                        <input
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex items-start gap-2 mt-2">
                        <input
                            type="checkbox"
                            id="terms"
                            className="mt-1"
                            checked={agreedToTerms}
                            onChange={e => setAgreedToTerms(e.target.checked)}
                            required
                        />
                        <label htmlFor="terms" className="text-sm text-secondary">
                            I agree to the <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
                        </label>
                    </div>
                    <button type="submit" className="btn btn-primary mt-2" style={{ width: '100%' }}>Register</button>
                </form>
                <p className="mt-4 text-center text-secondary" style={{ textAlign: 'center' }}>
                    Already have an account? <Link href="/login">Login</Link>
                </p>
            </div>
        </div>
    )
}
