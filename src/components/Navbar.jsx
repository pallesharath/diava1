import React, { useState } from 'react';
import logo from '../assets/diava-logo.png';
import './Navbar.css';

// activePage  : current page string e.g. "Home"
// setActivePage : setter to navigate between pages
// setActiveCategory : reset category filter when navigating
const NAV_ITEMS = ['Home', 'About Us', 'Products', 'Contact'];

export default function Navbar({ activePage, setActivePage, setActiveCategory }) {
  const [menuOpen, setMenuOpen] = useState(false);

  function navigate(item) {
    setActivePage(item);
    setActiveCategory('All');
    setMenuOpen(false); // Close menu after navigation
  }

  return (
    <nav className="navbar">
      {/* Logo — click to go home */}
      <img
        src={logo}
        alt="Diava Logo"
        className="navbar__logo"
        onClick={() => navigate('Home')}
      />

      {/* Hamburger Menu Button (mobile only) */}
      <button
        className={`navbar__hamburger ${menuOpen ? 'navbar__hamburger--open' : ''}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Nav links */}
      <div className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item}
            className={`navbar__link ${activePage === item ? 'navbar__link--active' : ''}`}
            onClick={() => navigate(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </nav>
  );
}
