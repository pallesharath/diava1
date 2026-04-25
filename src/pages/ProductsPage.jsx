import React, { useMemo } from 'react';
import './ProductsPage.css';

export default function ProductsPage({
  products,
  categories,
  categoryMeta,
  activeCategory,
  setActiveCategory,
  setSelectedProduct,
}) {
  // ── Filter products by category ────────────────────────
  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    if (activeCategory === 'All') return products;
    return products.filter((p) => p.category === activeCategory);
  }, [products, activeCategory]);

  return (
    <div className="products-page">
      {/* ── HEADER ────────────────────────────────────────── */}
      <section className="products-header">
        <span className="section-tag">Shop Fresh</span>
        <h1 className="products-header__title">
          All <span>Products</span>
        </h1>
        <p className="products-header__sub">
          Authentic farm produce from Andhra Pradesh's farming families
        </p>
      </section>

      {/* ── CATEGORY FILTERS ──────────────────────────────── */}
      <section className="products-filters">
        <div className="category-buttons">
          {/* "All" button */}
          <button
            className={`category-btn ${activeCategory === 'All' ? 'category-btn--active' : ''}`}
            onClick={() => setActiveCategory('All')}
          >
            All
          </button>

          {/* Category buttons */}
          {categories && categories.map((cat) => (
            <button
              key={cat.id || cat.name}
              className={`category-btn ${activeCategory === cat.name ? 'category-btn--active' : ''}`}
              onClick={() => setActiveCategory(cat.name)}
              style={{
                borderColor: activeCategory === cat.name ? categoryMeta[cat.name]?.color : '#ccc',
                color: activeCategory === cat.name ? categoryMeta[cat.name]?.color : '#666',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* ── PRODUCTS GRID ─────────────────────────────────── */}
      <section className="products-grid-section">
        {filteredProducts && filteredProducts.length > 0 ? (
          <div className="products-grid">
            {filteredProducts.map((product) => {
              const meta = categoryMeta[product.category] || { color: '#1a6b3a', bg: '#e8f8ee' };
              const firstImage = product.images?.[0] || product.image_url || null;

              return (
                <div key={product.id} className="prod-card">
                  <div className="prod-card-img">
                    {firstImage ? (
                      <img src={firstImage} alt={product.name} />
                    ) : (
                      <span style={{ fontSize: 48 }}>{product.emoji || '🌾'}</span>
                    )}
                    <span
                      className="prod-card-badge"
                      style={{ background: meta.color }}
                    >
                      {product.category}
                    </span>
                  </div>
                  <div className="prod-card-body">
                    <div className="prod-card-name">{product.name}</div>
                    <div className="prod-card-origin">📍 {product.origin}</div>
                    <div className="prod-card-price">{product.price}</div>
                    <button
                      className="prod-card-btn"
                      onClick={() => setSelectedProduct(product)}
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="products-empty">
            <p>No products found in this category.</p>
          </div>
        )}
      </section>
    </div>
  );
}
