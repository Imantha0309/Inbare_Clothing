import { useState, useEffect, useCallback } from 'react';
import { Star, Trash2, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { imageUrl } from '../../services/imageUrl';
import './Reviews.css';

const RATING_OPTIONS = ['', '1', '2', '3', '4', '5'];

export default function Reviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [ratingFilter, setRatingFilter] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const limit = 15;

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminService.getReviews({
                page,
                limit,
                rating: ratingFilter || undefined,
            });
            setReviews(res.reviews);
            setTotalPages(res.totalPages);
            setTotal(res.total);
        } catch (err) {
            console.error('Failed to load reviews:', err);
        } finally {
            setLoading(false);
        }
    }, [page, ratingFilter]);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    const handleDelete = async (id) => {
        try {
            await adminService.deleteReview(id);
            setDeleteConfirm(null);
            fetchReviews();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });

    const renderStars = (rating) => (
        <span className="admin-reviews__stars">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={13} className={s <= rating ? 'filled' : ''} />
            ))}
        </span>
    );

    return (
        <div className="admin-reviews">
            <div className="admin-reviews__header">
                <div>
                    <h1 className="admin-reviews__title">Reviews</h1>
                    <p className="admin-reviews__subtitle">{total} reviews total</p>
                </div>
            </div>

            <div className="admin-reviews__toolbar">
                <div className="admin-reviews__filters">
                    <button
                        className={`admin-reviews__filter-btn ${ratingFilter === '' ? 'active' : ''}`}
                        onClick={() => { setRatingFilter(''); setPage(1); }}
                    >All Ratings</button>
                    {RATING_OPTIONS.filter(Boolean).map((r) => (
                        <button
                            key={r}
                            className={`admin-reviews__filter-btn ${ratingFilter === r ? 'active' : ''}`}
                            onClick={() => { setRatingFilter(r); setPage(1); }}
                        >
                            {r} <Star size={12} />
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="admin-reviews__loading">Loading reviews...</div>
            ) : reviews.length === 0 ? (
                <div className="admin-reviews__empty">
                    <p>{ratingFilter ? `No ${ratingFilter}-star reviews.` : 'No reviews yet.'}</p>
                </div>
            ) : (
                <>
                    <div className="admin-reviews__list">
                        {reviews.map((review) => (
                            <div key={review._id} className="admin-reviews__card">
                                <div className="admin-reviews__card-header">
                                    <div className="admin-reviews__user">
                                        <div className="admin-reviews__avatar">
                                            {review.user?.avatar ? (
                                                <img src={review.user.avatar} alt="" />
                                            ) : (
                                                <span>{(review.user?.firstName?.[0] || '').toUpperCase()}{(review.user?.lastName?.[0] || '').toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div>
                                            <span className="admin-reviews__user-name">
                                                {review.user?.firstName} {review.user?.lastName}
                                            </span>
                                            <span className="admin-reviews__user-email">{review.user?.email}</span>
                                        </div>
                                    </div>
                                    <span className="admin-reviews__date">{formatDate(review.createdAt)}</span>
                                </div>

                                <div className="admin-reviews__product">
                                    {review.product?.images?.[0] ? (
                                        <img src={imageUrl(review.product.images[0])} alt="" className="admin-reviews__product-img" />
                                    ) : (
                                        <div className="admin-reviews__product-img admin-reviews__product-img--placeholder" />
                                    )}
                                    <span className="admin-reviews__product-name">{review.product?.name || 'Deleted product'}</span>
                                </div>

                                <div className="admin-reviews__rating">
                                    {renderStars(review.rating)}
                                    <span className="admin-reviews__rating-text">{review.rating}/5</span>
                                </div>

                                {review.comment && (
                                    <p className="admin-reviews__comment">{review.comment}</p>
                                )}

                                <div className="admin-reviews__card-actions">
                                    <button title="Delete" onClick={() => setDeleteConfirm(review)} className="admin-reviews__action-btn delete">
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="admin-reviews__pagination">
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

            {deleteConfirm && (
                <div className="admin-reviews__modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="admin-reviews__modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete Review</h3>
                        <p>
                            Delete review by <strong>{deleteConfirm.user?.firstName} {deleteConfirm.user?.lastName}</strong> for{' '}
                            <strong>{deleteConfirm.product?.name}</strong>? The product's average rating will be recalculated.
                        </p>
                        <div className="admin-reviews__modal-actions">
                            <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="btn-delete" onClick={() => handleDelete(deleteConfirm._id)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
