import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { imageUrl } from '../services/imageUrl';
import { orderService } from '../services/orders';
import './Orders.css';

const statusColors = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#16a34a',
  cancelled: '#ef4444',
};

export default function Orders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    orderService.getMyOrders({ page: 1, limit: 10 })
      .then((res) => setOrders(res.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="orders-page">
        <button className="orders-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
        <div className="orders-empty">
          <p>Please <Link to="/signin">sign in</Link> to view your orders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <button className="orders-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1>Order History</h1>
      </div>

      {loading ? (
        <div className="orders-loading">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="orders-skeleton" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="orders-empty">
          <Package size={48} strokeWidth={1.2} />
          <h2>No orders yet</h2>
          <p>When you place an order, it will appear here.</p>
          <Link to="/" className="orders-shop-btn">Start Shopping</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const orderId = String(order.id);
            const isExpanded = expandedId === order.id;
            const date = new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            });
            return (
              <div key={order.id} className="orders-card">
                <button
                  className="orders-card-header"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <div className="orders-card-left">
                    <span className="orders-id">#{orderId.slice(-8).toUpperCase()}</span>
                    <span className="orders-date">{date}</span>
                    <span
                      className="orders-status"
                      style={{ color: statusColors[order.orderStatus] || '#888' }}
                    >
                      {order.orderStatus}
                    </span>
                  </div>
                  <div className="orders-card-right">
                    <span className="orders-total">LKR {Number(order.totalAmount || 0).toLocaleString('en-US')}</span>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="orders-card-body">
                    <div className="orders-items">
                      {order.items.map((item, idx) => {
                        const img = item.image || imageUrl(item.product?.images?.[0]) || '';
                        return (
                          <div key={idx} className="orders-item">
                            {img && <img src={img} alt={item.name} className="orders-item-img" />}
                            <div className="orders-item-info">
                              <span className="orders-item-name">{item.name}</span>
                              <span className="orders-item-meta">
                                {item.color && `Color: ${item.color}`}
                                {item.color && item.size && ' · '}
                                {item.size && item.size !== 'One Size' && `Size: ${item.size}`}
                                {` · Qty: ${item.quantity}`}
                              </span>
                            </div>
                            <span className="orders-item-price">
                              LKR {Number(item.price || 0).toLocaleString('en-US')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="orders-detail-row">
                      <span>Payment: {order.paymentMethod?.replace('_', ' ')}</span>
                      <span>Status: {order.paymentStatus}</span>
                    </div>
                    {order.street && (
                      <div className="orders-detail-row">
                        <span>
                          Ship to: {order.street}, {order.city}, {order.state}, {order.country}
                        </span>
                      </div>
                    )}
                    {order.note && (
                      <div className="orders-note">
                        <span>Note: {order.note}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
