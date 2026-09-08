// app/outlets/page.tsx
import type { Metadata } from 'next';
import OutletFinder from '../../components/OutletFinder';
import OutletCard from '../../components/OutletCard';
import { outlets } from '../../lib/outlets';

export const metadata: Metadata = {
  title: 'Our Outlets | The Promise Fast Food',
  description:
    'Find the nearest The Promise Fast Food outlet across Rivers, Lagos & Bayelsa and get directions in seconds.',
};

export default function OutletsPage() {
  return (
    <main>
      <section className="hero" style={{ paddingBottom: 40 }}>
        <div className="wrap">
          <span className="badge">
            <span className="dot"></span>
            5 outlets across Rivers State
          </span>
          <h1 style={{ maxWidth: '18ch' }}>Find the outlet closest to you.</h1>
          <p className="hero-sub">
            Same house recipes, same standards, every outlet — enter your address below and
            we&apos;ll point you to the nearest kitchen.
          </p>
        </div>
      </section>

      <section className="finder-section">
        <div className="wrap">
          <OutletFinder />
        </div>
      </section>

      <section className="outlets-list-section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="section-tag">Browse locations</span>
              <h2>All our outlets</h2>
              <p>Can&apos;t use location search? Here&apos;s every outlet we currently run.</p>
            </div>
          </div>
          <div className="cat-grid">
            {outlets.map((outlet) => (
              <OutletCard key={outlet.id} outlet={outlet} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}