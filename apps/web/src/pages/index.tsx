import { useEffect, useState } from 'react'
import { getTasks, getUserProfile, removeToken, getToken, getCategories } from '../utils/api'
import { Task, UserProfile, Category } from '@helpfinder/shared'
import { Navbar } from '../components/Navbar'
import { CreateTaskForm } from '../components/CreateTaskForm'
import { TaskCard } from '../components/TaskCard'

import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('../components/MapComponent'), { ssr: false })

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  // New/Edit Task State
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Tab State
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all')
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')

  // Search State
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [searchRadius, setSearchRadius] = useState(10)
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    const init = async () => {
      if (getToken()) {
        const profile = await getUserProfile()
        setUser(profile)
      }
      loadCategories()
      loadTasks()
    }
    init()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (e) {
      console.error('Failed to load categories')
    }
  }

  const loadTasks = async (lat?: number, lng?: number, radius?: number, category?: string) => {
    try {
      setLoading(true)
      const data = await getTasks(lat, lng, radius, category)
      setTasks(data)
    } catch (e) {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilter = () => {
    if (isSearchActive && searchLocation) {
      loadTasks(searchLocation.lat, searchLocation.lng, searchRadius, selectedCategory)
    } else {
      loadTasks(undefined, undefined, undefined, selectedCategory)
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

        {/* Location Filter Section */}
        <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isSearchActive}
                onChange={(e) => {
                  setIsSearchActive(e.target.checked)
                  if (!e.target.checked && !selectedCategory) {
                    loadTasks() // Reset if unchecked and no category
                  }
                }}
                className="w-5 h-5 text-primary rounded focus:ring-primary"
              />
              <span className="font-bold text-slate-700">Filter by Location</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-700">Category:</span>
              <select
                className="input py-1 px-3 text-sm w-auto"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  // Auto-apply filter when category changes
                  if (isSearchActive && searchLocation) {
                    loadTasks(searchLocation.lat, searchLocation.lng, searchRadius, e.target.value)
                  } else {
                    loadTasks(undefined, undefined, undefined, e.target.value)
                  }
                }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {isSearchActive && (
            <div className="animate-fade-in">
              <div className="flex flex-wrap gap-6 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Search Radius: <span className="text-primary font-bold">{searchRadius} km</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Selected Location
                  </label>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200 text-sm text-slate-600">
                    {searchLocation
                      ? `${searchLocation.lat.toFixed(4)}, ${searchLocation.lng.toFixed(4)}`
                      : 'Click on the map to select a location'}
                  </div>
                </div>

                <button
                  onClick={handleApplyFilter}
                  disabled={!searchLocation}
                  className="btn btn-primary"
                >
                  Apply Filter
                </button>
              </div>

              {viewMode === 'list' && (
                <div className="mt-4 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                  💡 Switch to <strong>Map View</strong> to select a location easily.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="heading-2">
            {activeTab === 'all' ? 'Recent Tasks' : 'My Tasks'}
          </h2>
          <div className="flex gap-4 items-center">
            {/* View Toggle */}
            <div className="tabs">
              <button
                onClick={() => setViewMode('list')}
                className={`tab ${viewMode === 'list' ? 'active' : ''}`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`tab ${viewMode === 'map' ? 'active' : ''}`}
              >
                Map
              </button>
            </div>

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

        {viewMode === 'map' && (
          <div className="mb-8" style={{ height: '600px', width: '100%' }}>
            <MapComponent
              tasks={displayedTasks}
              zoom={13}
              onLocationSelect={isSearchActive ? (lat, lng) => setSearchLocation({ lat, lng }) : undefined}
              selectedLocation={searchLocation}
              searchRadius={isSearchActive ? searchRadius : undefined}
            />
          </div>
        )}

        {isSearchActive || selectedCategory ? (
          <>
            {/* Primary Matches */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                <span className="text-2xl">🎯</span> Matching Tasks
              </h3>
              {displayedTasks.filter(t => {
                const matchesLoc = !isSearchActive || t.latitude != null
                const matchesCat = !selectedCategory || t.categoryId === selectedCategory
                return matchesLoc && matchesCat
              }).length > 0 ? (
                <div className="grid">
                  {displayedTasks.filter(t => {
                    const matchesLoc = !isSearchActive || t.latitude != null
                    const matchesCat = !selectedCategory || t.categoryId === selectedCategory
                    return matchesLoc && matchesCat
                  }).map(t => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      user={user}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onRefresh={() => handleApplyFilter()}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic">No exact matches found.</p>
              )}
            </div>

            {/* Other Tasks Divider */}
            <div className="relative py-4 mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-50 px-4 text-sm text-slate-500">
                  Other Tasks ({[
                    isSearchActive && 'No Location',
                    selectedCategory && 'Uncategorized'
                  ].filter(Boolean).join(' / ')})
                </span>
              </div>
            </div>

            {/* Other Tasks */}
            <div className="grid">
              {displayedTasks.filter(t => {
                const matchesLoc = !isSearchActive || t.latitude != null
                const matchesCat = !selectedCategory || t.categoryId === selectedCategory
                return !(matchesLoc && matchesCat)
              }).map(t => (
                <TaskCard
                  key={t.id}
                  task={t}
                  user={user}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onRefresh={() => handleApplyFilter()}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="grid">
            {displayedTasks.map(t => (
              <TaskCard
                key={t.id}
                task={t}
                user={user}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRefresh={() => handleApplyFilter()}
              />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
