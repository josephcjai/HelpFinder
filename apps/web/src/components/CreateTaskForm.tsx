import { useState, useEffect } from 'react'
import { authenticatedFetch } from '../utils/api'
import { Task } from '@helpfinder/shared'

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
    const [lat, setLat] = useState<number | undefined>(undefined)
    const [lng, setLng] = useState<number | undefined>(undefined)

    useEffect(() => {
        if (editingTask) {
            setTitle(editingTask.title)
            setDesc(editingTask.description || '')
            setBudget(editingTask.budgetMin?.toString() || '')
            setLat(editingTask.latitude)
            setLng(editingTask.longitude)
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
                    latitude: lat,
                    longitude: lng
                })
            })

            if (res.ok) {
                const savedTask = await res.json()
                onTaskSaved(savedTask, !!editingTask)
            } else {
                alert('Failed to save task')
            }
        } catch (err) {
            console.error(err)
            alert('Failed to save task')
        }
    }

    return (
        <div className="card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="heading-2">{editingTask ? 'Edit Task' : 'Post a New Task'}</h2>
            <form onSubmit={handleSubmit} className="flex-col gap-4">
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

                <div>
                    <label className="label">Location (Click to pick)</label>
                    <div style={{ height: '300px', width: '100%', marginBottom: '1rem' }}>
                        <MapComponent
                            selectedLocation={lat && lng ? { lat, lng } : null}
                            onLocationSelect={(l, lg) => { setLat(l); setLng(lg) }}
                            zoom={13}
                        />
                    </div>
                    {lat && <p className="text-sm text-secondary">Selected: {lat.toFixed(4)}, {lng?.toFixed(4)}</p>}
                </div>

                <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
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
