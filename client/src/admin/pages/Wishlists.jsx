import { useState, useEffect, useCallback } from 'react';
import { Heart, Trash2, Search, X, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { imageUrl } from '../../services/imageUrl';
import './Wishlists.css';

export default function Wishlists() {
    const [wishlists, setWishlists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const limit = 12;

    const fetchWishlists = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminService.getWishlists({ page, limit });
            setWishlists(res.wishlists);
            setTotalPages(res.totalPages);
            setTotal(res.total);
        } catch (err) {
            console.error('Failed to load wishlists:', err);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { fetchWishlists(); }, [fetchWishlists]);

    const filtered = wishlists.filter((w) => {
        if (!search) return true;
        const q = search.toLowerCase();
        const userName = `${w.user?.firstName || ''} ${w.user?.lastName || ''}`.toLowerCase();
        const userEmail = w.user?.email?.toLowerCase() || '';
        return userName.includes(q) || userEmail.includes(q);
    });

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });

    return (
        <div className="admin-wishlists">
            <div className="admin-wishlists__header">
                <div>
                    <h1 className="admin-wishlists__title">Wishlists</h1>
                    <p className="admin-wishlists__subtitle">{total} wishlists total</p>
                </div>
            </div>

            <div className="admin-wishlists__toolbar">
                <div className="admin-wishlists__search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search by user name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="admin-wishlists__search-clear" onClick={() => setSearch('')}>
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="admin-wishlists__loading">Loading wishlists...</div>
            ) : filtered.length === 0 ? (
                <div className="admin-wishlists__empty">
                    <p>{search ? 'No wishlists match your search.' : 'No wishlists yet.'}</p>
                </div>
            ) : (
                <>
                    <div className="admin-wishlists__list">
                        {filtered.map((wl) => (
                            <div key={wl._id} className="admin-wishlists__card">
                                <div className="admin-wishlists__card-header">
                                    <div className="admin-wishlists__user">
                                        <div className="admin-wishlists__avatar">
                                            {wl.user?.avatar ? (
                                                <img src={wl.user.avatar} alt="" />
                                            ) : (
                                                <span>{(wl.user?.firstName?.[0] || '').toUpperCase()}{(wl.user?.lastName?.[0] || '').toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div>
                                            <span className="admin-wishlists__user-name">
                                                {wl.user?.firstName} {wl.user?.lastName}
                                            </span>
                                            <span className="admin-wishlists__user-email">{wl.user?.email}</span>
                                        </div>
                                    </div>
                                    <div className="admin-wishlists__card-meta">
                                        <span className="admin-wishlists__count">
                                            <Heart size={13} />
                                            {wl.products?.length || 0} items
                                        </span>
                                        <span className="admin-wishlists__date">{formatDate(wl.createdAt)}</span>
                                    </div>
                                </div>

                                {wl.products && wl.products.length > 0 ? (
                                    <div className="admin-wishlists__products">
                                        {wl.products.map((product) => (
                                            <div key={product._id} className="admin-wishlists__product">
                                                <div className="admin-wishlists__product-img">
                                                    {product.images?.[0] ? (
                                                        <img src={imageUrl(product.images[0])} alt="" />
                                                    ) : (
                                                        <div className="admin-wishlists__product-img-placeholder">
                                                            <Package size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="admin-wishlists__product-info">
                                                    <span className="admin-wishlists__product-name">{product.name}</span>
                                                    <span className="admin-wishlists__product-price">
                                                        {Number(product.discountPrice) > 0 && Number(product.discountPrice) < Number(product.price) ? (
                                                            <>
                                                                <span className="discount">${Number(product.discountPrice).toFixed(2)}</span>
                                                                <span className="orig">${Number(product.price).toFixed(2)}</span>
                                                            </>
                                                        ) : (
                                                            `$${Number(product.price).toFixed(2)}`
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="admin-wishlists__empty-list">Empty wishlist</div>
                                )}
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="admin-wishlists__pagination">
                            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                                <ChevronLeft size={16} />
                            </button>
                            <span>Page {page} of {totalPages}</span>
                            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
