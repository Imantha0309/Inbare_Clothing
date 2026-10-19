import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartDrawer.css';

export function CartDrawer() {
  const navigate = useNavigate();
  const { cartOpen, setCartOpen, items, updateQty, removeFromCart, subtotal } = useCart();

  return (
    <>
      {/* backdrop */}
      <div
        className={`cart-backdrop ${cartOpen ? 'open' : ''}`}
        onClick={() => setCartOpen(false)}
      />

      {/* drawer */}
      <aside className={`cart-drawer ${cartOpen ? 'open' : ''}`}>
        {/* header */}
        <div className="cart-header">
          <h2>Your Bag</h2>
          <button className="cart-close" onClick={() => setCartOpen(false)} aria-label="Close">
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* items */}
        <div className="cart-items">
          {items.length === 0 ? (
            <p className="cart-empty">Your bag is empty.<br />Items you add will appear here.</p>
          ) : (
            items.map((item, idx) => (
              <div key={idx} className="cart-item">
                <img src={item.img} alt={item.name} className="cart-item-img" />
                <div className="cart-item-info">
                  <div className="cart-item-top">
                    <div>
                      <h3>{item.name}</h3>
                      {item.selectedColor && (
                        <p className="cart-item-meta">
                          Color: {item.selectedColor.label || 'Selected'}
                        </p>
                      )}
                      {item.selectedSize && item.selectedSize !== 'One Size' && (
                        <p className="cart-item-meta">Size: {item.selectedSize}</p>
                      )}
                    </div>
                    <p className="cart-item-price">LKR {Number(item.price || 0).toLocaleString('en-US')}</p>
                  </div>

                  <div className="cart-item-actions">
                    <div className="cart-qty">
                      <button onClick={() => updateQty(item.productId, item.selectedColor, item.selectedSize, item.qty - 1)} aria-label="Decrease">
                        <Minus size={14} strokeWidth={2.5} />
                      </button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateQty(item.productId, item.selectedColor, item.selectedSize, item.qty + 1)} aria-label="Increase">
                        <Plus size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                    <button className="cart-remove" onClick={() => removeFromCart(item.productId, item.selectedColor, item.selectedSize)}>
                      <Trash2 size={16} strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* footer */}
        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-subtotal">
              <span>Subtotal</span>
              <span className="cart-subtotal-price">LKR {subtotal.toLocaleString('en-US')}</span>
            </div>
            <p className="cart-note">Shipping and taxes calculated at checkout.</p>
            <button className="cart-checkout" onClick={() => {
              navigate('/checkout');
              setCartOpen(false);
            }}>Continue to Checkout</button>
          </div>
        )}
      </aside>
    </>
  );
}
