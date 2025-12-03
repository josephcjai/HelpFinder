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

      <main className="container">
        <div className="mb-8">
          <h1 className="heading-1">Find help nearby.</h1>
          <p className="text-secondary">Connect with helpers for domestic and small manual work.</p>
        </div>

        {user && (
          <div className="mb-8">
            {!showCreateForm && !editingTask ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary"
              >
                + Post a New Task
              </button>
            ) : (
              <CreateTaskForm
                onTaskSaved={handleTaskSaved}
                onCancel={() => {
                  setShowCreateForm(false)
                  setEditingTask(null)
                }}
                editingTask={editingTask}
              />
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
