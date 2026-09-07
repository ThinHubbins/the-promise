import Link from 'next/link';

export default function CtaBand() {
  return (
    <section className="cta-band">
      <div className="wrap cta-inner">
        <div>
          <h2>Ready to eat? Call ahead or start your order online.</h2>
          <p>Pickup and delivery available at outlets across Rivers, Lagos and Bayelsa States.</p>
        </div>
        <div className="cta-actions">
          <Link href="/#menu" className="btn btn-yellow">Start your order</Link>
          <a href="tel:+2348129125100" className="btn btn-outline">
            <svg className="icon" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
              <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.5 21 3 13.5 3 4.7 3 4.1 3.4 3.7 4 3.7h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8Z" />
            </svg>
            +234 812 912 5100
          </a>
        </div>
      </div>
    </section>
  );
}
