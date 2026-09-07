'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Header() {
  const { user, loading } = useAuth();
  const { count } = useCart();
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function closeNav() {
    setNavOpen(false);
  }

  return (
    <header id="siteHeader" className={scrolled ? 'scrolled' : ''}>
      <div className="wrap nav-row">
        <Link href="/" className="brand" onClick={closeNav}>
          <span className="brand-mark">P</span>
          <span>
            THE PROMISE
            <small>NIGERIAN FAST FOOD &amp; CATERING</small>
          </span>
        </Link>

        <nav className={`primary-nav${navOpen ? ' open' : ''}`}>
          <Link href="/" onClick={closeNav}>Home</Link>
          <Link href="/#menu" onClick={closeNav}>Menu</Link>
          <Link href="/#categories" onClick={closeNav}>Categories</Link>
          <Link href="/#catering" onClick={closeNav}>Catering</Link>
          {user && (
            <Link href="/dashboard?tab=track" onClick={closeNav}>Track Order</Link>
          )}
          <Link href="/#footer-contact" onClick={closeNav}>Contact</Link>
        </nav>

        <div className="nav-actions">
          <span className="nav-phone">
            <svg className="icon" viewBox="0 0 24 24">
              <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.5 21 3 13.5 3 4.7 3 4.1 3.4 3.7 4 3.7h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8Z" />
            </svg>
            +234 812 912 5100
          </span>

          {!loading && user ? (
            <Link href="/dashboard" className="cart-btn" aria-label="Open your order" onClick={closeNav}>
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M4 6h2l1.6 9.6a2 2 0 0 0 2 1.7h7.3a2 2 0 0 0 2-1.6L20 8H7" />
                <circle cx="10" cy="20" r="1.3" />
                <circle cx="17" cy="20" r="1.3" />
              </svg>
              Your Order
              <span className="cart-count">{count}</span>
            </Link>
          ) : (
            <Link href="/login" className="cart-btn" aria-label="Log in to place an order" onClick={closeNav}>
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
              </svg>
              Login
            </Link>
          )}

          <button
            className="menu-toggle"
            onClick={() => setNavOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-expanded={navOpen}
          >
            <svg className="icon" viewBox="0 0 24 24">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
