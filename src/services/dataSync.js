// ─── SUPABASE DATA SYNC ─────────────────────────────────

import { supabase } from './supabaseClient';

// ── Helpers: sanitise records before sending to Supabase ─
// Arrays (images[], benefits[]) must be sent as JSON strings
// because the REST API treats plain arrays as PostgreSQL arrays
// which requires a different format. Storing as JSONB text is safer.

function prepareProduct(p) {
  const { id, ...rest } = p;           // strip local id — Supabase auto-increments
  return {
    ...rest,
    // ✅ FIX 2: serialise arrays to JSON strings so Supabase stores them correctly
    benefits:  JSON.stringify(Array.isArray(p.benefits) ? p.benefits : []),
    images:    JSON.stringify(Array.isArray(p.images)   ? p.images   : []),
    image_url: Array.isArray(p.images) && p.images.length ? p.images[0] : (p.image_url || ''),
  };
}

function prepareCategory(c) {
  const { id, ...rest } = c;
  return rest;
}

function prepareAd(a) {
  const { id, ...rest } = a;
  return rest;
}

// ── Parse a row coming back FROM Supabase ────────────────
function parseProduct(row) {
  return {
    ...row,
    benefits: parseJsonField(row.benefits, []),
    images:   parseJsonField(row.images,   []),
  };
}

function parseJsonField(value, fallback) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return fallback;
}

// ──────────────────────────────────────────────────────────
// LOAD — called once on app startup
// ──────────────────────────────────────────────────────────
export async function loadDataFromSupabase(initialData) {
  if (!supabase.ready) {
    console.log('ℹ️ Supabase not configured — using local data.');
    return initialData;
  }

  try {
    console.log('📡 Loading data from Supabase…');
    const [rawProducts, categories, ads] = await Promise.all([
      supabase.getProducts().catch(() => []),
      supabase.getCategories().catch(() => []),
      supabase.getAds().catch(() => []),
    ]);

    const products = (rawProducts || []).map(parseProduct);

    return {
      products:   products.length   ? products   : initialData.products,
      categories: categories?.length ? categories : initialData.categories,
      ads:        ads?.length        ? ads        : initialData.ads,
    };
  } catch (err) {
    console.error('⚠️ Failed to load from Supabase:', err.message);
    return initialData;
  }
}

// ──────────────────────────────────────────────────────────
// PRODUCTS
// ──────────────────────────────────────────────────────────
export async function syncProductToSupabase(product, action = 'add') {
  if (!supabase.ready) return product;

  if (action === 'add') {
    // ✅ FIX 3: use the ID returned by Supabase, not a local nextId()
    const rows   = await supabase.addProduct(prepareProduct(product));
    const saved  = rows?.[0];
    if (!saved) throw new Error('Supabase did not return the saved product');
    return parseProduct(saved);            // ← has the real Supabase ID
  }

  if (action === 'update') {
    await supabase.updateProduct(product.id, prepareProduct(product));
    return product;
  }

  if (action === 'delete') {
    await supabase.deleteProduct(product.id);
    return null;
  }
}

// ──────────────────────────────────────────────────────────
// CATEGORIES
// ──────────────────────────────────────────────────────────
export async function syncCategoryToSupabase(category, action = 'add') {
  if (!supabase.ready) return category;

  if (action === 'add') {
    const rows  = await supabase.addCategory(prepareCategory(category));
    return rows?.[0] || category;
  }
  if (action === 'update') {
    await supabase.updateCategory(category.id, prepareCategory(category));
    return category;
  }
  if (action === 'delete') {
    await supabase.deleteCategory(category.id);
    return null;
  }
}

// ──────────────────────────────────────────────────────────
// ADS
// ──────────────────────────────────────────────────────────
export async function syncAdToSupabase(ad, action = 'add') {
  if (!supabase.ready) return ad;

  if (action === 'add') {
    const rows = await supabase.addAd(prepareAd(ad));
    return rows?.[0] || ad;
  }
  if (action === 'update') {
    await supabase.updateAd(ad.id, prepareAd(ad));
    return ad;
  }
  if (action === 'delete') {
    await supabase.deleteAd(ad.id);
    return null;
  }
}