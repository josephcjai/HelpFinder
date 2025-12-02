import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiBase, authenticatedFetch, getToken, getUserProfile, removeToken } from '../utils/api'
import { Task, UserProfile } from '@helpfinder/shared'

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserProfile | null>(null)

  // New/Edit Task State
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [budget, setBudget] = useState('')

  useEffect(() => {
    const init = async () => {
      if (getToken()) {
        const profile = await getUserProfile()
        setUser(profile)
      }
      fetch(`${apiBase}/tasks`)
        .then(r => r.json())
        .then(setTasks)
        .catch(() => setTasks([]))
        .finally(() => setLoading(false))
    }
    init()
  }, [])

  const handleLogout = () => {
    removeToken()
    setUser(null)
  }

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingTaskId ? `/tasks/${editingTaskId}` : '/tasks'
      const method = editingTaskId ? 'PATCH' : 'POST'

      const res = await authenticatedFetch(url, {
        method,
        body: JSON.stringify({
          title,
          description: desc,
          budgetMin: budget ? Number(budget) : undefined
        })
      })

      if (res.ok) {
        const savedTask = await res.json()
        if (editingTaskId) {
          setTasks(tasks.map(t => t.id === editingTaskId ? savedTask : t))
          setEditingTaskId(null)
        } else {
          setTasks([savedTask, ...tasks])
          setShowCreateForm(false)
        }
        setTitle('')
        setDesc('')
        setBudget('')
      } else {
        alert('Failed to save task')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTaskId(task.id)
    setTitle(task.title)
    setDesc(task.description || '')
    setBudget(task.budgetMin?.toString() || '')
  }

  const handleCancelEdit = () => {
    setEditingTaskId(null)
    setTitle('')
    setDesc('')
    setBudget('')
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    try {
      const res = await authenticatedFetch(`/tasks/${taskId}`, { method: 'DELETE' })
      if (res.ok) {
        setTasks(tasks.filter(t => t.id !== taskId))
      } else {
        const text = await res.text()
        alert(`Failed to delete task: ${res.status} ${text}`)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Tab State
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all')

  const displayedTasks = activeTab === 'all'
    ? tasks
    : tasks.filter(t => user && t.requesterId === user.id)

  return (
    <>
      <nav className="navbar">
        <div className="container">
          <div className="nav-brand">HelpFinder</div>
          <div>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-secondary">Welcome, <b>{user.name}</b></span>
                {user.role === 'admin' && (
                  <Link href="/admin" className="btn btn-danger">
                    Admin Dashboard
                  </Link>
                )}
                <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
              </div>
            ) : (
              <div className="flex gap-4">
                <Link href="/login" className="btn btn-secondary">Login</Link>
                <Link href="/register" className="btn btn-primary">Register</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="container">
        <div className="mb-8">
          <h1 className="heading-1">Find help nearby.</h1>
          <p className="text-secondary">Connect with helpers for domestic and small manual work.</p>
        </div>

        {user && (
          <div className="mb-8">
            {!showCreateForm && !editingTaskId ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary"
              >
                + Post a New Task
              </button>
            ) : (
              <div className="card">
                <h2 className="heading-2">{editingTaskId ? 'Edit Task' : 'Post a New Task'}</h2>
                <form onSubmit={handleSubmitTask} className="flex-col gap-4">
                  <div>
                    <label className="label">Title</label>
                    <input
                      className="input"
                      placeholder="e.g. Fix my sink"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea
                      className="input"
                      placeholder="Describe what you need help with..."
                      value={desc}
                      onChange={e => setDesc(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="label">Budget (Optional)</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="e.g. 50"
                      value={budget}
                      onChange={e => setBudget(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                      {editingTaskId ? 'Update Task' : 'Post Task'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleCancelEdit()
                        setShowCreateForm(false)
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="heading-2">Recent Tasks</h2>
          {user && (
            <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
              <button
                onClick={() => setActiveTab('all')}
                className={`tab ${activeTab === 'all' ? 'active' : ''}`}
              >
                All Tasks
              </button>
              <button
                onClick={() => setActiveTab('my')}
                className={`tab ${activeTab === 'my' ? 'active' : ''}`}
              >
                My Tasks
              </button>
            </div>
          )}
        </div>

        {loading && <p>Loading...</p>}
        {!loading && displayedTasks.length === 0 && (
          <div className="card text-secondary">
            No tasks found. Be the first to post one!
          </div>
        )}

        <div className="flex-col gap-4">
          {displayedTasks.map(t => (
            <div key={t.id} className="card">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="heading-2" style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{t.title}</h3>
                  <p className="text-secondary mb-4">{t.description || 'No description provided.'}</p>
                  {typeof t.budgetMin === 'number' && (
                    <div className="text-sm" style={{ color: 'var(--success)', fontWeight: 600 }}>
                      Budget: ${t.budgetMin}{t.budgetMax ? ` - $${t.budgetMax}` : ''}
                    </div>
                  )}
                </div>
                {user && (user.id === t.requesterId || user.role === 'admin') && (
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(t)} className="btn btn-secondary">Edit</button>
                    <button onClick={() => handleDelete(t.id)} className="btn btn-danger">Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
