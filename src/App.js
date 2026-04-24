import React, { useState, useEffect } from 'react';

// Data
import { INIT_PRODUCTS }   from './data/products';
import { INIT_CATEGORIES, ALL_META } from './data/categories';
import { INIT_ADS }        from './data/ads';

// Services
import { loadDataFromSupabase } from './services/dataSync';

// Website pages & shared components
import Navbar        from './components/Navbar';
import Footer        from './components/Footer';
import ProductModal  from './components/ProductModal';
import HomePage      from './pages/HomePage';
import ProductsPage  from './pages/ProductsPage';
import AboutPage     from './pages/AboutPage';
import ContactPage   from './pages/ContactPage';

// Admin
import AdminLogin     from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';

// ─── APP ───────────────────────────────────────────────
export default function App() {
  // ── Shared live data ──────────────────────────────────
  const [products,   setProducts]   = useState(INIT_PRODUCTS);
  const [categories, setCategories] = useState(INIT_CATEGORIES);
  const [ads,        setAds]        = useState(INIT_ADS);
  const [dataLoaded, setDataLoaded] = useState(false);

  // ── Website navigation ────────────────────────────────
  const [activePage,     setActivePage]     = useState('Home');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // ── Admin routing (via URL hash) ──────────────────────
  const [route,         setRoute]         = useState(window.location.hash);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);

  // ── Load data from Supabase on app startup ───────────
  useEffect(() => {
    const initializeData = async () => {
      try {
        const data = await loadDataFromSupabase({
          products: INIT_PRODUCTS,
          categories: INIT_CATEGORIES,
          ads: INIT_ADS,
        });
        setProducts(data.products);
        setCategories(data.categories);
        setAds(data.ads);
      } finally {
        setDataLoaded(true);
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // ── Build categoryMeta lookup map ─────────────────────
  // { "All": {...}, "Grains": {...}, ... }
  const categoryMeta = { All: ALL_META };
  categories.forEach((c) => { categoryMeta[c.name] = c; });

  // ─────────────────────────────────────────────────────
  // ADMIN ROUTE  →  yoursite.com/#/admin
  // ─────────────────────────────────────────────────────
  if (route === '#/admin') {
    if (!adminLoggedIn) {
      return <AdminLogin onLogin={() => setAdminLoggedIn(true)} />;
    }
    return (
      <AdminDashboard
        products={products}     setProducts={setProducts}
        categories={categories} setCategories={setCategories}
        ads={ads}               setAds={setAds}
        onExit={() => {
          setAdminLoggedIn(false);
          window.location.hash = '';   // go back to homepage
        }}
      />
    );
  }

  // ─────────────────────────────────────────────────────
  // MAIN WEBSITE
  // ─────────────────────────────────────────────────────
  return (
    <div>
      {/* Sticky Navbar */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        setActiveCategory={setActiveCategory}
      />

      {/* Page content */}
      {activePage === 'Home' && (
        <HomePage
          products={products}
          ads={ads}
          categoryMeta={categoryMeta}
          setActivePage={setActivePage}
          setSelectedProduct={setSelectedProduct}
        />
      )}

      {activePage === 'Products' && (
        <ProductsPage
          products={products}
          categories={categories}
          categoryMeta={categoryMeta}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          setSelectedProduct={setSelectedProduct}
        />
      )}

      {activePage === 'About Us' && <AboutPage />}

      {activePage === 'Contact'  && <ContactPage />}

      {/* Product detail modal (shown on top of any page) */}
      <ProductModal
        product={selectedProduct}
        categoryMeta={categoryMeta}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
