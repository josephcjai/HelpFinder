import { useEffect, useState } from 'react'
import { getTasks, getUserProfile, removeToken, getToken } from '../utils/api'
import { Task, UserProfile } from '@helpfinder/shared'
import { Navbar } from '../components/Navbar'
import { CreateTaskForm } from '../components/CreateTaskForm'
import { TaskCard } from '../components/TaskCard'

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserProfile | null>(null)

  // New/Edit Task State
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Tab State
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all')

  useEffect(() => {
    const init = async () => {
      if (getToken()) {
        const profile = await getUserProfile()
        setUser(profile)
      }
      loadTasks()
    }
    init()
  }, [])

  const loadTasks = async () => {
    try {
      const data = await getTasks()
      setTasks(data)
    } catch (e) {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    removeToken()
    setUser(null)
  }

  const handleTaskSaved = (savedTask: Task, isEdit: boolean) => {
    if (isEdit) {
      setTasks(tasks.map(t => t.id === savedTask.id ? savedTask : t))
      setEditingTask(null)
    } else {
      setTasks([savedTask, ...tasks])
    }
    setShowCreateForm(false)
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setShowCreateForm(true)
  }

  const handleDelete = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId))
  }

  const displayedTasks = activeTab === 'all'
    ? tasks
    : tasks.filter(t => user && t.requesterId === user.id)

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />

      <main className="container pb-12">
        {/* Hero Section */}
        {!user && (
          <section className="hero">
            <div className="hero-content">
              <h1 className="heading-1 mb-4">
                Get help, <span style={{ color: 'var(--primary)' }}>fast.</span>
              </h1>
              <p className="text-secondary text-lg mb-8" style={{ fontSize: '1.25rem' }}>
                Connect with trusted neighbors for tasks big and small. From gardening to moving, we've got you covered.
              </p>
              <div className="flex gap-4">
                <a href="/register" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>Get Started</a>
                <a href="/login" className="btn btn-secondary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>Login</a>
              </div>
            </div>
            <div className="hero-image hidden-mobile">
              <img src="/hero-banner.png" alt="Community Help" />
            </div>
          </section>
        )}

        {user && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="heading-1">Welcome back, {user.name.split(' ')[0]}!</h1>
                <p className="text-secondary">Here's what's happening in your neighborhood.</p>
              </div>
              {!showCreateForm && !editingTask && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn btn-primary"
                >
                  + Post a New Task
                </button>
              )}
            </div>

            {/* Create/Edit Form Area */}
            {(showCreateForm || editingTask) && (
              <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg border border-slate-100">
                <CreateTaskForm
                  onTaskSaved={handleTaskSaved}
                  onCancel={() => {
                    setShowCreateForm(false)
                    setEditingTask(null)
                  }}
                  editingTask={editingTask}
                />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="heading-2">
            {activeTab === 'all' ? 'Recent Tasks' : 'My Tasks'}
          </h2>
          {user && (
            <div className="tabs">
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

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-secondary">Loading tasks...</div>
          </div>
        )}

        {!loading && displayedTasks.length === 0 && (
          <div className="card text-center py-12 text-secondary">
            <p className="text-lg mb-2">No tasks found.</p>
            <p>Be the first to post one!</p>
          </div>
        )}

        <div className="grid">
          {displayedTasks.map(t => (
            <TaskCard
              key={t.id}
              task={t}
              user={user}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRefresh={loadTasks}
            />
          ))}
        </div>
      </main>
    </>
  )
}
