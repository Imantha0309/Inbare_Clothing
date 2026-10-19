import { useState, useEffect, useCallback } from 'react';
import { Search, Edit2, Trash2, Eye, EyeOff, Shield, User, Mail, Phone, MapPin, X, Loader2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import './Users.css';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [editUser, setEditUser] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const limit = 12;

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminService.getUsers({
                page,
                limit,
                role: roleFilter || undefined,
            });
            setUsers(res.users);
            setTotalPages(res.totalPages);
            setTotal(res.total);
        } catch (err) {
            console.error('Failed to load users:', err);
        } finally {
            setLoading(false);
        }
    }, [page, roleFilter]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const filtered = users.filter((u) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            u.firstName?.toLowerCase().includes(q) ||
            u.lastName?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q)
        );
    });

    const handleDelete = async (id) => {
        try {
            await adminService.deleteUser(id);
            setDeleteConfirm(null);
            fetchUsers();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const toggleActive = async (user) => {
        try {
            await adminService.updateUser(user._id, { isActive: !user.isActive });
            fetchUsers();
        } catch (err) {
            console.error('Toggle failed:', err);
        }
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });

    return (
        <div className="admin-users">
            <div className="admin-users__header">
                <div>
                    <h1 className="admin-users__title">Users</h1>
                    <p className="admin-users__subtitle">{total} users total</p>
                </div>
            </div>

            <div className="admin-users__toolbar">
                <div className="admin-users__search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="admin-users__search-clear" onClick={() => setSearch('')}>
                            <X size={14} />
                        </button>
                    )}
                </div>
                <div className="admin-users__role-filters">
                    {['', 'customer', 'admin'].map((r) => (
                        <button
                            key={r}
                            className={`admin-users__role-btn ${roleFilter === r ? 'active' : ''}`}
                            onClick={() => { setRoleFilter(r); setPage(1); }}
                        >
                            {r === '' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="admin-users__loading">Loading users...</div>
            ) : filtered.length === 0 ? (
                <div className="admin-users__empty">
                    <p>{search || roleFilter ? 'No users match your filters.' : 'No users yet.'}</p>
                </div>
            ) : (
                <>
                    <div className="admin-users__grid">
                        {filtered.map((u) => (
                            <div key={u._id} className={`admin-users__card ${!u.isActive ? 'inactive' : ''}`}>
                                <div className="admin-users__card-top">
                                    <div className="admin-users__avatar">
                                        {u.avatar ? (
                                            <img src={u.avatar} alt="" />
                                        ) : (
                                            <span>{(u.firstName?.[0] || '').toUpperCase()}{(u.lastName?.[0] || '').toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="admin-users__card-name">
                                        <h3>{u.firstName} {u.lastName}</h3>
                                        <span className="admin-users__card-email">{u.email}</span>
                                    </div>
                                    {!u.isActive && <span className="admin-users__inactive-label">Inactive</span>}
                                </div>

                                <div className="admin-users__card-meta">
                                    <div className="admin-users__meta-row">
                                        <span className="admin-users__meta-label">Role</span>
                                        <span className={`admin-users__badge ${u.role === 'admin' ? 'admin' : 'customer'}`}>
                                            {u.role === 'admin' && <Shield size={11} />}
                                            {u.role}
                                        </span>
                                    </div>
                                    <div className="admin-users__meta-row">
                                        <span className="admin-users__meta-label">Joined</span>
                                        <span className="admin-users__meta-value">{formatDate(u.createdAt)}</span>
                                    </div>
                                    {u.phone && (
                                        <div className="admin-users__meta-row">
                                            <span className="admin-users__meta-label">Phone</span>
                                            <span className="admin-users__meta-value">{u.phone}</span>
                                        </div>
                                    )}
                                    {u.city && (
                                        <div className="admin-users__meta-row">
                                            <span className="admin-users__meta-label">Location</span>
                                            <span className="admin-users__meta-value">{u.city}{u.state ? `, ${u.state}` : ''}</span>
                                        </div>
                                    )}
                                    <div className="admin-users__meta-row">
                                        <span className="admin-users__meta-label">Email Verified</span>
                                        <span className={`admin-users__verified ${u.emailVerified ? 'yes' : 'no'}`}>
                                            {u.emailVerified ? 'Verified' : 'Unverified'}
                                        </span>
                                    </div>
                                </div>

                                <div className="admin-users__card-actions">
                                    <button title="Edit" onClick={() => setEditUser(u)} className="admin-users__action-btn edit">
                                        <Edit2 size={15} />
                                    </button>
                                    <button
                                        title={u.isActive ? 'Deactivate' : 'Activate'}
                                        onClick={() => toggleActive(u)}
                                        className="admin-users__action-btn toggle"
                                    >
                                        {u.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                    <button title="Delete" onClick={() => setDeleteConfirm(u)} className="admin-users__action-btn delete">
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="admin-users__pagination">
                            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
                            <span>Page {page} of {totalPages}</span>
                            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
                        </div>
                    )}
                </>
            )}

            {editUser && (
                <UserEditModal
                    user={editUser}
                    onClose={() => setEditUser(null)}
                    onSuccess={() => { setEditUser(null); fetchUsers(); }}
                />
            )}

            {deleteConfirm && (
                <div className="admin-users__modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="admin-users__modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete User</h3>
                        <p>
                            Are you sure you want to delete <strong>{deleteConfirm.firstName} {deleteConfirm.lastName}</strong> ({deleteConfirm.email})?
                            {deleteConfirm.role === 'admin' && (
                                <span className="admin-users__modal-warning"> This is an admin account.</span>
                            )}
                        </p>
                        <div className="admin-users__modal-actions">
                            <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="btn-delete" onClick={() => handleDelete(deleteConfirm._id)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function UserEditModal({ user, onClose, onSuccess }) {
    const [form, setForm] = useState({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'customer',
        isActive: user.isActive ?? true,
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            await adminService.updateUser(user._id, form);
            onSuccess();
        } catch (err) {
            setError(err.message || 'Failed to save user');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="admin-users__modal-overlay" onClick={onClose}>
            <div className="admin-users__modal admin-users__modal--form" onClick={(e) => e.stopPropagation()}>
                <div className="admin-users__modal-header">
                    <h3>Edit User</h3>
                    <button className="admin-users__modal-close" onClick={onClose}><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="admin-users__form-error">{error}</div>}

                    <div className="admin-users__form-grid">
                        <div className="admin-users__form-field">
                            <label htmlFor="ue-firstName">First Name</label>
                            <input id="ue-firstName" name="firstName" value={form.firstName} onChange={handleChange} />
                        </div>
                        <div className="admin-users__form-field">
                            <label htmlFor="ue-lastName">Last Name</label>
                            <input id="ue-lastName" name="lastName" value={form.lastName} onChange={handleChange} />
                        </div>
                        <div className="admin-users__form-field">
                            <label htmlFor="ue-email">Email</label>
                            <input id="ue-email" name="email" type="email" value={form.email} onChange={handleChange} />
                        </div>
                        <div className="admin-users__form-field">
                            <label htmlFor="ue-phone">Phone</label>
                            <input id="ue-phone" name="phone" value={form.phone} onChange={handleChange} />
                        </div>
                        <div className="admin-users__form-field">
                            <label htmlFor="ue-role">Role</label>
                            <select id="ue-role" name="role" value={form.role} onChange={handleChange}>
                                <option value="customer">Customer</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="admin-users__form-field">
                            <label className="admin-users__form-check">
                                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
                                Active account
                            </label>
                        </div>
                    </div>

                    <div className="admin-users__form-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-save" disabled={submitting}>
                            {submitting ? <><Loader2 size={16} className="spin" /> Saving...</> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
