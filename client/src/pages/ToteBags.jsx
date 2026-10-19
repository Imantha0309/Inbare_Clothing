import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { productService } from '../services/products';
import { imageUrl } from '../services/imageUrl';
import { ToteCardSkeleton } from '../components/Skeleton';
import './ToteBags.css';

function ToteCard({ tote }) {
  const { addToCart, setCartOpen } = useCart();
  const [color, setColor] = useState(tote.colors?.[0] || '#000000');
  const [size, setSize] = useState(tote.sizes?.[0] || 'One Size');
  const [added, setAdded] = useState(false);
  const [hover, setHover] = useState(false);

  const img = imageUrl(tote.images?.[0]) || 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600';
  const price = Number(tote.discountPrice) && Number(tote.discountPrice) < Number(tote.price)
    ? Number(tote.discountPrice)
    : Number(tote.price);

  function handleAdd() {
    addToCart({
      productId: tote._id,
      name: tote.name,
      price: price,
      img: img,
      selectedColor: null,
      selectedSize: size,
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setCartOpen(true);
    }, 600);
  }

  return (
    <article
      className={`tb-card ${hover ? 'hovered' : ''}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link to={`/product/${tote.slug}`} className="tb-img-wrap">
        <img src={img} alt={tote.name} className="tb-img" />
        <div className="tb-img-overlay" />
      </Link>

      <div className="tb-body">
        <div className="tb-top-row">
          <Link to={`/product/${tote.slug}`}><h3 className="tb-name">{tote.name}</h3></Link>
          <span className="tb-price">LKR {price.toLocaleString('en-US')}</span>
        </div>

        {tote.sizes && tote.sizes.length > 0 && !(tote.sizes.length === 1 && tote.sizes[0] === 'One Size') && (
          <div className="tb-section">
            <p className="tb-label">Size</p>
            <div className="tb-sizes">
              {tote.sizes.map((s) => (
                <button
                  key={s}
                  className={`tb-size ${size === s ? 'active' : ''}`}
                  onClick={() => setSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          className={`tb-add ${added ? 'added' : ''}`}
          onClick={handleAdd}
        >
          {added ? (
            <><Check size={16} strokeWidth={2.5} /> Added to bag</>
          ) : (
            <><ShoppingBag size={16} strokeWidth={1.8} /> Add to bag</>
          )}
        </button>
      </div>
    </article>
  );
}

export default function ToteBags() {
  const navigate = useNavigate();
  const [totes, setTotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService.getProducts({ limit: 50 })
      .then((res) => {
        const allProducts = res.products;
        const toteProducts = allProducts.filter(
          (p) => p.category?.name?.toLowerCase().includes('tote') ||
                 p.name?.toLowerCase().includes('tote') ||
                 p.category?.slug?.includes('tote')
        );
        if (toteProducts.length > 0) {
          setTotes(toteProducts);
        } else {
          setTotes(allProducts.slice(0, 10));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="tb-page">
      <div className="tb-hero">
        <div className="tb-hero-content">
          <p className="tb-eyebrow">The Accessory Edit</p>
          <h1 className="tb-hero-title">Canvas Tote Bags</h1>
          <p className="tb-hero-sub">
            Atelier-crafted carry pieces. Each bag is cut from single-weight canvas
            and finished by hand — made to last, made to be seen.
          </p>
        </div>
      </div>

      <div className="tb-bar">
        <button className="tb-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} strokeWidth={2} /> Back
        </button>
        <span className="tb-total">{loading ? '...' : `${totes.length} pieces`}</span>
      </div>

      <section className="tb-grid">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <ToteCardSkeleton key={i} />
          ))
        ) : (
          totes.map((t) => (
            <ToteCard key={t._id} tote={t} />
          ))
        )}
      </section>
    </div>
  );
}
