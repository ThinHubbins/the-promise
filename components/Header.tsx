'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import logo from '../public/logo.jpg';

export default function Header() {
  const { user, loading } = useAuth();
  const { count } = useCart();
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const isHrRoute = pathname?.startsWith('/hr');
  const isStaffRoute = pathname?.startsWith('/staff');
  const isBackofficeRoute = isAdminRoute || isHrRoute || isStaffRoute;
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = navOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [navOpen]);

  useEffect(() => {
    closeNav();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function closeNav() {
    setNavOpen(false);
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  }

  return (
    <header id="siteHeader" className={scrolled ? 'scrolled' : ''}>
      <div className="brand-stripe" aria-hidden="true" />

      <div className="wrap nav-row">
        <Link href="/" className="brand" onClick={closeNav}>
          <span className="brand-badge">
            <Image src={logo} alt="The Promise logo" width={46} height={46} priority />
          </span>
          <span className="brand-word">
            <span className="brand-name">The Promise</span>
            <span className="brand-tagline">Nigerian Fast Food &amp; Catering</span>
          </span>
        </Link>

        <nav className={`primary-nav${navOpen ? ' open' : ''}`}>
          <Link href="/" onClick={closeNav} className={isActive('/') ? 'active' : ''}>Home</Link>
          <Link href="/#menu" onClick={closeNav}>Menu</Link>
          <Link href="/feedbacks" onClick={closeNav} className={isActive('/feedbacks') ? 'active' : ''}>Feedbacks</Link>
          <Link href="/stores" onClick={closeNav} className={isActive('/stores') ? 'active' : ''}>Stores</Link>
          {user && !isBackofficeRoute && (
            <Link href="/dashboard" onClick={closeNav} className={isActive('/dashboard') ? 'active' : ''}>
              Dashboard
            </Link>
          )}

          <a href="tel:+2348129125100" className="mobile-nav-phone" onClick={closeNav}>
            <svg className="icon" viewBox="0 0 24 24">
              <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.5 21 3 13.5 3 4.7 3 4.1 3.4 3.7 4 3.7h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8Z" />
            </svg>
            +234 812 912 5100
          </a>
        </nav>

        {navOpen && <button className="nav-backdrop" aria-hidden="true" onClick={closeNav} />}

                <div className="nav-actions">
          <span className="nav-phone">
            <svg className="icon" viewBox="0 0 24 24">
              <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.5 21 3 13.5 3 4.7 3 4.1 3.4 3.7 4 3.7h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8Z" />
            </svg>
            +234 812 912 5100
          </span>

          {!isBackofficeRoute && (
            !loading && user ? (
              <Link href="/dashboard" className="cart-btn cart-btn-fill" aria-label="Open your order" onClick={closeNav}>
                <span className="cart-icon-wrap">
                  <svg className="icon" viewBox="0 0 24 24">
                    <path d="M4 6h2l1.6 9.6a2 2 0 0 0 2 1.7h7.3a2 2 0 0 0 2-1.6L20 8H7" />
                    <circle cx="10" cy="20" r="1.3" />
                    <circle cx="17" cy="20" r="1.3" />
                  </svg>
                  {count > 0 && <span className="cart-count">{count}</span>}
                </span>
                <span className="cart-btn-label">Your Order</span>
              </Link>
            ) : (
              <Link href="/login" className="cart-btn cart-btn-outline" aria-label="Log in to place an order" onClick={closeNav}>
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                </svg>
                <span className="cart-btn-label">Login</span>
              </Link>
            )
          )}

          <button
            className="menu-toggle"
            onClick={() => setNavOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-expanded={navOpen}
          >
            <svg className="icon" viewBox="0 0 24 24">
              {navOpen ? (
                <>
                  <line x1="5" y1="5" x2="19" y2="19" />
                  <line x1="19" y1="5" x2="5" y2="19" />
                </>
              ) : (
                <>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        header {
  position: sticky;
  top: 0;
  z-index: 60;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

header.scrolled {
  box-shadow: 0 4px 20px rgba(36, 23, 18, 0.08);
}

.brand-stripe {
  height: 4px;
  background: linear-gradient(90deg, #f6b912 0%, #c31730 55%, #7e0e1f 100%);
}

.wrap.nav-row {
  max-width: 1160px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
}

/* ---------- Brand / logo ---------- */

.brand {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.brand-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  border-radius: 14px;
  padding: 3px;
  background: linear-gradient(155deg, #c31730 0%, #7e0e1f 100%);
  box-shadow: 0 6px 16px rgba(126, 14, 31, 0.28);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.brand-badge::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 16px;
  border: 2px solid #f6b912;
  pointer-events: none;
}

.brand-badge :global(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 11px;
}

.brand:hover .brand-badge {
  transform: translateY(-1px);
  box-shadow: 0 9px 20px rgba(126, 14, 31, 0.34);
}

.brand-word {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-name {
  font-family: 'Archivo', sans-serif;
  font-weight: 800;
  font-size: 1.1rem;
  letter-spacing: -0.005em;
  color: #241712;
  line-height: 1;
}

.brand-tagline {
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6b5c54;
}

/* ---------- Primary nav ---------- */

.primary-nav {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
  justify-content: center;
}

.primary-nav :global(a) {
  position: relative;
  padding: 8px 4px;
  margin: 0 14px;
  font-weight: 600;
  font-size: 0.9rem;
  color: #241712;
  text-decoration: none;
  transition: color 0.15s ease;
  white-space: nowrap;
}

.primary-nav :global(a::after) {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -3px;
  height: 2px;
  border-radius: 2px;
  background: #f6b912;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.18s ease;
}

.primary-nav :global(a:hover) {
  color: #c31730;
}

.primary-nav :global(a:hover::after) {
  transform: scaleX(1);
}

.primary-nav :global(a.active) {
  color: #c31730;
}

.primary-nav :global(a.active::after) {
  transform: scaleX(1);
  background: #c31730;
}

.mobile-nav-phone {
  display: none;
}

.nav-backdrop {
  display: none;
}

/* ---------- Actions ---------- */

.nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.nav-phone {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.83rem;
  font-weight: 600;
  color: #241712;
  white-space: nowrap;
}

.nav-phone .icon {
  width: 15px;
  height: 15px;
  stroke: #c31730;
}

.cart-btn {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 8px 16px 8px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.86rem;
  border: 2px solid transparent;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
  text-decoration: none;
}

.cart-icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cart-icon-wrap .icon {
  width: 19px;
  height: 19px;
}

.cart-count {
  position: absolute;
  top: -7px;
  right: -8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: 999px;
  background: #f6b912;
  color: #241712;
  font-size: 0.62rem;
  font-weight: 800;
  border: 2px solid #fff;
}

.cart-btn-fill {
  background: #c31730;
  border-color: #c31730;
  color: #fff;
}

.cart-btn-fill:hover {
  background: #7e0e1f;
  border-color: #7e0e1f;
  transform: translateY(-1px);
}

.cart-btn-fill .cart-count {
  border-color: #fff;
}

.cart-btn-outline {
  background: transparent;
  border-color: #241712;
  color: #241712;
  padding: 8px 16px;
}

.cart-btn-outline:hover {
  border-color: #c31730;
  color: #c31730;
}

.menu-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
}

.menu-toggle:hover {
  border-color: #c31730;
}

@media (max-width: 860px) {
  .wrap.nav-row {
    padding: 10px 16px;
    gap: 12px;
  }

  .brand-tagline {
    display: none;
  }

  .nav-phone {
    display: none;
  }

  .cart-btn-label {
    display: none;
  }

  .cart-btn {
    padding: 8px 10px;
  }

  .cart-btn-outline {
    padding: 8px 10px;
  }

  .nav-actions {
    gap: 8px;
  }

  .menu-toggle {
    display: inline-flex;
  }

    .nav-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(36, 23, 18, 0.45);
    border: none;
    z-index: 40;
    padding: 0;
    margin: 0;
  }

  .primary-nav {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 50;
    background: #fff;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    padding: 8px 0;
    max-height: 75vh;
    overflow-y: auto;
    box-shadow: 0 14px 28px rgba(36, 23, 18, 0.14);
    transform: translateY(-8px);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.18s ease, opacity 0.18s ease;
  }

  .primary-nav.open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  .primary-nav :global(a) {
    margin: 0;
    padding: 14px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    width: 100%;
  }

  .primary-nav :global(a::after) {
    display: none;
  }

  .primary-nav :global(a.active) {
    background: rgba(195, 23, 48, 0.06);
  }

  .mobile-nav-phone {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 20px;
    font-weight: 700;
    font-size: 0.9rem;
    color: #c31730;
  }

  .mobile-nav-phone .icon {
    width: 16px;
    height: 16px;
    stroke: #c31730;
  }
}
      `}</style>
    </header>
  );
}