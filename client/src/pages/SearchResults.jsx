import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { imageUrl } from '../services/imageUrl';
import { productService } from '../services/products';
import { SearchResultsSkeleton } from '../components/Skeleton';
import './SearchResults.css';

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
  const categoryName = product.category?.name || '';

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
    <div className="sr-card">
      <Link to={`/product/${product.slug}`} className="sr-img-wrap">
        <img src={displayImg} alt={product.name} className="sr-img-fade" />
      </Link>

      <div className="sr-info">
        <div className="sr-top">
          <Link to={`/product/${product.slug}`}><h3>{product.name}</h3></Link>
          {categoryName && <p className="sr-category">{categoryName}</p>}
        </div>
        <p className="sr-price">LKR {price.toLocaleString('en-US')}</p>

        {productColors && (
          <div className="sr-section">
            <span className="sr-label">Color — <span className="sr-color-name">{selectedColor?.label || 'Selected'}</span></span>
            <div className="sr-colors">
              {productColors.map((c) => (
                <button
                  key={c.label}
                  className={`sr-color-swatch ${selectedColor?.label === c.label ? 'active' : ''}`}
                  style={{ backgroundColor: getSwatchColor(c.label) }}
                  onClick={() => setSelectedColor(c)}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>
        )}

        {!(productSizes.length === 1 && productSizes[0] === 'One Size') && (
          <div className="sr-section">
            <span className="sr-label">Size</span>
            <div className="sr-sizes">
              {productSizes.map((s) => (
                <button
                  key={s}
                  className={`sr-size-btn ${selectedSize === s ? 'active' : ''}`}
                  onClick={() => setSelectedSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          className={`sr-add-btn ${added ? 'added' : ''}`}
          onClick={handleAdd}
          disabled={!selectedSize}
        >
          {added ? '✓ Added to bag' : 'Add to bag'}
        </button>
      </div>
    </div>
  );
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    productService.getProducts({ search: query, limit: 50 })
      .then((res) => setResults(res.products))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="sr-page">
        <div className="sr-header">
          <button className="sr-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} strokeWidth={2} /> Back
          </button>
          <h1>Search Results</h1>
        </div>

        {query && (
          <div className="sr-query-info">
            <p>Showing results for <strong>"{query}"</strong></p>
            <span className="sr-count">{loading ? 'Searching...' : `${results.length} ${results.length === 1 ? 'item' : 'items'} found`}</span>
          </div>
        )}

        {!query ? (
          <p className="sr-empty">Enter a search term to find products.</p>
        ) : loading ? (
          <SearchResultsSkeleton />
        ) : results.length === 0 ? (
          <div className="sr-no-results">
            <p>No products found for "{query}"</p>
            <p className="sr-suggestion">Try searching for "tee", "hoodie", "tote", or other product names.</p>
          </div>
        ) : (
          <div className="sr-grid">
            {results.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>
  );
}
