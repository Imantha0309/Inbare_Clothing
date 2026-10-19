import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Users, ShoppingCart, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { adminService } from '../../services/adminService';
import './Dashboard.css';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        adminService.getDashboardStats()
            .then((res) => setStats(res.stats))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="admin-loading">Loading dashboard...</div>;
    if (!stats) return <div className="admin-loading">Failed to load dashboard stats.</div>;

    const statCards = [
        { label: 'Total Revenue', value: `LKR ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: '#16a34a' },
        { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: '#4a90e2' },
        { label: 'Total Products', value: stats.totalProducts, icon: Package, color: '#a855f7' },
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: '#f59e0b' },
    ];

    const statusLabels = {
        pending: 'Pending',
        processing: 'Processing',
        shipped: 'Shipped',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
    };

    const statusColors = {
        pending: '#f59e0b',
        processing: '#4a90e2',
        shipped: '#a855f7',
        delivered: '#16a34a',
        cancelled: '#ef4444',
    };

    return (
        <div className="dashboard">
            <div className="dash-header">
                <h1>Dashboard</h1>
                <p>Overview of your store performance</p>
            </div>

            {/* Stat Cards */}
            <div className="dash-stats">
                {statCards.map((card) => (
                    <div className="dash-stat-card" key={card.label}>
                        <div className="dash-stat-icon" style={{ background: `${card.color}20`, color: card.color }}>
                            <card.icon size={22} />
                        </div>
                        <div className="dash-stat-info">
                            <span className="dash-stat-label">{card.label}</span>
                            <span className="dash-stat-value">{card.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dash-grid">
                {/* Order Status Breakdown */}
                <div className="dash-card">
                    <h3>Order Status</h3>
                    <div className="dash-status-list">
                        {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                            <div className="dash-status-row" key={status}>
                                <div className="dash-status-dot" style={{ background: statusColors[status] || '#666' }} />
                                <span className="dash-status-label">{statusLabels[status] || status}</span>
                                <span className="dash-status-count">{count}</span>
                            </div>
                        ))}
                        {Object.keys(stats.ordersByStatus).length === 0 && (
                            <p className="dash-empty">No orders yet</p>
                        )}
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className="dash-card">
                    <h3><AlertTriangle size={18} style={{ color: '#f59e0b' }} /> Low Stock</h3>
                    <div className="dash-stock-list">
                        {stats.lowStockProducts.map((product) => (
                            <div className="dash-stock-row" key={product._id}>
                                <span className="dash-stock-name">{product.name}</span>
                                <span className="dash-stock-qty" style={{ color: product.stock === 0 ? '#ef4444' : '#f59e0b' }}>
                                    {product.stock} left
                                </span>
                            </div>
                        ))}
                        {stats.lowStockProducts.length === 0 && (
                            <p className="dash-empty">All products well stocked</p>
                        )}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="dash-card dash-card-wide">
                    <div className="dash-card-header">
                        <h3><TrendingUp size={18} /> Recent Orders</h3>
                        <button className="dash-link-btn" onClick={() => navigate('/admin/orders')}>View All</button>
                    </div>
                    <div className="dash-orders-table">
                        <div className="dash-table-header">
                            <span>Order</span>
                            <span>Customer</span>
                            <span>Status</span>
                            <span>Amount</span>
                        </div>
                        {stats.recentOrders.map((order) => (
                            <div className="dash-table-row" key={order._id}>
                                <span className="dash-order-id">#{order._id.toString().slice(-6).toUpperCase()}</span>
                                <span>{order.user?.firstName} {order.user?.lastName}</span>
                                <span>
                                    <span className="dash-status-badge" style={{ background: `${statusColors[order.orderStatus]}20`, color: statusColors[order.orderStatus] }}>
                                        {order.orderStatus}
                                    </span>
                                </span>
                                <span className="dash-order-amount">LKR {Number(order.totalAmount).toLocaleString()}</span>
                            </div>
                        ))}
                        {stats.recentOrders.length === 0 && (
                            <p className="dash-empty">No orders yet</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
