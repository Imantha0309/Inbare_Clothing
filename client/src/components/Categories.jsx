import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryService } from '../services/products';
import { imageUrl } from '../services/imageUrl';

const fallbackCategories = [
  { _id: '1', name: 'T-Shirts', slug: 't-shirts', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800' },
  { _id: '2', name: 'Hoodies', slug: 'hoodies', image: 'https://images.unsplash.com/photo-1556821840-3a63f7563303?q=80&w=800' },
  { _id: '3', name: 'Jackets', slug: 'jackets', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800' },
  { _id: '4', name: 'Accessories', slug: 'accessories', image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?q=80&w=800' },
];

// Resolve category image: could be a Parse.File URL or already a full URL
function getCategoryImage(image) {
  if (!image) return null;
  if (typeof image === 'string' && image.startsWith('http')) return image;
  return imageUrl(image);
}

function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(fallbackCategories);

  useEffect(() => {
    categoryService.getAll()
      .then((cats) => {
        if (cats.length > 0) {
          setCategories(cats);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="categories">
      <h2>Shop By Category</h2>

      <div className="category-grid">
        {categories.map((cat) => (
          <div
            className="category-card"
            key={cat._id || cat.slug}
            onClick={() => navigate(`/category/${cat.slug}`)}
            style={{ cursor: 'pointer' }}
          >
            <img src={getCategoryImage(cat.image)} alt={cat.name} />
            <h3>{cat.name}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Categories;
