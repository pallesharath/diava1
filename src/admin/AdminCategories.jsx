import React, { useState } from 'react';
import { syncCategoryToSupabase } from '../services/dataSync';
import './AdminShared.css';

export default function AdminCategories({ categories, setCategories, products, setProducts, showToast }) {
  const [modal, setModal]     = useState(null);
  const [confirm, setConfirm] = useState(null);

  const empty = { name: '', icon: '🌿', color: '#1a6b3a', bg: '#e8f8ee' };
  const [form, setForm] = useState(empty);

  function openAdd()  { setForm(empty); setModal('add'); }
  function openEdit(c) { setForm({ ...c }); setModal(c); }

  function save() {
    if (!form.name.trim()) { showToast('Category name is required', false); return; }
    
    try {
      if (modal === 'add') {
        // Sync new category to Supabase
        try {
          syncCategoryToSupabase(form, 'add').catch(err => 
            console.warn('Category sync failed:', err.message)
          );
        } catch (err) {
          console.warn('Category sync error:', err.message);
        }
        
        setCategories((prev) => [...prev, { ...form }]);
        showToast('Category added ✓');
      } else {
        // Sync updates to Supabase
        try {
          syncCategoryToSupabase(form, 'update').catch(err => 
            console.warn('Category sync failed:', err.message)
          );
        } catch (err) {
          console.warn('Category sync error:', err.message);
        }
        
        // rename products that used the old category name
        if (modal.name !== form.name) {
          setProducts((prev) =>
            prev.map((p) => (p.category === modal.name ? { ...p, category: form.name } : p))
          );
        }
        setCategories((prev) => prev.map((c) => (c.name === modal.name ? { ...form } : c)));
        showToast('Category updated ✓');
      }
      setModal(null);
    } catch (error) {
      showToast(`Error: ${error.message}`, false);
    }
  }

  function askDelete(name) {
    setConfirm({
      msg: `Delete "${name}"? Products in this category will become uncategorised.`,
      onOk: async () => {
        const categoryToDelete = categories.find(c => c.name === name);
        
        // Sync deletion to Supabase
        try {
          await syncCategoryToSupabase(categoryToDelete, 'delete');
        } catch (err) {
          console.warn('Category deletion sync failed:', err.message);
        }
        
        setCategories((prev) => prev.filter((c) => c.name !== name));
        showToast('Category deleted');
      },
    });
  }

  return (
    <div>
      <div className="adm-section-hdr">
        <h2 className="adm-section-title">Category Management</h2>
        <button className="adm-btn adm-btn--green" onClick={openAdd}>+ Add Category</button>
      </div>

      {/* Category cards grid */}
      <div className="adm-cat-grid">
        {categories.map((c) => (
          <div key={c.name} className="adm-cat-card">
            <div className="adm-cat-card__icon-wrap" style={{ background: c.bg }}>
              <span>{c.icon}</span>
            </div>
            <div className="adm-cat-card__info">
              <div className="adm-cat-card__name">{c.name}</div>
              <div className="adm-cat-card__count">
                {products.filter((p) => p.category === c.name).length} products
              </div>
            </div>
            <div className="adm-action-btns">
              <button className="adm-btn adm-btn--edit" onClick={() => openEdit(c)}>✏️</button>
              <button className="adm-btn adm-btn--red"  onClick={() => askDelete(c.name)}>🗑️</button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="adm-empty">No categories yet.</div>
        )}
      </div>

      {/* ── MODAL ───────────────────────────────────── */}
      {modal !== null && (
        <div className="adm-modal-bg" onClick={() => setModal(null)}>
          <div className="adm-modal adm-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal__hdr">
              <span className="adm-modal__title">{modal === 'add' ? 'Add New Category' : 'Edit Category'}</span>
              <button className="adm-modal__close" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="adm-modal__body">
              <div className="adm-row">
                <div className="adm-field adm-field--small">
                  <label className="adm-label">Icon</label>
                  <input className="adm-input adm-input--emoji" value={form.icon}
                    onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} maxLength={4} />
                </div>
                <div className="adm-field">
                  <label className="adm-label">Category Name *</label>
                  <input className="adm-input" placeholder="e.g. Pulses" value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
              </div>

              <div className="adm-row">
                <div className="adm-field">
                  <label className="adm-label">Card Colour</label>
                  <div className="adm-color-row">
                    <input type="color" className="adm-color-swatch" value={form.color}
                      onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} />
                    <input className="adm-input" value={form.color}
                      onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} />
                  </div>
                </div>
                <div className="adm-field">
                  <label className="adm-label">Background Colour</label>
                  <div className="adm-color-row">
                    <input type="color" className="adm-color-swatch" value={form.bg}
                      onChange={(e) => setForm((f) => ({ ...f, bg: e.target.value }))} />
                    <input className="adm-input" value={form.bg}
                      onChange={(e) => setForm((f) => ({ ...f, bg: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Live preview */}
              <div className="adm-cat-preview">
                <div className="adm-cat-preview__icon" style={{ background: form.bg }}>{form.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, color: form.color, fontSize: 15 }}>{form.name || 'Preview'}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>Live preview</div>
                </div>
              </div>

              <div className="adm-modal__actions">
                <button className="adm-btn adm-btn--cancel" onClick={() => setModal(null)}>Cancel</button>
                <button className="adm-btn adm-btn--green adm-btn--wide" onClick={save}>
                  {modal === 'add' ? 'Add Category' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM ─────────────────────────────────── */}
      {confirm && (
        <div className="adm-confirm-bg">
          <div className="adm-confirm">
            <p className="adm-confirm__msg">⚠️ {confirm.msg}</p>
            <div className="adm-confirm__actions">
              <button className="adm-btn adm-btn--cancel" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="adm-btn adm-btn--red" onClick={() => { confirm.onOk(); setConfirm(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
