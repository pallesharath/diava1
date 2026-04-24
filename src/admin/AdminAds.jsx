import React, { useState, useRef } from 'react';
import { syncAdToSupabase } from '../services/dataSync';
import { supabase } from '../services/supabaseClient';
import './AdminShared.css';

const BUCKET = 'product-images';

async function uploadAdImage(file) {
  const ext      = file.name.split('.').pop();
  const fileName = `ad-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  // ✅ FIX: uploads to Supabase storage — permanent URL, survives refresh
  return supabase.uploadFile(BUCKET, fileName, file);
}

export default function AdminAds({ ads, setAds, showToast }) {
  const [modal,     setModal]     = useState(null);
  const [confirm,   setConfirm]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const fileRef = useRef();

  const empty = { image: '', title: '', desc: '' };
  const [form, setForm] = useState(empty);

  function openAdd()   { setForm(empty); setModal('add'); }
  function openEdit(a) { setForm({ ...a }); setModal(a); }

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAdImage(file);
      setForm((f) => ({ ...f, image: url }));
      showToast('Image uploaded ✓');
    } catch (err) {
      showToast(`Upload failed: ${err.message}`, false);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function save() {
    if (!form.title.trim()) { showToast('Ad title is required', false); return; }
    setSaving(true);
    try {
      if (modal === 'add') {
        const saved = await syncAdToSupabase(form, 'add');
        setAds((prev) => [...prev, saved]);
        showToast('Ad added ✓');
      } else {
        const updated = { ...form, id: modal.id };
        await syncAdToSupabase(updated, 'update');
        setAds((prev) => prev.map((a) => (a.id === modal.id ? updated : a)));
        showToast('Ad updated ✓');
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
      msg: 'Delete this ad? This cannot be undone.',
      onOk: async () => {
        try {
          await syncAdToSupabase({ id }, 'delete');
          setAds((prev) => prev.filter((a) => a.id !== id));
          showToast('Ad deleted');
        } catch (err) {
          showToast(`Delete failed: ${err.message}`, false);
        }
      },
    });
  }

  return (
    <div>
      <div className="adm-section-hdr">
        <h2 className="adm-section-title">Ad Banners Management</h2>
        <button className="adm-btn adm-btn--green" onClick={openAdd}>+ Add Ad</button>
      </div>

      <div className="adm-ads-list">
        {ads.map((a) => (
          <div key={a.id} className="adm-ad-card">
            <div className="adm-ad-card__icon">
              {a.image
                ? <img src={a.image} alt="ad" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} />
                : '📷'}
            </div>
            <div className="adm-ad-card__info">
              <div className="adm-ad-card__title">{a.title}</div>
              <div className="adm-ad-card__desc">{a.desc}</div>
            </div>
            <div className="adm-action-btns">
              <button className="adm-btn adm-btn--edit" onClick={() => openEdit(a)}>✏️ Edit</button>
              <button className="adm-btn adm-btn--red"  onClick={() => askDelete(a.id)}>🗑️ Delete</button>
            </div>
          </div>
        ))}
        {ads.length === 0 && <div className="adm-empty">No ads yet. Click "+ Add Ad" to create one.</div>}
      </div>

      {/* ── MODAL ──────────────────────────────── */}
      {modal !== null && (
        <div className="adm-modal-bg" onClick={() => setModal(null)}>
          <div className="adm-modal adm-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal__hdr">
              <span className="adm-modal__title">{modal === 'add' ? 'Add New Ad' : 'Edit Ad'}</span>
              <button className="adm-modal__close" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="adm-modal__body">

              {/* Image upload */}
              <div className="adm-field">
                <label className="adm-label">Ad Image</label>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
                <button className="adm-btn adm-btn--upload" style={{ marginBottom: 10 }}
                  onClick={() => fileRef.current.click()} disabled={uploading}>
                  {uploading ? '⏳ Uploading…' : '📷 Upload Image'}
                </button>
                {form.image && (
                  <img src={form.image} alt="preview"
                    style={{ display: 'block', width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />
                )}
              </div>

              <div className="adm-field">
                <label className="adm-label">Ad Title *</label>
                <input className="adm-input" placeholder="e.g. Free Delivery" value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>

              <div className="adm-field" style={{ marginBottom: 20 }}>
                <label className="adm-label">Description</label>
                <textarea className="adm-input adm-textarea" rows={3} placeholder="Ad description…"
                  value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} />
              </div>

              {/* Preview */}
              <div className="adm-ad-preview">
                <div className="adm-ad-preview__icon">
                  {form.image
                    ? <img src={form.image} alt="preview" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} />
                    : '📷'}
                </div>
                <div className="adm-ad-preview__divider" />
                <div className="adm-ad-preview__title">{form.title || 'Ad Title'}</div>
                <div className="adm-ad-preview__desc">{form.desc || 'Description appears here'}</div>
              </div>

              <div className="adm-modal__actions">
                <button className="adm-btn adm-btn--cancel" onClick={() => setModal(null)}>Cancel</button>
                <button className="adm-btn adm-btn--green adm-btn--wide" onClick={save} disabled={saving}>
                  {saving ? '⏳ Saving…' : (modal === 'add' ? 'Add Ad' : 'Save Changes')}
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
