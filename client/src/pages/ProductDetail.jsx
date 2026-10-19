import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Check, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { imageUrl } from '../services/imageUrl';
import api from '../services/api';
import { ProductPageSkeleton } from '../components/Skeleton';
import WishlistButton from '../components/WishlistButton';
import './ProductDetail.css';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, setCartOpen } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get(`/products/slug/${slug}`)
      .then((res) => {
        setProduct(res.data.product);
        const p = res.data.product;
        if (p.colors?.length) setSelectedColor(p.colors[0]);
        if (p.sizes?.length === 1) setSelectedSize(p.sizes[0]);
      })
      .catch(() => setError('Product not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <ProductPageSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="pd-page">
        <p className="pd-status">{error || 'Product not found'}</p>
        <button className="pd-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Go Back
        </button>
      </div>
    );
  }

  const images = product.images?.length
    ? product.images.map((id) => imageUrl(id))
    : ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800'];

  const price = product.discountPrice && Number(product.discountPrice) < Number(product.price)
    ? Number(product.discountPrice)
    : Number(product.price);

  const hasDiscount = product.discountPrice && Number(product.discountPrice) < Number(product.price);

  function handleAdd() {
    if (!selectedSize && product.sizes?.length && !(product.sizes.length === 1 && product.sizes[0] === 'One Size')) return;
    addToCart({
      productId: product._id,
      name: product.name,
      price,
      img: images[activeImg],
      selectedColor: selectedColor ? { label: selectedColor } : null,
      selectedSize: selectedSize || product.sizes?.[0] || 'One Size',
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setCartOpen(true);
    }, 600);
  }

  const needsSize = product.sizes?.length && !(product.sizes.length === 1 && product.sizes[0] === 'One Size');

  return (
    <div className="pd-page">
      <button className="pd-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Back
      </button>

      <div className="pd-layout">
        <div className="pd-gallery">
          <div className="pd-main-img">
            <img src={images[activeImg]} alt={product.name} />
            <div className="pd-wishlist-wrap">
              <WishlistButton productId={product._id} />
            </div>
          </div>
          {images.length > 1 && (
            <div className="pd-thumbs">
              {images.map((src, i) => (
                <button
                  key={i}
                  className={`pd-thumb ${i === activeImg ? 'active' : ''}`}
                  onClick={() => setActiveImg(i)}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pd-info">
          <h1 className="pd-name">{product.name}</h1>

          <div className="pd-rating">
            {product.averageRating > 0 ? (
              <>
                <div className="pd-stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={16} className={s <= Math.round(product.averageRating) ? 'filled' : ''} />
                  ))}
                </div>
                <span>{product.averageRating.toFixed(1)} ({product.numReviews} {product.numReviews === 1 ? 'review' : 'reviews'})</span>
              </>
            ) : (
              <span className="pd-no-reviews">No reviews yet</span>
            )}
          </div>

          <div className="pd-price">
            <span className="pd-current">LKR {price.toLocaleString('en-US')}</span>
            {hasDiscount && (
              <>
                <span className="pd-original">LKR {Number(product.price).toLocaleString('en-US')}</span>
                <span className="pd-badge">-{Math.round((1 - Number(product.discountPrice) / Number(product.price)) * 100)}%</span>
              </>
            )}
          </div>

          <p className="pd-desc">{product.description}</p>

          {product.colors?.length > 0 && (
            <div className="pd-section">
              <span className="pd-label">Color — <strong>{selectedColor || product.colors[0]}</strong></span>
              <div className="pd-colors">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    className={`pd-color-btn ${selectedColor === c ? 'active' : ''}`}
                    onClick={() => setSelectedColor(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {needsSize && (
            <div className="pd-section">
              <span className="pd-label">Size</span>
              <div className="pd-sizes">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    className={`pd-size-btn ${selectedSize === s ? 'active' : ''}`}
                    onClick={() => setSelectedSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pd-stock">
            {product.stock > 0
              ? product.stock <= 5
                ? `Only ${product.stock} left in stock`
                : 'In stock'
              : 'Out of stock'}
          </div>

          <button
            className={`pd-add-btn ${added ? 'added' : ''}`}
            onClick={handleAdd}
            disabled={product.stock === 0 || (needsSize && !selectedSize)}
          >
            {added ? (
              <><Check size={18} strokeWidth={2.5} /> Added to bag</>
            ) : (
              <><ShoppingBag size={18} strokeWidth={1.8} /> Add to bag</>
            )}
          </button>

          {product.category && (
            <p className="pd-category">
              Category: <span>{product.category.name || product.category}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
