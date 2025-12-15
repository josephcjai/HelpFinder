import { useEffect, useState } from 'react'
import { getTasks, getUserProfile, removeToken, getToken, getCategories } from '../utils/api'
import { Task, UserProfile, Category } from '@helpfinder/shared'
import { Navbar } from '../components/Navbar'
import { CreateTaskForm } from '../components/CreateTaskForm'
import { TaskCard } from '../components/TaskCard'
import { useRouter } from 'next/router'
import { useToast } from '../components/ui/Toast'
import { geocodeAddress } from '../utils/geocoding'

import Link from 'next/link'
import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('../components/MapComponent'), { ssr: false })

export default function Home() {
  const router = useRouter()
  const { showToast } = useToast()

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
  const [searchQuery] = useState('')
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [searchRadius, setSearchRadius] = useState(10)
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    const init = async () => {
      if (getToken()) {
        const profile = await getUserProfile()
        setUser(profile)

        if (profile) {
          if (profile.latitude && profile.longitude) {
            setSearchLocation({ lat: profile.latitude, lng: profile.longitude })
          } else if (profile.zipCode || profile.country) {
            const query = [profile.zipCode, profile.country].filter(Boolean).join(', ')
            if (query) {
              geocodeAddress(query).then(res => {
                if (res) {
                  setSearchLocation({ lat: res.lat, lng: res.lon })
                }
              })
            }
          }
        }
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

  // Modified to fetch ALL tasks for client-side filtering
  const loadTasks = async () => {
    try {
      setLoading(true)
      const data = await getTasks() // Fetch all tasks
      setTasks(data)
    } catch (e) {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  // Helper for radius calculation
  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180)
  }

  const handleApplyFilter = () => {
    // Client-side filtering logic handles updates; this might be used to trigger something if needed
    // But with state-based filtering, we just rely on re-renders.
  }

  const handleLogout = () => {
    removeToken()
    setUser(null)
    router.push('/login')
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

  const handlePostTaskClick = () => {
    if (!user) {
      showToast("Please log in to post a task", "error")
      router.push('/login')
      return
    }
    setShowCreateForm(true)
  }


  // --- Filtering Logic ---
  // 1. Base Filter: User Tab, Search Text ONLY (Category is now a soft filter/grouper)
  const baseFilteredTasks = tasks.filter(t => {
    const matchUser = activeTab === 'all' || (user && t.requesterId === user.id)
    const matchSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchUser && matchSearch
  })

  // 2. Split Logic: Primary (Nearby/Matching) vs Other
  let nearbyTasks: Task[] = []
  let otherTasks: Task[] = []

  baseFilteredTasks.forEach(t => {
    // 1. Check Category Match
    const matchCategory = !selectedCategory || t.categoryId === selectedCategory || (t.category && t.category.id === selectedCategory)

    // 2. Check Location Match
    let matchLocation = true
    if (isSearchActive && searchLocation) {
      if (t.latitude && t.longitude) {
        const dist = getDistanceFromLatLonInKm(searchLocation.lat, searchLocation.lng, t.latitude, t.longitude)
        matchLocation = dist <= searchRadius
      } else {
        matchLocation = false // No location = fail location match
      }
    }

    // DECISION: To be in Primary List, must match BOTH Category and Location (if active)
    if (matchCategory && matchLocation) {
      nearbyTasks.push(t)
    } else {
      // Everything else (Wrong Category OR Wrong Location) goes to Other
      otherTasks.push(t)
    }
  })

  // Use nearbyTasks for map display, but only those with valid location
  const mapTasks = nearbyTasks.filter(t => t.latitude && t.longitude)


  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans text-gray-900 dark:text-gray-100">
      <Navbar user={user} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">

        {/* Create/Edit Modal Overlay */}
        {(showCreateForm || editingTask) && (
          <div className="fixed inset-0 z-[3000] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/80 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => { setShowCreateForm(false); setEditingTask(null) }}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <CreateTaskForm
                    onTaskSaved={handleTaskSaved}
                    onCancel={() => {
                      setShowCreateForm(false)
                      setEditingTask(null)
                    }}
                    editingTask={editingTask}
                    initialCategoryId={selectedCategory}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="@container mb-16 sm:mb-24">
          <div className="flex flex-col gap-10 lg:flex-row items-center">
            <div className="flex flex-col gap-6 text-center lg:text-left lg:w-1/2">
              <h1 className="text-4xl font-black leading-tight tracking-tighter text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
                What do you need help with today?
              </h1>
              <h2 className="text-base font-normal leading-normal text-gray-600 dark:text-gray-400 sm:text-lg">
                Connect with local experts and neighbors to get your tasks done.
              </h2>
              <div className="flex flex-col w-full max-w-lg mx-auto lg:mx-0">
                {user && (
                  <button
                    onClick={handlePostTaskClick}
                    className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-6 bg-primary text-white text-base font-bold leading-normal tracking-wide hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <span className="truncate">Post a Task</span>
                  </button>
                )}
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl shadow-lg" style={{ backgroundImage: 'url("/hero-banner.png")' }}></div>
            </div>
          </div>
        </div>

        {/* Task Discovery Section */}
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-gray-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">
              {isSearchActive ? 'Nearby Tasks' : (selectedCategory ? 'Matching Tasks' : 'All Tasks')}
            </h2>

            {/* View Toggles */}
            <div className="flex gap-4">
              {user && (
                <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab('my')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'my' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    My Tasks
                  </button>
                </div>
              )}

              <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Grid View
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Map View
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8 items-center">
            {/* Category Filter */}
            <div className="relative">
              <select
                className="appearance-none h-9 pl-4 pr-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:bg-gray-50 cursor-pointer"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  // Client side filter updates automatically via state
                }}
              >
                <option value="">Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            {/* Location Filter Toggle */}
            <button
              onClick={() => {
                const newState = !isSearchActive;
                setIsSearchActive(newState);
                if (newState && viewMode === 'list') {
                  setViewMode('map');
                }
              }}
              className={`flex h-9 items-center px-4 rounded-lg border text-sm font-medium transition-colors ${isSearchActive ? 'bg-primary text-white border-primary' : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'}`}
            >
              <span className="material-symbols-outlined text-lg mr-1">location_on</span>
              {isSearchActive ? 'Nearby' : 'Filter by Location'}
            </button>

            {isSearchActive && (
              <div className="flex items-center gap-2 animate-fade-in bg-white p-2 rounded-lg border border-gray-200 shadow-sm ml-2">
                <span className="text-sm text-gray-500">Radius: {searchRadius}km</span>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            )}
          </div>

          {/* Content Area */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {viewMode === 'map' ? (
                <div className="flex flex-col gap-6">
                  <div className="w-full h-[600px] rounded-xl overflow-hidden shadow-sm border border-gray-200 relative">
                    {/* Map Search Overlay */}
                    <div className="absolute top-4 left-4 right-4 z-[2000] flex gap-2 max-w-md mx-auto">
                      <input
                        type="text"
                        className="flex-1 px-4 py-2 bg-white rounded-lg shadow-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Search location..."
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            const val = e.currentTarget.value
                            const res = await geocodeAddress(val)
                            if (res) setSearchLocation({ lat: res.lat, lng: res.lon })
                          }
                        }}
                      />
                    </div>
                    <MapComponent
                      tasks={mapTasks}
                      zoom={13}
                      onLocationSelect={isSearchActive ? (lat, lng) => setSearchLocation({ lat, lng }) : undefined}
                      selectedLocation={searchLocation}
                      searchRadius={isSearchActive ? searchRadius : undefined}
                      center={searchLocation ? [searchLocation.lat, searchLocation.lng] : undefined}
                    />
                  </div>

                  {/* Results List below Map (Split Logic same as below) */}
                  <div className="flex flex-col gap-10">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Found {nearbyTasks.length} {isSearchActive ? 'nearby ' : ''}tasks</h2>
                    {nearbyTasks.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {nearbyTasks.map(t => (
                          <TaskCard
                            key={t.id}
                            task={t}
                            user={user}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onRefresh={() => loadTasks()}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-500">No tasks found in this area.</p>
                      </div>
                    )}

                    {otherTasks.length > 0 && (
                      <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                          <span className="material-symbols-outlined text-gray-400">public</span>
                          Other Tasks (Global / Non-matching)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {otherTasks.map(t => (
                            <TaskCard
                              key={t.id}
                              task={t}
                              user={user}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onRefresh={() => loadTasks()}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-10">
                  {/* Grid View: 1. Nearby / Filtered Results */}
                  {nearbyTasks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {nearbyTasks.map(t => (
                        <TaskCard
                          key={t.id}
                          task={t}
                          user={user}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onRefresh={() => loadTasks()}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="col-span-full text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <p className="text-gray-500 text-lg">No tasks found matching your criteria.</p>
                      {user && (
                        <button
                          onClick={handlePostTaskClick}
                          className="mt-4 text-primary font-bold hover:underline"
                        >
                          Post a task now
                        </button>
                      )}
                    </div>
                  )}

                  {/* Grid View: 2. Other Tasks (No Location) */}
                  {otherTasks.length > 0 && (
                    <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-400">public</span>
                        Other Tasks (Global / Non-matching)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {otherTasks.map(t => (
                          <TaskCard
                            key={t.id}
                            task={t}
                            user={user}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onRefresh={() => loadTasks()}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
