import { useEffect, useState } from 'react'

const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'

type Task = {
  id: string
  title: string
  description?: string
  budgetMin?: number
  budgetMax?: number
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch(`${apiBase}/tasks`)
      .then(r => r.json())
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>HelpFinder</h1>
      <p>Find helpers for domestic and small manual work.</p>
      <h2>Recent Tasks</h2>
      {loading && <p>Loading...</p>}
      {!loading && tasks.length === 0 && <p>No tasks yet.</p>}
      <ul>
        {tasks.map(t => (
          <li key={t.id}>
            <strong>{t.title}</strong> — {t.description || 'No description'}
            {typeof t.budgetMin === 'number' && (
              <span> | Budget: {t.budgetMin}{t.budgetMax ? ` - ${t.budgetMax}` : ''}</span>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}

