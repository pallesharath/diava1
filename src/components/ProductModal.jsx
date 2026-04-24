import React, { useState } from 'react';
import './ProductModal.css';

export default function ProductModal({ product, categoryMeta, onClose }) {
  const [imgIndex, setImgIndex] = useState(0);

  if (!product) return null;

  const meta     = categoryMeta[product.category] || { color: '#1a6b3a' };
  const benefits = Array.isArray(product.benefits) ? product.benefits : [];
  // Support both new multi-image array and legacy single image_url
  const images   = product.images?.length ? product.images
                 : product.image_url      ? [product.image_url]
                 : [];

  const hasManyImages = images.length > 1;

  function prev() { setImgIndex((i) => (i - 1 + images.length) % images.length); }
  function next() { setImgIndex((i) => (i + 1) % images.length); }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Header (gradient) ─────────────────────── */}
        <div
          className="modal__header"
          style={{ background: `linear-gradient(135deg, ${meta.color}, #0c3520)` }}
        >
          {images.length === 0 && (
            <span className="modal__emoji">{product.emoji}</span>
          )}
          <div>
            <div className="modal__title">{product.name}</div>
            <div className="modal__category-label">{product.category}</div>
          </div>
          <button className="modal__header-close" onClick={onClose}>×</button>
        </div>

        {/* ── Image Gallery ─────────────────────────── */}
        {images.length > 0 && (
          <div className="modal__gallery">
            {/* Main image */}
            <div className="modal__gallery-main">
              <img
                src={images[imgIndex]}
                alt={`${product.name} ${imgIndex + 1}`}
                className="modal__gallery-img"
              />
              {hasManyImages && (
                <>
                  <button className="modal__gallery-arrow modal__gallery-arrow--left" onClick={prev}>‹</button>
                  <button className="modal__gallery-arrow modal__gallery-arrow--right" onClick={next}>›</button>
                  <div className="modal__gallery-counter">{imgIndex + 1} / {images.length}</div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {hasManyImages && (
              <div className="modal__gallery-thumbs">
                {images.map((url, i) => (
                  <button
                    key={i}
                    className={`modal__gallery-thumb ${i === imgIndex ? 'modal__gallery-thumb--active' : ''}`}
                    onClick={() => setImgIndex(i)}
                  >
                    <img src={url} alt={`thumb ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Body ─────────────────────────────────── */}
        <div className="modal__body">
          <div className="modal__price">{product.price}</div>
          <p className="modal__desc">{product.description}</p>

          <div className="modal__info-row">
            <div className="modal__info-box">
              <div className="modal__info-label">Weight / Pack</div>
              <div className="modal__info-val">{product.weight}</div>
            </div>
            <div className="modal__info-box">
              <div className="modal__info-label">Origin</div>
              <div className="modal__info-val">{product.origin}</div>
            </div>
          </div>

          <div className="modal__benefits-title">Key Benefits</div>
          <div className="modal__benefits-wrap">
            {benefits.map((b) => (
              <span key={b} className="modal__benefit-chip">✓ {b}</span>
            ))}
          </div>

          <div className="modal__actions">
            <button className="modal__btn-close" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
