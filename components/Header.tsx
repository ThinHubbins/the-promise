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
      <div className="wrap nav-row">
        <Link href="/" className="brand" onClick={closeNav}>
          <span className="brand-mark">
            <Image src={logo} alt="The Promise logo" width={40} height={40} priority />
          </span>
          <span>
            THE PROMISE
            <small>NIGERIAN FAST FOOD &amp; CATERING</small>
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
              <Link href="/dashboard" className="cart-btn" aria-label="Open your order" onClick={closeNav}>
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M4 6h2l1.6 9.6a2 2 0 0 0 2 1.7h7.3a2 2 0 0 0 2-1.6L20 8H7" />
                  <circle cx="10" cy="20" r="1.3" />
                  <circle cx="17" cy="20" r="1.3" />
                </svg>
                <span className="cart-btn-label">Your Order</span>
                <span className="cart-count">{count}</span>
              </Link>
            ) : (
              <Link href="/login" className="cart-btn" aria-label="Log in to place an order" onClick={closeNav}>
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
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
        }

        .nav-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 10px 0;
        }

        .brand-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          overflow: hidden;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
        }

        .brand-mark :global(img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .primary-nav {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .primary-nav :global(a) {
          padding: 8px 12px;
          border-radius: 8px;
          font-weight: 500;
          color: inherit;
          text-decoration: none;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .primary-nav :global(a:hover) {
          background: rgba(0, 0, 0, 0.04);
        }

        .primary-nav :global(a.active) {
          color: var(--red, #c0392b);
          background: rgba(192, 57, 43, 0.08);
        }

        .mobile-nav-phone {
          display: none;
        }

        .nav-backdrop {
          display: none;
        }

        .cart-btn-label {
          display: inline;
        }

        .cart-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .cart-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 999px;
          background: var(--red, #c0392b);
          color: #fff;
          font-size: 0.7rem;
          font-weight: 700;
        }

        .menu-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 8px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: #fff;
        }

        .menu-toggle:hover {
          background: rgba(0, 0, 0, 0.04);
        }

        @media (max-width: 860px) {
          .nav-row {
            gap: 12px;
          }

          .brand small {
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
            top: var(--header-height, 64px);
            background: rgba(0, 0, 0, 0.4);
            border: none;
            z-index: 40;
            padding: 0;
            margin: 0;
          }

          .primary-nav {
            position: fixed;
            top: var(--header-height, 64px);
            left: 0;
            right: 0;
            z-index: 50;
            background: #fff;
            flex-direction: column;
            align-items: stretch;
            gap: 0;
            padding: 8px 0;
            max-height: calc(100vh - var(--header-height, 64px));
            overflow-y: auto;
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
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
            padding: 14px 20px;
            border-radius: 0;
            border-bottom: 1px solid rgba(0, 0, 0, 0.06);
            width: 100%;
          }

          .primary-nav :global(a.active) {
            background: rgba(192, 57, 43, 0.06);
          }

          .mobile-nav-phone {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--red);
            font-weight: 600;
          }
        }
      `}</style>
    </header>
  );
}