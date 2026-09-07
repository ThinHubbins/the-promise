import Link from 'next/link';

export default function Hero() {
  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div>
          <span className="badge">
            <span className="dot"></span>Serving Rivers, Lagos &amp; Bayelsa since 2002
          </span>
          <h1>Nigerian food made the same way, every outlet, every time.</h1>
          <p className="hero-sub">
            The Promise has run kitchens across the South-South, South East and South West since 2002 —
            same house recipes, same standards, from jollof rice and shawarma to full-scale event catering.
          </p>
          <div className="hero-actions">
            <Link href="/#menu" className="btn btn-primary">
              <svg className="icon" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                <path d="M4 6h2l1.6 9.6a2 2 0 0 0 2 1.7h7.3a2 2 0 0 0 2-1.6L20 8H7" />
              </svg>
              Order Now
            </Link>
            <Link href="/#categories" className="btn btn-outline">Browse the menu</Link>
          </div>
          <div className="hero-stats">
            <div><strong>2002</strong><span>Year founded</span></div>
            <div><strong>28+</strong><span>Outlets running</span></div>
            <div><strong>3</strong><span>States served</span></div>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="ring-yellow"></div>
          <div className="ring-red"></div>
          <div className="plate">
            <svg viewBox="0 0 64 64">
              <circle cx="32" cy="40" r="16" fill="#C31730" stroke="none" />
              <circle cx="24" cy="34" r="2.2" fill="#F6B912" stroke="none" />
              <circle cx="34" cy="30" r="2.2" fill="#F6B912" stroke="none" />
              <circle cx="40" cy="40" r="2.2" fill="#F6B912" stroke="none" />
              <circle cx="28" cy="44" r="2.2" fill="#F6B912" stroke="none" />
              <path d="M20 22c3-6 21-6 24 0" stroke="#241712" strokeWidth={2} fill="none" />
              <path d="M22 18c1-3 3-5 4-5M32 16c0-3 0-5 0-6M42 18c-1-3-3-5-4-5" stroke="#241712" strokeWidth={1.6} fill="none" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
