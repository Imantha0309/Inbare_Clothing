import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, ChevronUp, X, Truck, Package, CheckCircle, Clock, Ban, CreditCard } from 'lucide-react';
import { adminService } from '../../services/adminService';
import './Orders.css';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_OPTIONS = ['pending', 'paid', 'failed', 'refunded'];

const STATUS_ICONS = {
    pending: Clock,
    processing: Package,
    shipped: Truck,
    delivered: CheckCircle,
    cancelled: Ban,
};

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [expanded, setExpanded] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const limit = 10;

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminService.getOrders({
                page,
                limit,
                sort: '-createdAt',
                status: statusFilter || undefined,
            });
            setOrders(res.orders);
            setTotalPages(res.totalPages);
            setTotal(res.total);
        } catch (err) {
            console.error('Failed to load orders:', err);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const fetchDetail = async (id) => {
        setDetailLoading(true);
        try {
            const order = await adminService.getOrder(id);
            setDetail(order);
        } catch (err) {
            console.error('Failed to load order detail:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    const toggleExpand = (id) => {
        if (expanded === id) {
            setExpanded(null);
            setDetail(null);
        } else {
            setExpanded(id);
            fetchDetail(id);
        }
    };

    const updateStatus = async (orderId, field, value) => {
        setUpdating(true);
        try {
            await adminService.updateOrderStatus(orderId, { [field]: value });
            fetchDetail(orderId);
            fetchOrders();
        } catch (err) {
            console.error('Update failed:', err);
        } finally {
            setUpdating(false);
        }
    };

    const cancelOrder = async (orderId) => {
        setUpdating(true);
        try {
            await adminService.updateOrderStatus(orderId, { orderStatus: 'cancelled' });
            fetchDetail(orderId);
            fetchOrders();
        } catch (err) {
            console.error('Cancel failed:', err);
        } finally {
            setUpdating(false);
        }
    };

    const getCustomer = (order) => {
        if (!order.user) return 'Unknown';
        return `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || order.user.email;
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    const getItemsCount = (order) => order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

    return (
        <div className="admin-orders">
            <div className="admin-orders__header">
                <div>
                    <h1 className="admin-orders__title">Orders</h1>
                    <p className="admin-orders__subtitle">{total} orders total</p>
                </div>
            </div>

            <div className="admin-orders__toolbar">
                <div className="admin-orders__filters">
                    <button
                        className={`admin-orders__filter-btn ${statusFilter === '' ? 'active' : ''}`}
                        onClick={() => { setStatusFilter(''); setPage(1); }}
                    >All</button>
                    {STATUS_OPTIONS.map((s) => {
                        const Icon = STATUS_ICONS[s];
                        return (
                            <button
                                key={s}
                                className={`admin-orders__filter-btn ${statusFilter === s ? 'active' : ''}`}
                                onClick={() => { setStatusFilter(s); setPage(1); }}
                            >
                                <Icon size={14} />
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        );
                    })}
                </div>
            </div>

            {loading ? (
                <div className="admin-orders__loading">Loading orders...</div>
            ) : orders.length === 0 ? (
                <div className="admin-orders__empty">
                    <p>{statusFilter ? `No ${statusFilter} orders.` : 'No orders yet.'}</p>
                </div>
            ) : (
                <>
                    <div className="admin-orders__list">
                        {orders.map((order) => (
                            <div key={order._id} className={`admin-orders__row ${expanded === order._id ? 'expanded' : ''}`}>
                                <div className="admin-orders__row-main" onClick={() => toggleExpand(order._id)}>
                                    <div className="admin-orders__cell-id">
                                        <span className="admin-orders__oid">#{order._id.slice(-6).toUpperCase()}</span>
                                        <span className="admin-orders__date">{formatDate(order.createdAt)}</span>
                                    </div>
                                    <div className="admin-orders__cell-customer">{getCustomer(order)}</div>
                                    <div className="admin-orders__cell-items">{getItemsCount(order)} item{getItemsCount(order) !== 1 ? 's' : ''}</div>
                                    <div className="admin-orders__cell-amount">${Number(order.totalAmount).toFixed(2)}</div>
                                    <div className="admin-orders__cell-status">
                                        <span className={`admin-orders__badge order-${order.orderStatus}`}>
                                            {order.orderStatus}
                                        </span>
                                        <span className={`admin-orders__badge pay-${order.paymentStatus}`}>
                                            {order.paymentStatus}
                                        </span>
                                    </div>
                                    <div className="admin-orders__expand">
                                        {expanded === order._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </div>
                                </div>

                                {expanded === order._id && (
                                    <div className="admin-orders__detail">
                                        {detailLoading ? (
                                            <div className="admin-orders__detail-loading">Loading details...</div>
                                        ) : detail ? (
                                            <>
                                                <div className="admin-orders__detail-grid">
                                                    <div className="admin-orders__detail-section">
                                                        <h4>Shipping Address</h4>
                                                        <p>
                                                            {detail.street}<br />
                                                            {detail.city}, {detail.state} {detail.zipCode}<br />
                                                            {detail.country}
                                                        </p>
                                                    </div>
                                                    <div className="admin-orders__detail-section">
                                                        <h4>Payment</h4>
                                                        <p>
                                                            Method: <strong>{detail.paymentMethod?.toUpperCase()}</strong><br />
                                                            Status:
                                                            <select
                                                                className="admin-orders__status-select"
                                                                value={detail.paymentStatus}
                                                                onChange={(e) => updateStatus(detail._id, 'paymentStatus', e.target.value)}
                                                                disabled={updating}
                                                            >
                                                                {PAYMENT_OPTIONS.map((p) => (
                                                                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                                                ))}
                                                            </select>
                                                        </p>
                                                    </div>
                                                    <div className="admin-orders__detail-section">
                                                        <h4>Order Status</h4>
                                                        <div className="admin-orders__status-controls">
                                                            <select
                                                                className="admin-orders__status-select"
                                                                value={detail.orderStatus}
                                                                onChange={(e) => updateStatus(detail._id, 'orderStatus', e.target.value)}
                                                                disabled={updating}
                                                            >
                                                                {STATUS_OPTIONS.map((s) => (
                                                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                                                ))}
                                                            </select>
                                                            {['pending', 'processing'].includes(detail.orderStatus) && (
                                                                <button
                                                                    className="admin-orders__cancel-btn"
                                                                    onClick={() => cancelOrder(detail._id)}
                                                                    disabled={updating}
                                                                >
                                                                    <Ban size={14} />
                                                                    Cancel Order
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {detail.note && (
                                                        <div className="admin-orders__detail-section">
                                                            <h4>Note</h4>
                                                            <p className="admin-orders__note">{detail.note}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="admin-orders__items">
                                                    <h4>Items</h4>
                                                    {detail.items.map((item, i) => (
                                                        <div key={i} className="admin-orders__item">
                                                            <div className="admin-orders__item-img">
                                                                {item.image ? <img src={item.image} alt="" /> : <div className="admin-orders__item-img-placeholder" />}
                                                            </div>
                                                            <div className="admin-orders__item-info">
                                                                <span className="admin-orders__item-name">{item.name}</span>
                                                                <span className="admin-orders__item-meta">
                                                                    {item.size && `Size: ${item.size}`}
                                                                    {item.size && item.color && ' · '}
                                                                    {item.color && `Color: ${item.color}`}
                                                                    {(!item.size && !item.color) && `Qty: ${item.quantity}`}
                                                                </span>
                                                            </div>
                                                            <div className="admin-orders__item-price">
                                                                ${Number(item.price).toFixed(2)} × {item.quantity}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="admin-orders__total">
                                                        Total: <strong>${Number(detail.totalAmount).toFixed(2)}</strong>
                                                    </div>
                                                </div>
                                            </>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="admin-orders__pagination">
                            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                                Prev
                            </button>
                            <span>Page {page} of {totalPages}</span>
                            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
