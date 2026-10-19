import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Info, Tag, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orders';
import { couponService } from '../services/orders';
import './Checkout.css';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();

  const [email, setEmail] = useState(user?.email || '');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [address, setAddress] = useState(user?.address?.street || '');
  const [city, setCity] = useState(user?.address?.city || '');
  const [state, setState] = useState(user?.address?.state || '');
  const [zipCode, setZipCode] = useState(user?.address?.zipCode || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState(user?.address?.country || 'Sri Lanka');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const shippingCost = 399;

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percent') {
      discountAmount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
    } else {
      discountAmount = Math.min(appliedCoupon.discountValue, subtotal);
    }
  }

  const total = Math.max(0, subtotal - discountAmount) + shippingCost;

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await couponService.validateCoupon({ code: couponCode.trim() });
      setAppliedCoupon(res.data.coupon);
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('Please sign in to place an order.');
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setLoading(true);
    try {
      await orderService.createOrder({
        shippingAddress: { street: address, city, state, zipCode, country },
        paymentMethod,
        note,
        couponCode: appliedCoupon?.code || undefined,
      });
      await clearCart();
      alert('Order placed successfully!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-left">
          <div className="checkout-header">
            <button onClick={() => navigate(-1)} className="checkout-back">
              <ArrowLeft size={18} />
              Back to cart
            </button>
            <h1>Checkout</h1>
          </div>

          {error && <p className="auth-error">{error}</p>}

          {!user && (
            <div className="checkout-section" style={{ background: '#fff3cd', padding: '12px', borderRadius: '8px' }}>
              <p>Please <a href="/signin">sign in</a> to complete your order.</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="checkout-section">
              <div className="section-header">
                <h2>Contact</h2>
              </div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="checkout-section">
              <h2>Delivery</h2>

              <select value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="Sri Lanka">Sri Lanka</option>
                <option value="India">India</option>
                <option value="Maldives">Maldives</option>
              </select>

              <div className="name-row">
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <input
                type="text"
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />

              <div className="city-postal-row">
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Postal code (optional)"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>

              <input
                type="text"
                placeholder="State / Province"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />

              <div className="phone-input">
                <input
                  type="tel"
                  placeholder="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <Info size={16} className="phone-info" />
              </div>
            </div>

            <div className="checkout-section">
              <h2>Shipping method</h2>
              <div className="shipping-option">
                <label className="radio-label">
                  <input type="radio" name="shipping" value="standard" checked readOnly />
                  <div className="shipping-details">
                    <div>
                      <span className="shipping-name">Standard</span>
                      <span className="shipping-time">3 - 12 Business Days</span>
                    </div>
                    <span className="shipping-price">LKR 399.00</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="checkout-section">
              <h2>Payment</h2>
              <p className="payment-security">All transactions are secure and encrypted.</p>

              <div className="payment-method">
                <label className="payment-method-header">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>Cash on Delivery</span>
                </label>
              </div>

              <div className="payment-method">
                <label className="payment-method-header">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>Credit / Debit Card</span>
                </label>
              </div>

              <div className="payment-method">
                <label className="payment-method-header">
                  <input
                    type="radio"
                    name="payment"
                    value="bank_transfer"
                    checked={paymentMethod === 'bank_transfer'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>Bank Transfer</span>
                </label>
              </div>
            </div>

            <div className="checkout-section">
              <h2>Order Note (optional)</h2>
              <textarea
                placeholder="Special instructions for your order..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '80px' }}
              />
            </div>

            <button type="submit" className="pay-now-btn" disabled={loading || !user}>
              {loading ? 'Placing Order...' : `Pay now — LKR ${total.toLocaleString('en-US')}`}
            </button>
          </form>
        </div>

        <div className="checkout-right">
          <div className="order-items">
            {items.map((item, idx) => {
              const img = item.img || item.image || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600';
              const itemQty = item.qty || item.quantity || 1;
              return (
                <div key={idx} className="order-item">
                  <div className="item-image-wrap">
                    <img src={img} alt={item.name} />
                    <span className="item-qty">{itemQty}</span>
                  </div>
                  <div className="item-details">
                    <h3>{item.name}</h3>
                    {item.selectedColor && <p>Color: {typeof item.selectedColor === 'object' ? item.selectedColor.label : item.selectedColor}</p>}
                    {item.selectedSize && item.selectedSize !== 'One Size' && (
                      <p>Size: {item.selectedSize}</p>
                    )}
                  </div>
                  <span className="item-price">LKR {((item.price || 0) * itemQty).toLocaleString('en-US')}</span>
                </div>
              );
            })}
          </div>

          <div className="discount-section">
            <div className="discount-input-wrap">
              <input
                type="text"
                placeholder="Coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                disabled={!!appliedCoupon}
              />
              {appliedCoupon ? (
                <button type="button" onClick={handleRemoveCoupon} className="discount-remove-btn">
                  <X size={16} /> Remove
                </button>
              ) : (
                <button type="button" onClick={handleApplyCoupon} disabled={couponLoading}>
                  {couponLoading ? 'Checking...' : 'Apply'}
                </button>
              )}
            </div>
            {couponError && <p className="discount-error">{couponError}</p>}
            {appliedCoupon && (
              <div className="discount-applied">
                <Tag size={14} />
                <span>
                  {appliedCoupon.code} — {appliedCoupon.discountType === 'percent'
                    ? `${appliedCoupon.discountValue}% off`
                    : `LKR ${Number(appliedCoupon.discountValue).toLocaleString('en-US')} off`}
                </span>
              </div>
            )}
          </div>

          <div className="order-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>LKR {subtotal.toLocaleString('en-US')}.00</span>
            </div>
            {discountAmount > 0 && (
              <div className="total-row" style={{ color: 'var(--success)' }}>
                <span>Discount</span>
                <span>- LKR {discountAmount.toLocaleString('en-US')}.00</span>
              </div>
            )}
            <div className="total-row">
              <span>Shipping</span>
              <span>LKR {shippingCost.toLocaleString('en-US')}.00</span>
            </div>
            <div className="total-row total-final">
              <span>Total</span>
              <span>
                <small>LKR</small> {total.toLocaleString('en-US')}.00
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
