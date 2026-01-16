import { useState } from 'react'
import { useRouter } from 'next/router'
import { apiBase, setToken } from '../utils/api'
import Link from 'next/link'

export default function Login() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        try {
            const res = await fetch(`${apiBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || data.error || 'Login failed')
            }

            setToken(data.access_token)
            router.push('/')
        } catch (err: any) {
            setError(err.message)
        }
    }

    return (
        <div className="container" style={{ maxWidth: '400px', marginTop: '4rem' }}>
            <div className="card">
                <h1 className="heading-1" style={{ textAlign: 'center' }}>Login</h1>
                {error && <div className="mb-4" style={{ color: 'var(--danger)', textAlign: 'center' }}>{error}</div>}
                <form onSubmit={handleSubmit} className="flex-col gap-4">
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
                        <div className="text-right mt-1">
                            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                                Forgot Password?
                            </Link>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
                </form>
                <p className="mt-4 text-center text-secondary" style={{ textAlign: 'center' }}>
                    Don't have an account? <Link href="/register">Register</Link>
                </p>
            </div>
        </div>
    )
}
