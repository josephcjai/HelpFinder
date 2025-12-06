import { useState, useEffect } from 'react'
import { Category } from '@helpfinder/shared'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../utils/api'
import { useToast } from './ui/Toast'
import { ConfirmModal } from './ui/ConfirmModal'

export const AdminCategoryManager = () => {
    const [categories, setCategories] = useState<Category[]>([])
    const [newCategoryName, setNewCategoryName] = useState('')
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [editName, setEditName] = useState('')
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const { showToast } = useToast()

    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        try {
            const data = await getCategories()
            setCategories(data)
        } catch (e) {
            showToast('Failed to load categories', 'error')
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCategoryName.trim()) return
        try {
            await createCategory(newCategoryName)
            setNewCategoryName('')
            loadCategories()
            showToast('Category created', 'success')
        } catch (e) {
            showToast('Failed to create category', 'error')
        }
    }

    const handleUpdate = async () => {
        if (!editingCategory || !editName.trim()) return
        try {
            await updateCategory(editingCategory.id, editName)
            setEditingCategory(null)
            loadCategories()
            showToast('Category updated', 'success')
        } catch (e) {
            showToast('Failed to update category', 'error')
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await deleteCategory(deleteId)
            setDeleteId(null)
            loadCategories()
            showToast('Category deleted', 'success')
        } catch (e) {
            showToast('Failed to delete category', 'error')
        }
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold mb-4">Manage Categories</h2>

            {/* Create Form */}
            <form onSubmit={handleCreate} className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New Category Name"
                    className="input flex-grow"
                />
                <button type="submit" className="btn btn-primary" disabled={!newCategoryName.trim()}>
                    Add
                </button>
            </form>

            {/* List */}
            <div className="space-y-2">
                {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                        {editingCategory?.id === cat.id ? (
                            <div className="flex gap-2 flex-grow mr-4">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="input py-1"
                                    autoFocus
                                />
                                <button onClick={handleUpdate} className="btn btn-sm btn-success">Save</button>
                                <button onClick={() => setEditingCategory(null)} className="btn btn-sm btn-secondary">Cancel</button>
                            </div>
                        ) : (
                            <span className="font-medium">{cat.name}</span>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setEditingCategory(cat)
                                    setEditName(cat.name)
                                }}
                                className="btn btn-sm btn-secondary"
                                disabled={!!editingCategory}
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => setDeleteId(cat.id)}
                                className="btn btn-sm btn-danger"
                                disabled={!!editingCategory}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmModal
                isOpen={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Category"
                message="Are you sure? Tasks with this category will become uncategorized."
                confirmText="Delete"
                isDangerous
            />
        </div>
    )
}
