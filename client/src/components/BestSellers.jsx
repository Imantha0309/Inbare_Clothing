import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/products';
import { imageUrl } from '../services/imageUrl';
import { ProductCardSkeleton } from './Skeleton';

function BestSellers() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService.getProducts({ sort: '-averageRating', limit: 3 })
      .then((res) => setProducts(res.products))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const badges = ['BEST SELLER', 'HOT', 'TRENDING'];

  if (loading) {
    return (
      <section className="best-sellers">
        <div className="section-title">
          <span>MOST WANTED</span>
          <h2>Best Sellers</h2>
        </div>
        <div className="best-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="best-sellers">
      <div className="section-title">
        <span>MOST WANTED</span>
        <h2>Best Sellers</h2>
      </div>

      <div className="best-grid">
        {products.map((product, i) => {
          const img = imageUrl(product.images?.[0]) || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200';
          const price = Number(product.discountPrice) && Number(product.discountPrice) < Number(product.price)
            ? Number(product.discountPrice)
            : Number(product.price);
          return (
            <Link to={`/product/${product.slug}`} className="best-card" key={product._id}>
              <div className="badge">{badges[i] || 'POPULAR'}</div>
              <img src={img} alt={product.name} />
              <h3>{product.name}</h3>
              <p>LKR {price.toLocaleString('en-US')}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default BestSellers;
