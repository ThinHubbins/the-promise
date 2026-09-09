export default function AboutSection() {
  return (
    <section className="about-section" id="catering">
      <div className="wrap about-grid">
        <div>
          <span className="section-tag">Since 2000</span>
          <p className="lead">
            The Promise opened its first counter on Aggrey Road in Port Harcourt in July 2000. Today the
            same kitchen discipline runs across more than two dozen outlets in Rivers, Lagos and Bayelsa States.
          </p>
          <p className="body-text">
            Every outlet follows the same standardized recipes and kitchen procedures, so a plate of jollof
            rice tastes the same wherever you order it. Beyond the counter, The Promise also runs outdoor
            event catering, custom cakes, and industrial catering contracts for offshore sites and corporate
            offices — with over 15 years serving major oil and gas operators in Rivers, Lagos and Bayelsa.
          </p>
        </div>

        <div className="feature-list">
          <div className="feature-item">
            <div className="feature-icon">
              <svg className="icon" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                <path d="M8 3v3M16 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />
              </svg>
            </div>
            <div><h4>Founded 2000 in Port Harcourt</h4><p>Started on Aggrey Road, now trading in three states.</p></div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <svg className="icon" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div><h4>WHO &amp; NAFDAC hygiene standards</h4><p>Kitchens run to national food-safety guidelines, zero recorded incidents.</p></div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <svg className="icon" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                <path d="M3 16V6a1 1 0 0 1 1-1h9v11" />
                <path d="M13 9h4l3 3v4h-2" />
                <circle cx="7.5" cy="17.5" r="1.7" />
                <circle cx="16.5" cy="17.5" r="1.7" />
              </svg>
            </div>
            <div><h4>Dine-in, pickup &amp; delivery</h4><p>28+ outlets across Rivers, Lagos and Bayelsa States.</p></div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <svg className="icon" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                <path d="M4 21v-6a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v6" />
                <circle cx="12" cy="7" r="3.2" />
              </svg>
            </div>
            <div><h4>Events, catering &amp; cakes</h4><p>Outdoor catering, tailor-made cakes and industrial catering contracts.</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
