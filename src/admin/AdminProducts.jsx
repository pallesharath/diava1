import React, { useState, useRef } from 'react';
import { syncProductToSupabase } from '../services/dataSync';
import { supabase } from '../services/supabaseClient';
import './AdminShared.css';
import './AdminProducts.css';

const BUCKET = 'product-images';

async function uploadImage(file, productName) {
  const ext      = file.name.split('.').pop();
  const fileName = `${productName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  // ✅ uses the centralised supabase client uploadFile helper
  return supabase.uploadFile(BUCKET, fileName, file);
}

export default function AdminProducts({ products, setProducts, categories, showToast }) {
  const [modal,   setModal]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving,  setSaving]  = useState(false);

  const emptyForm = {
    name: '', emoji: '🌿', price: '', category: categories[0]?.name || '',
    description: '', weight: '', origin: '', benefits: '', images: [],
  };
  const [form,       setForm]       = useState(emptyForm);
  const [uploading,  setUploading]  = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);
  const fileRef = useRef();

  function openAdd()   { setForm(emptyForm); setPreviewIdx(0); setModal('add'); }
  function openEdit(p) {
    setForm({
      ...p,
      benefits: Array.isArray(p.benefits) ? p.benefits.join(', ') : (p.benefits || ''),
      images:   Array.isArray(p.images)   ? [...p.images]          : (p.image_url ? [p.image_url] : []),
    });
    setPreviewIdx(0);
    setModal(p);
  }

  async function handleFiles(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const slots = 4 - form.images.length;
    if (slots <= 0) { showToast('Max 4 images. Remove one first.', false); return; }
    setUploading(true);
    try {
      const urls = await Promise.all(
        files.slice(0, slots).map((f) => uploadImage(f, form.name || 'product'))
      );
      setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
      showToast(`${urls.length} image${urls.length > 1 ? 's' : ''} uploaded ✓`);
    } catch (err) {
      showToast(`Upload failed: ${err.message}`, false);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function removeImage(idx) {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
    setPreviewIdx((i) => Math.max(0, i - 1));
  }

  function moveImage(from, to) {
    setForm((prev) => {
      const imgs = [...prev.images];
      const [item] = imgs.splice(from, 1);
      imgs.splice(to, 0, item);
      return { ...prev, images: imgs };
    });
  }

  async function save() {
    if (!form.name.trim() || !form.price.trim()) {
      showToast('Name & Price are required', false); return;
    }
    setSaving(true);
    try {
      const record = {
        ...form,
        benefits:  (form.benefits || '').split(',').map((s) => s.trim()).filter(Boolean),
        images:    form.images,
        image_url: form.images[0] || '',
      };

      if (modal === 'add') {
        // ✅ FIX: syncProductToSupabase returns the row WITH the real Supabase ID
        const saved = await syncProductToSupabase(record, 'add');
        setProducts((prev) => [...prev, saved]);
        showToast('Product added ✓');
      } else {
        const updated = { ...record, id: modal.id };
        await syncProductToSupabase(updated, 'update');
        setProducts((prev) => prev.map((p) => (p.id === modal.id ? updated : p)));
        showToast('Product updated ✓');
      }
      setModal(null);
    } catch (err) {
      showToast(`Save failed: ${err.message}`, false);
    } finally {
      setSaving(false);
    }
  }

  function askDelete(id) {
    setConfirm({
      msg: 'Delete this product? This cannot be undone.',
      onOk: async () => {
        try {
          await syncProductToSupabase({ id }, 'delete');
          setProducts((prev) => prev.filter((p) => p.id !== id));
          showToast('Product deleted');
        } catch (err) {
          showToast(`Delete failed: ${err.message}`, false);
        }
      },
    });
  }

  return (
    <div>
      <div className="adm-section-hdr">
        <h2 className="adm-section-title">Product Management</h2>
        <button className="adm-btn adm-btn--green" onClick={openAdd}>+ Add Product</button>
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Origin</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const cat      = categories.find((c) => c.name === p.category);
              const thumbUrl = p.images?.[0] || p.image_url || null;
              return (
                <tr key={p.id}>
                  <td>
                    {thumbUrl
                      ? <img src={thumbUrl} alt={p.name} style={{ width: 52, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                      : <span style={{ fontSize: 28 }}>{p.emoji}</span>}
                    {p.images?.length > 1 && (
                      <span style={{ fontSize: 10, color: '#6ddc9a', display: 'block' }}>+{p.images.length - 1} more</span>
                    )}
                  </td>
                  <td className="adm-table__name">{p.name}</td>
                  <td>
                    <span className="adm-badge" style={{ background: cat?.bg || '#e8f8ee', color: cat?.color || '#1a6b3a' }}>
                      {p.category}
                    </span>
                  </td>
                  <td className="adm-table__price">{p.price}</td>
                  <td className="adm-table__muted">{p.origin}</td>
                  <td>
                    <div className="adm-action-btns">
                      <button className="adm-btn adm-btn--edit" onClick={() => openEdit(p)}>✏️ Edit</button>
                      <button className="adm-btn adm-btn--red"  onClick={() => askDelete(p.id)}>🗑️ Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && <div className="adm-empty">No products yet.</div>}
      </div>

      {/* ── MODAL ─────────────────────────────────── */}
      {modal !== null && (
        <div className="adm-modal-bg" onClick={() => setModal(null)}>
          <div className="adm-modal adm-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal__hdr">
              <span className="adm-modal__title">{modal === 'add' ? 'Add New Product' : 'Edit Product'}</span>
              <button className="adm-modal__close" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="adm-modal__body">

              {/* Images */}
              <div className="adm-images-section">
                <label className="adm-label">
                  Product Images <span className="adm-label-hint">(up to 4 — first is cover)</span>
                </label>
                {form.images.length > 0 && (
                  <div className="adm-img-preview-wrap">
                    <div className="adm-img-preview-main">
                      <img src={form.images[previewIdx]} alt="preview" />
                      <button className="adm-img-remove-btn" onClick={() => removeImage(previewIdx)}>×</button>
                    </div>
                    <div className="adm-img-thumbs">
                      {form.images.map((url, i) => (
                        <div key={i}
                          className={`adm-img-thumb ${i === previewIdx ? 'adm-img-thumb--active' : ''}`}
                          onClick={() => setPreviewIdx(i)}
                        >
                          <img src={url} alt={`img ${i + 1}`} />
                          {i === 0 && <span className="adm-img-cover-label">Cover</span>}
                          {i > 0 && (
                            <button className="adm-img-move adm-img-move--left"
                              onClick={(e) => { e.stopPropagation(); moveImage(i, i - 1); }}>‹</button>
                          )}
                          {i < form.images.length - 1 && (
                            <button className="adm-img-move adm-img-move--right"
                              onClick={(e) => { e.stopPropagation(); moveImage(i, i + 1); }}>›</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {form.images.length < 4 && (
                  <div className="adm-img-upload-row">
                    <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFiles} />
                    <button className="adm-btn adm-btn--upload" onClick={() => fileRef.current.click()} disabled={uploading}>
                      {uploading ? '⏳ Uploading…' : `📷 Add Images (${form.images.length}/4)`}
                    </button>
                    <span className="adm-label-hint">{4 - form.images.length} slot{4 - form.images.length !== 1 ? 's' : ''} remaining</span>
                  </div>
                )}
                {form.images.length === 4 && (
                  <p className="adm-label-hint" style={{ marginTop: 6 }}>✅ Max 4 images. Remove one to add another.</p>
                )}
              </div>

              {/* Emoji + Name */}
              <div className="adm-row">
                <div className="adm-field adm-field--small">
                  <label className="adm-label">Emoji</label>
                  <input className="adm-input adm-input--emoji" value={form.emoji} maxLength={4}
                    onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} />
                </div>
                <div className="adm-field">
                  <label className="adm-label">Product Name *</label>
                  <input className="adm-input" placeholder="e.g. Organic Rice" value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
              </div>

              {/* Price + Category */}
              <div className="adm-row">
                <div className="adm-field">
                  <label className="adm-label">Price *</label>
                  <input className="adm-input" placeholder="e.g. ₹80/kg" value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
                </div>
                <div className="adm-field">
                  <label className="adm-label">Category</label>
                  <select className="adm-input" value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                    {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Origin + Weight */}
              <div className="adm-row">
                <div className="adm-field">
                  <label className="adm-label">Origin</label>
                  <input className="adm-input" placeholder="e.g. Guntur, AP" value={form.origin}
                    onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))} />
                </div>
                <div className="adm-field">
                  <label className="adm-label">Weight / Pack Sizes</label>
                  <input className="adm-input" placeholder="e.g. 250g, 500g, 1kg" value={form.weight}
                    onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} />
                </div>
              </div>

              <div className="adm-field" style={{ marginBottom: 18 }}>
                <label className="adm-label">Description</label>
                <textarea className="adm-input adm-textarea" rows={3} placeholder="Product description…"
                  value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="adm-field" style={{ marginBottom: 28 }}>
                <label className="adm-label">Benefits (comma separated)</label>
                <input className="adm-input" placeholder="e.g. Chemical-free, Rich in nutrients"
                  value={form.benefits} onChange={(e) => setForm((f) => ({ ...f, benefits: e.target.value }))} />
              </div>

              <div className="adm-modal__actions">
                <button className="adm-btn adm-btn--cancel" onClick={() => setModal(null)}>Cancel</button>
                <button className="adm-btn adm-btn--green adm-btn--wide" onClick={save} disabled={saving}>
                  {saving ? '⏳ Saving…' : (modal === 'add' ? 'Add Product' : 'Save Changes')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
