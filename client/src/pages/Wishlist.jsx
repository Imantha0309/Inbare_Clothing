import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingBag, Check, Trash2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { imageUrl } from '../services/imageUrl';
import './Wishlist.css';

function WishlistCard({ product }) {
  const navigate = useNavigate();
  const { toggleWishlist } = useWishlist();
  const { addToCart, setCartOpen } = useCart();
  const [added, setAdded] = useState(false);

  const img = imageUrl(product.images?.[0]) || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600';
  const price = product.discountPrice && Number(product.discountPrice) < Number(product.price)
    ? Number(product.discountPrice)
    : Number(product.price);

  function handleAdd() {
    addToCart({
      productId: product._id,
      name: product.name,
      price,
      img,
      selectedColor: null,
      selectedSize: product.sizes?.[0] || 'One Size',
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setCartOpen(true);
    }, 600);
  }

  return (
    <div className="wl-card">
      <Link to={`/product/${product.slug}`} className="wl-img-wrap">
        <img src={img} alt={product.name} className="wl-img" />
      </Link>
      <div className="wl-info">
        <Link to={`/product/${product.slug}`}><h3>{product.name}</h3></Link>
        <p className="wl-price">LKR {price.toLocaleString('en-US')}</p>
        <div className="wl-actions">
          <button className={`wl-add-btn ${added ? 'added' : ''}`} onClick={handleAdd}>
            {added ? <><Check size={16} strokeWidth={2.5} /> Added</> : <><ShoppingBag size={16} /> Add to bag</>}
          </button>
          <button className="wl-remove-btn" onClick={() => toggleWishlist(product._id)} aria-label="Remove">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Wishlist() {
  const navigate = useNavigate();
  const { items, loading } = useWishlist();

  return (
    <div className="wl-page">
      <div className="wl-header">
        <button className="wl-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1><Heart size={24} /> Wishlist</h1>
      </div>

      {loading ? (
        <div className="wl-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="wl-skeleton" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="wl-empty">
          <Heart size={48} strokeWidth={1.2} />
          <h2>Your wishlist is empty</h2>
          <p>Save items you love to revisit them later.</p>
          <Link to="/" className="wl-shop-btn">Start Shopping</Link>
        </div>
      ) : (
        <div className="wl-grid">
          {items.map((product) => (
            <WishlistCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
