import { useState, useEffect } from 'react'
import { authenticatedFetch, getCategories } from '../utils/api'
import { Task, Category } from '@helpfinder/shared'
import { useToast } from './ui/Toast'
import dynamic from 'next/dynamic'

interface CreateTaskFormProps {
    onTaskSaved: (task: Task, isEdit: boolean) => void
    onCancel: () => void
    editingTask?: Task | null
    initialCategoryId?: string
}

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false })

export const CreateTaskForm = ({ onTaskSaved, onCancel, editingTask, initialCategoryId }: CreateTaskFormProps) => {
    const [title, setTitle] = useState('')
    const [desc, setDesc] = useState('')
    const [categoryId, setCategoryId] = useState(editingTask?.categoryId || initialCategoryId || '')
    const [budget, setBudget] = useState('')
    const [address, setAddress] = useState('')
    const [country, setCountry] = useState('')
    const [zipCode, setZipCode] = useState('')
    const [lat, setLat] = useState<number | undefined>(undefined)
    const [lng, setLng] = useState<number | undefined>(undefined)
    const [categories, setCategories] = useState<Category[]>([])
    const { showToast } = useToast()

    const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined)

    useEffect(() => {
        loadCategories()
        if (editingTask) {
            setTitle(editingTask.title)
            setDesc(editingTask.description || '')
            setCategoryId(editingTask.categoryId || '')
            setBudget(editingTask.budgetMin?.toString() || '')
            setAddress(editingTask.address || '')
            setCountry(editingTask.country || '')
            setZipCode(editingTask.zipCode || '')
            setLat(editingTask.latitude)
            setLng(editingTask.longitude)

            // Set map center to existing location
            if (editingTask.latitude && editingTask.longitude) {
                setMapCenter([editingTask.latitude, editingTask.longitude])
            }
            // Fallback to geocoding task address if lat/lng missing
            else {
                const query = [editingTask.zipCode, editingTask.country].filter(Boolean).join(', ')
                if (query) {
                    import('../utils/geocoding').then(({ geocodeAddress }) => {
                        geocodeAddress(query).then(res => {
                            if (res) {
                                setMapCenter([res.lat, res.lon])
                            }
                        })
                    })
                }
            }
        } else {
            // Check for user profile defaults
            const fetchProfile = async () => {
                const { getUserProfile } = await import('../utils/api')
                const user = await getUserProfile()
                if (user) {
                    if (user.address) setAddress(user.address)
                    if (user.country) setCountry(user.country)
                    if (user.zipCode) setZipCode(user.zipCode)

                    if (user.latitude && user.longitude) {
                        setLat(user.latitude)
                        setLng(user.longitude)
                        setMapCenter([user.latitude, user.longitude])
                    }
                    // Fallback: Geocode user profile address if lat/lng missing
                    else if (user.zipCode || user.country) {
                        const query = [user.zipCode, user.country].filter(Boolean).join(', ')
                        if (query) {
                            const { geocodeAddress } = await import('../utils/geocoding')
                            const res = await geocodeAddress(query)
                            if (res) {
                                setMapCenter([res.lat, res.lon])
                            }
                        }
                    }
                }
            }
            fetchProfile()
        }
    }, [editingTask])

    const loadCategories = async () => {
        try {
            const data = await getCategories()
            setCategories(data)
        } catch (e) {
            console.error('Failed to load categories')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = editingTask ? `/tasks/${editingTask.id}` : '/tasks'
            const method = editingTask ? 'PATCH' : 'POST'

            const res = await authenticatedFetch(url, {
                method,
                body: JSON.stringify({
                    title,
                    description: desc,
                    categoryId: categoryId || undefined,
                    budgetMin: budget ? Number(budget) : undefined,
                    address,
                    country,
                    zipCode,
                    latitude: lat,
                    longitude: lng
                })
            })

            if (res.ok) {
                const savedTask = await res.json()
                showToast(editingTask ? 'Task updated successfully' : 'Task created successfully', 'success')
                onTaskSaved(savedTask, !!editingTask)
            } else {
                const text = await res.text()
                showToast(`Failed to save task: ${text}`, 'error')
            }
        } catch (err) {
            console.error(err)
            showToast('Failed to save task', 'error')
        }
    }

    return (
        <div className="card scrollable-container">
            <h2 className="heading-2 mb-6">{editingTask ? 'Edit Task' : 'Post a New Task'}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="label">Title</label>
                        <input
                            className="input"
                            placeholder="e.g. Fix my sink"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="label">Description</label>
                        <textarea
                            className="input"
                            placeholder="Describe what you need help with..."
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                            rows={4}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="label">Category (Optional)</label>
                        <select
                            className="input"
                            value={categoryId}
                            onChange={e => setCategoryId(e.target.value)}
                        >
                            <option value="">Select a category...</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="label">Budget (Optional)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
                            <input
                                type="number"
                                className="input input-with-icon"
                                placeholder="e.g. 50"
                                value={budget}
                                onChange={e => setBudget(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">Address</label>
                        <input
                            className="input"
                            placeholder="e.g. 123 Main St"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="label">Zip Code</label>
                        <input
                            className="input"
                            placeholder="e.g. 10001"
                            value={zipCode}
                            onChange={e => setZipCode(e.target.value)}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="label">Country</label>
                        <input
                            className="input"
                            placeholder="e.g. USA"
                            value={country}
                            onChange={e => setCountry(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="label mb-2">Location (Click to pick)</label>

                    {/* Map Search Input */}
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            className="input text-sm py-1"
                            placeholder="Search map location..."
                            onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    const val = e.currentTarget.value
                                    const { geocodeAddress } = await import('../utils/geocoding')
                                    const res = await geocodeAddress(val)
                                    if (res) {
                                        setMapCenter([res.lat, res.lon])
                                    }
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="btn btn-secondary text-sm py-1"
                            onClick={async (e) => {
                                const input = e.currentTarget.previousElementSibling as HTMLInputElement
                                const val = input.value
                                const { geocodeAddress } = await import('../utils/geocoding')
                                const res = await geocodeAddress(val)
                                if (res) {
                                    setMapCenter([res.lat, res.lon])
                                }
                            }}
                        >
                            Search
                        </button>
                    </div>

                    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 map-container">
                        <MapComponent
                            selectedLocation={lat && lng ? { lat, lng } : null}
                            onLocationSelect={(l, lg) => { setLat(l); setLng(lg) }}
                            zoom={13}
                            center={mapCenter}
                        />
                    </div>
                    {lat && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Selected Coordinates: {lat.toFixed(4)}, {lng?.toFixed(4)}</p>}
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button type="submit" className="btn btn-primary flex-1">
                        {editingTask ? 'Update Task' : 'Post Task'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn btn-secondary"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    )
}
