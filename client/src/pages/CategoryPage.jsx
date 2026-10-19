import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { productService, categoryService } from '../services/products';
import { imageUrl } from '../services/imageUrl';
import { ProductGridSkeleton } from '../components/Skeleton';
import './CategoryPage.css';

const priceRanges = [
  { label: 'All',               min: 0,    max: Infinity },
  { label: 'Under LKR 3,500',   min: 0,    max: 3500 },
  { label: 'LKR 3,500 – 4,500', min: 3500, max: 4500 },
  { label: 'LKR 4,500 – 5,500', min: 4500, max: 5500 },
  { label: 'Over LKR 5,500',    min: 5500, max: Infinity },
];

// Map color names (case-insensitive) to CSS-safe values
const COLOR_MAP = {
  black: '#111', white: '#f5f5f5', navy: '#1a2744', gray: '#888',
  grey: '#888', brown: '#7b4f2e', beige: '#d4b896', red: '#d32f2f',
  green: '#2e7d32', blue: '#1565c0', cream: '#f5f0e8', pink: '#e91e8c',
  orange: '#e65100', yellow: '#f9a825', purple: '#6a1b9a', khaki: '#b5a642',
  'burnt clay': '#8b4513', 'forest green': '#228b22', 'navy blue': '#1a2744',
  'light ash': '#c9c9c9', ash: '#b0b0b0', maroon: '#800000', olive: '#808000',
  teal: '#008080', coral: '#ff6b6b', lavender: '#967bb6',
};

function getSwatchColor(name) {
  return COLOR_MAP[name.toLowerCase()] || '#ccc';
}

function ProductCard({ product }) {
  const { addToCart, setCartOpen } = useCart();
  const productColors = product.colors?.length > 0
    ? product.colors.map((c) => ({ label: c }))
    : null;
  const productSizes = product.sizes?.length > 0 ? product.sizes : ['One Size'];
  const [selectedColor, setSelectedColor] = useState(productColors ? productColors[0] : null);
  const [selectedSize, setSelectedSize] = useState(
    productSizes.length === 1 && productSizes[0] === 'One Size' ? 'One Size' : null
  );
  const [added, setAdded] = useState(false);

  const displayImg = imageUrl(product.images?.[0]) || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600';
  const price = Number(product.discountPrice) && Number(product.discountPrice) < Number(product.price)
    ? Number(product.discountPrice)
    : Number(product.price);

  function handleAdd() {
    if (!selectedSize) return;
    addToCart({
      productId: product._id,
      name: product.name,
      price: price,
      img: displayImg,
      selectedColor,
      selectedSize,
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setCartOpen(true);
    }, 600);
  }

  return (
    <div className="cp-card">
      <Link to={`/product/${product.slug}`} className="cp-img-wrap">
        <img src={displayImg} alt={product.name} className="cp-img-fade" />
      </Link>

      <div className="cp-info">
        <Link to={`/product/${product.slug}`}><h3>{product.name}</h3></Link>
        <p className="cp-price">LKR {price.toLocaleString('en-US')}</p>

        {productColors && (
          <div className="cp-section">
            <span className="cp-label">Color — <span className="cp-color-name">{selectedColor?.label || 'All'}</span></span>
            <div className="cp-colors">
              {productColors.map((c) => (
                <button
                  key={c.label}
                  className={`cp-color-swatch ${selectedColor?.label === c.label ? 'active' : ''}`}
                  style={{ backgroundColor: getSwatchColor(c.label) }}
                  onClick={() => setSelectedColor(c)}
                  aria-label={c.label}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        )}

        {!(productSizes.length === 1 && productSizes[0] === 'One Size') && (
          <div className="cp-section">
            <span className="cp-label">Size</span>
            <div className="cp-sizes">
              {productSizes.map((s) => (
                <button
                  key={s}
                  className={`cp-size-btn ${selectedSize === s ? 'active' : ''}`}
                  onClick={() => setSelectedSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          className={`cp-add-btn ${added ? 'added' : ''}`}
          onClick={handleAdd}
          disabled={!selectedSize}
        >
          {added ? '✓ Added to bag' : 'Add to bag'}
        </button>
      </div>
    </div>
  );
}

function CategoryPage() {
  const { slug }   = useParams();
  const navigate   = useNavigate();
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [priceIdx, setPriceIdx] = useState(0);
  const [sizeFilter, setSizeFilter] = useState('All');
  const [colorFilter, setColorFilter] = useState('All');

  useEffect(() => {
    setLoading(true);
    categoryService.getAll()
      .then((categories) => {
        const cat = categories.find((c) => c.slug === slug);
        if (cat) {
          setCategoryName(cat.name);
          return productService.getProducts({ category: cat._id, limit: 50 });
        }
        setCategoryName(slug);
        return productService.getProducts({ limit: 50 });
      })
      .then((res) => {
        if (res) setProducts(res.products);
      })
      .catch(() => {
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const allSizes = ['All', ...new Set(products.flatMap((p) => p.sizes || []))];
  const allColors = ['All', ...new Set(products.flatMap((p) => p.colors || []))];
  const range = priceRanges[priceIdx];

  const filtered = products.filter((p) => {
    const inPrice = Number(p.price) >= range.min && Number(p.price) < range.max;
    const inSize = sizeFilter === 'All' || (p.sizes || []).includes(sizeFilter);
    const inColor = colorFilter === 'All' || (p.colors || []).includes(colorFilter);
    return inPrice && inSize && inColor;
  });

  if (loading) {
    return (
      <div className="cp-page">
        <div className="cp-topbar">
          <h1 className="cp-empty" style={{ flex: 1 }}>Loading...</h1>
        </div>
        <div className="cp-layout">
          <aside className="cp-sidebar" />
          <main className="cp-grid">
            <ProductGridSkeleton count={6} />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-page">
        <div className="cp-topbar">
          <button className="cp-back" onClick={() => navigate('/')}>← Back</button>
          <h1>{categoryName || slug}</h1>
          <span className="cp-count">{filtered.length} items</span>
        </div>

        <div className="cp-layout">
          <aside className="cp-sidebar">
            <div className="cp-filter-group">
              <h4>Price</h4>
              {priceRanges.map((r, i) => (
                <label key={r.label} className="cp-radio">
                  <input type="radio" name="price" checked={priceIdx === i} onChange={() => setPriceIdx(i)} />
                  {r.label}
                </label>
              ))}
            </div>
            {allSizes.length > 2 && (
              <div className="cp-filter-group">
                <h4>Size</h4>
                {allSizes.map((s) => (
                  <label key={s} className="cp-radio">
                    <input type="radio" name="size" checked={sizeFilter === s} onChange={() => setSizeFilter(s)} />
                    {s}
                  </label>
                ))}
              </div>
            )}
            {allColors.length > 2 && (
              <div className="cp-filter-group">
                <h4>Color</h4>
                {allColors.map((c) => (
                  <label key={c} className="cp-radio">
                    <input type="radio" name="color" checked={colorFilter === c} onChange={() => setColorFilter(c)} />
                    {c}
                  </label>
                ))}
              </div>
            )}
          </aside>

          <main className="cp-grid">
            {filtered.length === 0 ? (
              <p className="cp-empty">No products match your filters.</p>
            ) : (
              filtered.map((p) => <ProductCard key={p._id} product={p} />)
            )}
          </main>
        </div>
      </div>
  );
}

export default CategoryPage;
