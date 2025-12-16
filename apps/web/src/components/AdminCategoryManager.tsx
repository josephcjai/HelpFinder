import { useState, useEffect } from 'react'
import { Category, CATEGORY_ICONS, CATEGORY_COLORS } from '@helpfinder/shared'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../utils/api'
import { getCategoryColorClasses } from '../utils/colors'
import { useToast } from './ui/Toast'
import { ConfirmModal } from './ui/ConfirmModal'

export const AdminCategoryManager = () => {
    const [categories, setCategories] = useState<Category[]>([])
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryIcon, setNewCategoryIcon] = useState(CATEGORY_ICONS[0])
    const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0])

    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [editName, setEditName] = useState('')
    const [editIcon, setEditIcon] = useState('')
    const [editColor, setEditColor] = useState('')

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
            await createCategory(newCategoryName, newCategoryIcon, newCategoryColor)
            setNewCategoryName('')
            setNewCategoryIcon(CATEGORY_ICONS[0])
            setNewCategoryColor(CATEGORY_COLORS[0])
            loadCategories()
            showToast('Category created', 'success')
        } catch (e) {
            showToast('Failed to create category', 'error')
        }
    }

    const handleUpdate = async () => {
        if (!editingCategory || !editName.trim()) return
        try {
            await updateCategory(editingCategory.id, editName, editIcon, editColor)
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

    const IconPicker = ({ selected, onChange }: { selected: string, onChange: (icon: string) => void }) => (
        <div className="relative">
            <div className="max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800">
                <div className="flex flex-wrap gap-2">
                    {CATEGORY_ICONS.map(icon => (
                        <button
                            key={icon}
                            type="button"
                            onClick={() => onChange(icon)}
                            className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${selected === icon
                                    ? 'bg-primary text-white shadow-sm ring-2 ring-primary ring-offset-1'
                                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            title={icon}
                        >
                            <span className="material-icons-round text-xl">{icon}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )

    const ColorPicker = ({ selected, onChange }: { selected: string, onChange: (color: string) => void }) => (
        <div className="flex flex-wrap gap-2 mt-2">
            {CATEGORY_COLORS.map(color => (
                <button
                    key={color}
                    type="button"
                    onClick={() => onChange(color)}
                    className={`w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600 ${getCategoryColorClasses(color).split(' ')[0] // Extract bg class
                        } ${selected === color ? 'ring-2 ring-offset-2 ring-primary transform scale-110' : 'hover:scale-110 transition-transform'}`}
                    title={color}
                />
            ))}
        </div>
    )

    return (
        <div className="mt-12">
            <div className="mb-6">
                <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="material-icons-round text-secondary">category</span>
                    Manage Categories
                </h2>
                <p className="mt-1 text-gray-600 dark:text-gray-400 text-sm">Organize the types of help available on the platform.</p>
            </div>

            <div className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border border-white/50 dark:border-white/5 p-6 rounded-2xl shadow-soft">
                {/* Create Form */}
                <form onSubmit={handleCreate} className="mb-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase mb-4">Add New Category</h3>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-4">
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Name</label>
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Category Name"
                                className="block w-full px-4 py-2 border-gray-300 dark:border-gray-600 dark:bg-surface-dark dark:text-white rounded-lg focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <div className="md:col-span-4">
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Icon</label>
                            <IconPicker selected={newCategoryIcon} onChange={setNewCategoryIcon} />
                        </div>
                        <div className="md:col-span-4">
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Theme Color</label>
                            <ColorPicker selected={newCategoryColor} onChange={setNewCategoryColor} />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={!newCategoryName.trim()}
                            className="bg-primary hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg shadow-glow transition-all disabled:opacity-50"
                        >
                            Create Category
                        </button>
                    </div>
                </form>

                {/* List Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {categories.map(cat => (
                        <div key={cat.id} className="group relative p-4 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md transition-all duration-200">
                            {editingCategory?.id === cat.id ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase">Name</label>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="block w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-surface-dark dark:text-white text-sm"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase">Icon</label>
                                        <IconPicker selected={editIcon} onChange={setEditIcon} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase">Color</label>
                                        <ColorPicker selected={editColor} onChange={setEditColor} />
                                    </div>
                                    <div className="flex gap-2 justify-end pt-2">
                                        <button onClick={handleUpdate} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700">Save</button>
                                        <button onClick={() => setEditingCategory(null)} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-300">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-sm ${getCategoryColorClasses(cat.color)}`}>
                                            <span className="material-icons-round text-2xl">{cat.icon || 'category'}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">{cat.name}</h4>
                                            <p className="text-xs text-gray-500 capitalize">{cat.color || 'Default'} Theme</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 sm:static sm:bg-transparent bg-white/90 p-1 rounded-lg">
                                        <button
                                            onClick={() => {
                                                setEditingCategory(cat)
                                                setEditName(cat.name)
                                                setEditIcon(cat.icon || CATEGORY_ICONS[0])
                                                setEditColor(cat.color || CATEGORY_COLORS[0])
                                            }}
                                            className="text-gray-400 hover:text-primary p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            title="Edit"
                                        >
                                            <span className="material-icons-round text-lg">edit</span>
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(cat.id)}
                                            className="text-gray-400 hover:text-danger p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            title="Delete"
                                        >
                                            <span className="material-icons-round text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                            )}
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
        </div>
    )
}
