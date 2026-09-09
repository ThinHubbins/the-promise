import Link from 'next/link';

const CERTIFICATIONS = [
  {
    code: 'ISO 9001',
    title: 'Quality Management System',
    desc: 'Consistent food quality and service standards across every outlet.',
  },
  {
    code: 'ISO 14001',
    title: 'Environmental Management System',
    desc: 'Responsible resource use and environmental impact management.',
  },
  {
    code: 'ISO 45001',
    title: 'Occupational Health & Safety Management System',
    desc: 'Safe working conditions for our staff and kitchen teams.',
  },
  {
    code: 'ISO 22000',
    title: 'Food Safety Management System',
    desc: 'Rigorous food safety controls from sourcing to service.',
  },
];

export default function IsoCertifications() {
  return (
    <section id="certifications" className="about-section">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="section-tag">Certified &amp; Accredited</span>
            <h2>ISO Certifications</h2>
            <p>
              Integrated Catering Company Ltd operates to internationally recognized
              standards, independently certified and regularly audited.
            </p>
          </div>
          <Link
            href="https://verify.systemcertifications.com/integrated-catering-company-limited-ems/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            <svg className="icon" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
              <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            Verify Certification
          </Link>
        </div>

        <div className="iso-grid">
          {CERTIFICATIONS.map((cert) => (
            <div className="iso-card" key={cert.code}>
              <div className="iso-icon">
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M12 2l7 3.5v5.5c0 5-3.4 8.7-7 10-3.6-1.3-7-5-7-10V5.5L12 2z" />
                  <path d="M9 11.5l2 2 4-4.5" />
                </svg>
              </div>
              <span className="iso-code">{cert.code}</span>
              <h3>{cert.title}</h3>
              <p>{cert.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}