import React, { useState, useEffect } from 'react';
import './HomePage.css';
import villageman from '../assets/traditional-man.png';

export default function HomePage({
  products,
  ads,
  categoryMeta,
  setActivePage,
  setSelectedProduct,
}) {
  const [adIndex, setAdIndex]   = useState(0);
  const [adVisible, setAdVisible] = useState(true);

  useEffect(() => {
    if (ads.length === 0) return;
    const timer = setInterval(() => {
      setAdVisible(false);
      setTimeout(() => {
        setAdIndex((i) => (i + 1) % ads.length);
        setAdVisible(true);
      }, 400);
    }, 3400);
    return () => clearInterval(timer);
  }, [ads.length]);

  useEffect(() => { setAdIndex(0); setAdVisible(true); }, [ads.length]);

  const currentAd = ads[adIndex] || { title: 'Diava', desc: 'Farm fresh produce' };
  const featuredProducts = products.slice(0, 6);

  return (
    <div className="home">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero__left">
          <div className="hero__tag">🌿 Farm to Table</div>
          <h1 className="hero__title">
            Dia<span>va</span>
          </h1>
          <p className="hero__sub">
            Connecting the heart of Andhra Pradesh's farming communities
            directly to your home. Fresh, organic &amp; authentic produce
            grown with generations of wisdom.
          </p>
          <div className="hero__btns">
            <button className="btn-primary" onClick={() => setActivePage('Products')}>
              Explore Products
            </button>
            <button className="btn-outline" onClick={() => setActivePage('About Us')}>
              Our Story
            </button>
          </div>
        </div>

        {/* Right panel — character holding signboard */}
        <div className="hero__right">
          <div className="hero__scene">
            <div className="vm-wrapper">
              <img
                src={villageman}
                alt="Village man with signboard"
                className="vm-image"
              />
              <div className="vm-board-overlay">
                {ads.length > 0 && (
                  <div className={`vm-ad-inner ${adVisible ? 'vm-ad--shown' : 'vm-ad--hidden'}`}>

                    {/* LEFT SIDE — image or emoji */}
                    <div className="vm-ad-icon">
                      {currentAd.image ? (
                        <img
                          src={currentAd.image}
                          alt={currentAd.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: 8,
                          }}
                        />
                      ) : (
                        currentAd.icon || '🌿'
                      )}
                    </div>

                    {/* RIGHT SIDE — text */}
                    <div className="vm-ad-divider" />
                    <div className="vm-ad-title">{currentAd.title}</div>
                    <div className="vm-ad-desc">{currentAd.desc}</div>

                    {ads.length > 1 && (
                      <div className="ad-dots">
                        {ads.map((_, i) => (
                          <button
                            key={i}
                            className={`ad-dot ${i === adIndex ? 'ad-dot--on' : ''}`}
                            onClick={() => {
                              setAdVisible(false);
                              setTimeout(() => { setAdIndex(i); setAdVisible(true); }, 350);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ────────────────────────────── */}
      <section className="home-products">
        <div className="home-products__header">
          <span className="section-tag">Our Harvest</span>
          <h2 className="home-products__title">
            Fresh <span>Products</span>
          </h2>
          <p className="home-products__sub">
            Directly sourced from Andhra Pradesh's finest farming communities
          </p>
        </div>

        <div className="home-products__grid">
          {featuredProducts.map((p) => {
            const meta = categoryMeta[p.category] || { color: '#1a6b3a', bg: '#e8f8ee' };
            const firstImage = p.images?.[0] || p.image_url || null;
            return (
              <div key={p.id} className="prod-card">
                <div className="prod-card-img">
                  {firstImage ? (
                    <img src={firstImage} alt={p.name} />
                  ) : (
                    <span style={{ fontSize: 48 }}>{p.emoji}</span>
                  )}
                  <span className="prod-card-badge" style={{ background: meta.color }}>
                    {p.category}
                  </span>
                </div>
                <div className="prod-card-body">
                  <div className="prod-card-name">{p.name}</div>
                  <div className="prod-card-origin">📍 {p.origin}</div>
                  <div className="prod-card-price">{p.price}</div>
                  <button className="prod-card-btn" onClick={() => setSelectedProduct(p)}>
                    View Details →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {products.length > 6 && (
          <div className="home-products__cta">
            <button className="btn-primary" onClick={() => setActivePage('Products')}>
              View All Products →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
