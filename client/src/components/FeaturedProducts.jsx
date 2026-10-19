import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/products';
import { imageUrl } from '../services/imageUrl';
import { ProductCardSkeleton } from './Skeleton';

function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService.getFeaturedProducts(3)
      .then((res) => setProducts(res.products))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="featured">
        <h2>Featured Collection</h2>
        <div className="products">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="featured">
      <h2>Featured Collection</h2>

      <div className="products">
        {products.map((product) => (
          <FeaturedCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}

function FeaturedCard({ product }) {
  const [hover, setHover] = useState(false);
  const img = imageUrl(product.images?.[0]) || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800';
  const hoverImg = imageUrl(product.images?.[1]) || img;
  const displayImg = hover && product.images?.length > 1 ? hoverImg : img;
  const price = Number(product.discountPrice) && Number(product.discountPrice) < Number(product.price)
    ? Number(product.discountPrice)
    : Number(product.price);

  return (
    <Link to={`/product/${product.slug}`} className="product-card"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <img src={displayImg} alt={product.name} className="product-img-fade" />
      <h3>{product.name}</h3>
      <span>LKR {price.toLocaleString('en-US')}</span>
    </Link>
  );
}

export default FeaturedProducts;
