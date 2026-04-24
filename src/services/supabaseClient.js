// ─── SUPABASE CLIENT ────────────────────────────────────

const SUPABASE_URL     = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

class SupabaseClient {
  constructor(url, anonKey) {
    this.url     = url;
    this.anonKey = anonKey;
    this.ready   = !!(url && anonKey);
  }

  async request(method, path, body = null, extraHeaders = {}) {
    if (!this.ready) {
      console.warn('⚠️ Supabase not configured. Check environment variables REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
      return null;
    }

    const url = `${this.url}/rest/v1${path}`;
    
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'apikey':        this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`,
          'Content-Type':  'application/json',
          'Prefer':        'return=representation',
          ...extraHeaders,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (method === 'DELETE' || res.status === 204) return null;
      
      if (!res.ok) {
        const err = await res.text();
        console.error(`❌ Supabase ${method} ${path}:`, res.status, err);
        throw new Error(`Supabase ${method} ${path}: ${res.status} — ${err}`);
      }
      
      return res.json();
    } catch (err) {
      console.error('❌ Request failed:', err);
      throw err;
    }
  }

  // ── Products ─────────────────────────────────────────
  getProducts()           { return this.request('GET', '/products?order=id.asc'); }
  addProduct(p)           { return this.request('POST',  '/products', p); }
  updateProduct(id, p)    { return this.request('PATCH', `/products?id=eq.${id}`, p); }
  deleteProduct(id)       { return this.request('DELETE',`/products?id=eq.${id}`); }

  // ── Categories ───────────────────────────────────────
  getCategories()         { return this.request('GET', '/categories?order=id.asc'); }
  addCategory(c)          { return this.request('POST',  '/categories', c); }
  updateCategory(id, c)   { return this.request('PATCH', `/categories?id=eq.${id}`, c); }
  deleteCategory(id)      { return this.request('DELETE',`/categories?id=eq.${id}`); }

  // ── Ads ──────────────────────────────────────────────
  getAds()                { return this.request('GET', '/ads?order=id.asc'); }
  addAd(a)                { return this.request('POST',  '/ads', a); }
  updateAd(id, a)         { return this.request('PATCH', `/ads?id=eq.${id}`, a); }
  deleteAd(id)            { return this.request('DELETE',`/ads?id=eq.${id}`); }

  // ── Storage upload ───────────────────────────────────
  async uploadFile(bucket, fileName, file) {
    if (!this.ready) return URL.createObjectURL(file); // local fallback
    const res = await fetch(
      `${this.url}/storage/v1/object/${bucket}/${fileName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.anonKey}`,
          'Content-Type':  file.type,
          'x-upsert':      'true',
        },
        body: file,
      }
    );
    if (!res.ok) throw new Error(`Storage upload failed: ${res.statusText}`);
    return `${this.url}/storage/v1/object/public/${bucket}/${fileName}`;
  }
}

export const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export { SupabaseClient };