import { useState, useEffect } from 'react'
import { authenticatedFetch } from '../utils/api'
import { Task } from '@helpfinder/shared'
import { useToast } from './ui/Toast'

interface CreateTaskFormProps {
    onTaskSaved: (task: Task, isEdit: boolean) => void
    onCancel: () => void
    editingTask?: Task | null
}

import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false })

export const CreateTaskForm = ({ onTaskSaved, onCancel, editingTask }: CreateTaskFormProps) => {
    const [title, setTitle] = useState('')
    const [desc, setDesc] = useState('')
    const [budget, setBudget] = useState('')
    const [address, setAddress] = useState('')
    const [country, setCountry] = useState('')
    const [zipCode, setZipCode] = useState('')
    const [lat, setLat] = useState<number | undefined>(undefined)
    const [lng, setLng] = useState<number | undefined>(undefined)
    const { showToast } = useToast()

    const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined)

    useEffect(() => {
        if (editingTask) {
            setTitle(editingTask.title)
            setDesc(editingTask.description || '')
            setBudget(editingTask.budgetMin?.toString() || '')
            setAddress(editingTask.address || '')
            setCountry(editingTask.country || '')
            setZipCode(editingTask.zipCode || '')
            setLat(editingTask.latitude)
            setLng(editingTask.longitude)

            // Set map center to existing location if available
            if (editingTask.latitude && editingTask.longitude) {
                setMapCenter([editingTask.latitude, editingTask.longitude])
            }
            // Otherwise geocode if location is missing but address info exists
            else {
                const query = [editingTask.zipCode, editingTask.country].filter(Boolean).join(', ')
                if (query) {
                    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
                        .then(res => res.json())
                        .then(data => {
                            if (data && data[0]) {
                                setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)])
                            }
                        })
                        .catch(console.error)
                }
            }
        }
    }, [editingTask])

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

                    <div>
                        <label className="label">Budget (Optional)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">$</span>
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
                        <label className="label">Zip Code</label>
                        <input
                            className="input"
                            placeholder="e.g. 10001"
                            value={zipCode}
                            onChange={e => setZipCode(e.target.value)}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="label">Address</label>
                        <input
                            className="input"
                            placeholder="e.g. 123 Main St"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
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
                    <div className="rounded-xl overflow-hidden border border-slate-200 map-container">
                        <MapComponent
                            selectedLocation={lat && lng ? { lat, lng } : null}
                            onLocationSelect={(l, lg) => { setLat(l); setLng(lg) }}
                            zoom={13}
                            center={mapCenter}
                        />
                    </div>
                    {lat && <p className="text-sm text-secondary mt-2">Selected Coordinates: {lat.toFixed(4)}, {lng?.toFixed(4)}</p>}
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
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
