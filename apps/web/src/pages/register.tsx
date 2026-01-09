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
    const [error, setError] = useState('')
    const { showToast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

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
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register</button>
                </form>
                <p className="mt-4 text-center text-secondary" style={{ textAlign: 'center' }}>
                    Already have an account? <Link href="/login">Login</Link>
                </p>
            </div>
        </div>
    )
}
