# 🔧 Supabase Integration Setup Guide

## Problem Detected

Your admin dashboard was **not persisting products to Supabase** or the website. The products were only stored in React state (memory), so they would disappear on page refresh.

## What Was Fixed

✅ Created Supabase client and sync services  
✅ Updated admin dashboard to save products to Supabase  
✅ Updated app to load products from Supabase on startup  
✅ Added proper error handling with fallback to local storage  

## Required Setup

### 1️⃣ Get Supabase Credentials

1. Go to your Supabase project: https://supabase.com
2. Click **Settings** → **API**
3. Copy:
   - **Project URL** (e.g., `https://xyzabc.supabase.co`)
   - **Anon Public Key** (the public key, NOT the service role key)

### 2️⃣ Create `.env.local` File

Create a new file in your project root:

```
c:\Users\palle\Downloads\diava-project\.env.local
```

Add these lines:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_public_key_here
```

### 3️⃣ Create Supabase Database Tables

Go to your **Supabase SQL Editor** and run these queries:

#### Products Table

```sql
CREATE TABLE products (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT,
  price TEXT,
  category TEXT,
  description TEXT,
  weight TEXT,
  origin TEXT,
  benefits TEXT[],
  images TEXT[],
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
```

#### Categories Table

```sql
CREATE TABLE categories (
  name TEXT PRIMARY KEY,
  icon TEXT,
  color TEXT,
  bg TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Ads Table

```sql
CREATE TABLE ads (
  id INT PRIMARY KEY,
  image TEXT,
  title TEXT NOT NULL,
  desc TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4️⃣ Configure Row Level Security (RLS)

Go to **Supabase Dashboard** → **Authentication** → **Policies**

For each table, add this policy:

```sql
CREATE POLICY "Allow public read access"
  ON [table_name]
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated write access"
  ON [table_name]
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update"
  ON [table_name]
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete"
  ON [table_name]
  FOR DELETE
  USING (auth.role() = 'authenticated');
```

Or, for testing purposes, disable RLS:
1. Go to **Authentication** → **Policies**
2. Disable RLS for each table
3. ⚠️ **Important**: Re-enable RLS in production!

### 5️⃣ Upload Storage Bucket for Product Images

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket named: `product-images`
3. Make it **public** (Allow public reads)
4. Add upload policy for anon users:

```sql
CREATE POLICY "Allow public uploads"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'product-images');
```

### 6️⃣ Restart Your App

```bash
npm start
```

Watch the browser console for messages:
- ✅ `📡 Loading data from Supabase...` - Data loaded successfully
- ℹ️ `ℹ️ Supabase not configured. Using local data.` - Credentials missing
- ⚠️ `⚠️ Failed to load from Supabase:` - Connection error

## Testing

1. Go to admin dashboard: `http://localhost:3000/#/admin`
2. Add a product
3. You should see in browser console: `✓ Product saved to Supabase: {...}`
4. Refresh the page - product should still appear
5. Check Supabase dashboard **SQL Editor** → Run:
   ```sql
   SELECT * FROM products;
   ```
   Your product should be there!

## Troubleshooting

### Products not saving to Supabase?

**Check browser console for error messages:**

```javascript
// Open DevTools: F12
// Look for errors in Console tab
```

**Common issues:**

| Error | Solution |
|-------|----------|
| `REACT_APP_SUPABASE_URL is empty` | Add credentials to `.env.local` and restart app |
| `401 Unauthorized` | Check your Anon Key is correct |
| `403 Forbidden` | Enable RLS policies or disable RLS for testing |
| `CORS error` | Check Supabase project settings |

### If Supabase isn't configured:

Products will save **locally in React state** and display normally, but will:
- ❌ Disappear on page refresh
- ❌ Not sync across devices
- ❌ Be lost if browser is closed

**Add Supabase configuration to fix this.**

## Files Modified/Created

```
src/
  services/
    ├── supabaseClient.js    (NEW) - Supabase REST API client
    └── dataSync.js          (NEW) - Data sync utilities
  admin/
    ├── AdminProducts.jsx    (UPDATED) - Sync products to Supabase
    ├── AdminCategories.jsx  (UPDATED) - Sync categories to Supabase
    └── AdminAds.jsx         (UPDATED) - Sync ads to Supabase
  App.js                      (UPDATED) - Load data from Supabase on startup

.env.local.example            (NEW) - Template for environment variables
```

## Next Steps

1. ✅ Set up Supabase account & project
2. ✅ Get credentials
3. ✅ Create `.env.local` with credentials
4. ✅ Create database tables
5. ✅ Configure RLS or disable for testing
6. ✅ Restart app and test
7. ✅ Check browser console for confirmation

**Questions?** Check Supabase documentation: https://supabase.com/docs
