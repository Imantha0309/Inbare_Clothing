import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, Star, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { imageUrl } from '../../services/imageUrl';
import ProductForm from './ProductForm';
import './Products.css';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const limit = 12;

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminService.getProducts({
                page,
                limit,
                all: 'true',
                sort: '-createdAt',
                search: search || undefined,
                category: categoryFilter || undefined,
            });
            setProducts(res.products);
            setTotalPages(res.totalPages);
            setTotal(res.total);
        } catch (err) {
            console.error('Failed to load products:', err);
        } finally {
            setLoading(false);
        }
    }, [page, search, categoryFilter]);

    const fetchCategories = async () => {
        try {
            const cats = await adminService.getCategories();
            setCategories(cats);
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    };

    useEffect(() => { fetchCategories(); }, []);
    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
    };

    const handleDelete = async (id) => {
        try {
            await adminService.deleteProduct(id);
            setDeleteConfirm(null);
            fetchProducts();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditProduct(null);
        fetchProducts();
    };

    const openEdit = (product) => {
        setEditProduct(product);
        setShowForm(true);
    };

    const openCreate = () => {
        setEditProduct(null);
        setShowForm(true);
    };

    const getCategoryName = (cat) => {
        if (!cat) return '—';
        return typeof cat === 'string' ? cat : cat.name || '—';
    };

    return (
        <div className="admin-products">
            <div className="admin-products__header">
                <div>
                    <h1 className="admin-products__title">Products</h1>
                    <p className="admin-products__subtitle">{total} products total</p>
                </div>
                <button className="admin-products__add-btn" onClick={openCreate}>
                    <Plus size={18} />
                    Add Product
                </button>
            </div>

            <div className="admin-products__toolbar">
                <form className="admin-products__search" onSubmit={handleSearch}>
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                    {search && (
                        <button type="button" className="admin-products__search-clear" onClick={() => { setSearch(''); setPage(1); }}>
                            <X size={14} />
                        </button>
                    )}
                </form>
                <select
                    className="admin-products__filter"
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="admin-products__loading">Loading products...</div>
            ) : products.length === 0 ? (
                <div className="admin-products__empty">
                    <p>No products found.</p>
                    <button onClick={openCreate} className="admin-products__add-btn">
                        <Plus size={18} /> Create your first product
                    </button>
                </div>
            ) : (
                <>
                    <div className="admin-products__table-wrap">
                        <table className="admin-products__table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Rating</th>
                                    <th>Status</th>
                                    <th className="admin-products__th-actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((p) => (
                                    <tr key={p._id} className={!p.isActive ? 'admin-products__row--inactive' : ''}>
                                        <td className="admin-products__cell-product">
                                            <div className="admin-products__thumb">
                                                {p.images && p.images[0] ? (
                                                    <img src={imageUrl(p.images[0])} alt={p.name} />
                                                ) : (
                                                    <div className="admin-products__thumb-placeholder" />
                                                )}
                                            </div>
                                            <div>
                                                <span className="admin-products__name">{p.name}</span>
                                                {p.isFeatured && <Star size={12} className="admin-products__star" />}
                                            </div>
                                        </td>
                                        <td className="admin-products__cell-cat">{getCategoryName(p.category)}</td>
                                        <td className="admin-products__cell-price">
                                            {p.discountPrice > 0 && p.discountPrice < p.price ? (
                                                <>
                                                    <span className="admin-products__discount">${Number(p.discountPrice).toFixed(2)}</span>
                                                    <span className="admin-products__orig">${Number(p.price).toFixed(2)}</span>
                                                </>
                                            ) : (
                                                <span>${Number(p.price).toFixed(2)}</span>
                                            )}
                                        </td>
                                        <td className="admin-products__cell-stock">
                                            <span className={`admin-products__stock ${p.stock <= 0 ? 'out' : p.stock <= 10 ? 'low' : ''}`}>
                                                {p.stock}
                                            </span>
                                        </td>
                                        <td className="admin-products__cell-rating">
                                            {p.averageRating > 0 ? `${Number(p.averageRating).toFixed(1)} (${p.numReviews})` : '—'}
                                        </td>
                                        <td className="admin-products__cell-status">
                                            <span className={`admin-products__badge ${p.isActive ? 'active' : 'inactive'}`}>
                                                {p.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="admin-products__cell-actions">
                                            <button title="Edit" onClick={() => openEdit(p)} className="admin-products__action-btn edit">
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                title={p.isActive ? 'Deactivate' : 'Activate'}
                                                onClick={async () => {
                                                    try {
                                                        await adminService.toggleProduct(p._id, !p.isActive);
                                                        fetchProducts();
                                                    } catch (err) {
                                                        console.error('Toggle failed:', err);
                                                    }
                                                }}
                                                className="admin-products__action-btn toggle"
                                            >
                                                {p.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                            <button title="Delete" onClick={() => setDeleteConfirm(p)} className="admin-products__action-btn delete">
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="admin-products__pagination">
                            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                                <ChevronLeft size={16} />
                            </button>
                            <span className="admin-products__page-info">
                                Page {page} of {totalPages}
                            </span>
                            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </>
            )}

            {showForm && (
                <ProductForm
                    product={editProduct}
                    categories={categories}
                    onClose={() => { setShowForm(false); setEditProduct(null); }}
                    onSuccess={handleFormSuccess}
                />
            )}

            {deleteConfirm && (
                <div className="admin-products__modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="admin-products__modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete Product</h3>
                        <p>Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.</p>
                        <div className="admin-products__modal-actions">
                            <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="btn-delete" onClick={() => handleDelete(deleteConfirm._id)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
