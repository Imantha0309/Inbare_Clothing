import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, Package, X } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { imageUrl } from '../../services/imageUrl';
import CategoryForm from './CategoryForm';
import './Categories.css';

export default function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editCategory, setEditCategory] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const cats = await adminService.getCategories({ withCount: true });
            setCategories(cats);
        } catch (err) {
            console.error('Failed to load categories:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    const filtered = categories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async (id) => {
        try {
            await adminService.deleteCategory(id);
            setDeleteConfirm(null);
            fetchCategories();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditCategory(null);
        fetchCategories();
    };

    return (
        <div className="admin-categories">
            <div className="admin-categories__header">
                <div>
                    <h1 className="admin-categories__title">Categories</h1>
                    <p className="admin-categories__subtitle">{categories.length} categories total</p>
                </div>
                <button className="admin-categories__add-btn" onClick={() => { setEditCategory(null); setShowForm(true); }}>
                    <Plus size={18} />
                    Add Category
                </button>
            </div>

            <div className="admin-categories__search-wrap">
                <Search size={16} />
                <input
                    type="text"
                    placeholder="Search categories..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                    <button className="admin-categories__search-clear" onClick={() => setSearch('')}>
                        <X size={14} />
                    </button>
                )}
            </div>

            {loading ? (
                <div className="admin-categories__loading">Loading categories...</div>
            ) : filtered.length === 0 ? (
                <div className="admin-categories__empty">
                    <p>{search ? 'No categories match your search.' : 'No categories yet.'}</p>
                    {!search && (
                        <button onClick={() => { setEditCategory(null); setShowForm(true); }} className="admin-categories__add-btn">
                            <Plus size={18} /> Create your first category
                        </button>
                    )}
                </div>
            ) : (
                <div className="admin-categories__grid">
                    {filtered.map((cat) => (
                        <div key={cat._id} className={`admin-categories__card ${!cat.isActive ? 'inactive' : ''}`}>
                            <div className="admin-categories__card-img">
                                {cat.image ? (
                                    <img src={imageUrl(cat.image)} alt={cat.name} />
                                ) : (
                                    <div className="admin-categories__card-placeholder">
                                        <Package size={32} />
                                    </div>
                                )}
                                {!cat.isActive && <span className="admin-categories__card-inactive-badge">Inactive</span>}
                            </div>

                            <div className="admin-categories__card-body">
                                <h3 className="admin-categories__card-name">{cat.name}</h3>
                                {cat.description && (
                                    <p className="admin-categories__card-desc">{cat.description}</p>
                                )}
                                <div className="admin-categories__card-meta">
                                    <span className="admin-categories__card-count">
                                        <Package size={13} />
                                        {cat.productCount || 0} products
                                    </span>
                                    <span className={`admin-categories__card-status ${cat.isActive ? 'active' : 'inactive'}`}>
                                        {cat.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            <div className="admin-categories__card-actions">
                                <button title="Edit" onClick={() => { setEditCategory(cat); setShowForm(true); }} className="admin-categories__action-btn edit">
                                    <Edit2 size={15} />
                                </button>
                                <button
                                    title={cat.isActive ? 'Deactivate' : 'Activate'}
                                    onClick={async () => {
                                        try {
                                            await adminService.toggleCategory(cat._id, !cat.isActive);
                                            fetchCategories();
                                        } catch (err) {
                                            console.error('Toggle failed:', err);
                                        }
                                    }}
                                    className="admin-categories__action-btn toggle"
                                >
                                    {cat.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                                <button title="Delete" onClick={() => setDeleteConfirm(cat)} className="admin-categories__action-btn delete">
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <CategoryForm
                    category={editCategory}
                    onClose={() => { setShowForm(false); setEditCategory(null); }}
                    onSuccess={handleFormSuccess}
                />
            )}

            {deleteConfirm && (
                <div className="admin-categories__modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="admin-categories__modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete Category</h3>
                        <p>
                            Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
                            {deleteConfirm.productCount > 0 && (
                                <span className="admin-categories__modal-warning">
                                    This category has {deleteConfirm.productCount} product{deleteConfirm.productCount !== 1 ? 's' : ''}. Deleting it will leave those products uncategorized.
                                </span>
                            )}
                        </p>
                        <div className="admin-categories__modal-actions">
                            <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="btn-delete" onClick={() => handleDelete(deleteConfirm._id)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
