"use client"
import Link from 'next/link';
import Image from 'next/image';
import logo from '../public/logo.jpg';

export default function Footer() {
  return (
    <footer id="visit">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Link href="/" className="brand">
            <span className="brand-mark">
              <Image src={logo} alt="The Promise logo" width={40} height={40} />
            </span>
            <span>THE PROMISE</span>
          </Link>
          <p>Nigerian fast food and catering group, running kitchens across Rivers, Lagos and Bayelsa States since 2000.</p>
          <div className="social-row">
            <a href="#" aria-label="Facebook">
              <svg className="icon" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                <path d="M14 9h3V6h-3a4 4 0 0 0-4 4v2H8v3h2v6h3v-6h3l1-3h-4v-2a1 1 0 0 1 1-1Z" />
              </svg>
            </a>
            <a href="#" aria-label="Instagram">
              <svg className="icon" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                <rect x="4" y="4" width="16" height="16" rx="4" />
                <circle cx="12" cy="12" r="3.4" />
                <circle cx="16.6" cy="7.4" r="0.6" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a href="#" aria-label="X / Twitter">
              <svg className="icon" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </svg>
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Explore</h4>
          <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/#menu">Menu</Link></li>
            <li><Link href="/feedbacks">Feedbacks</Link></li>
            <li><Link href="/stores">Stores</Link></li>
          </ul>
        </div>

        <div className="footer-col" id="footer-contact">
          <h4>Visit us</h4>
          <div className="footer-contact-item">
            <svg className="icon" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
              <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" />
              <circle cx="12" cy="9.5" r="2.3" />
            </svg>
            <span>18 Trans Amadi Road, Rumuobiokani, Port Harcourt, Rivers State</span>
          </div>
          <div className="footer-contact-item">
            <svg className="icon" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
              <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.5 21 3 13.5 3 4.7 3 4.1 3.4 3.7 4 3.7h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8Z" />
            </svg>
            <span>+234 803 722 9044 &middot; +234 812 912 5100</span>
          </div>
          <div className="footer-contact-item">
            <svg className="icon" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3.5 2" />
            </svg>
            <span>Open daily, 8:00 AM &ndash; 9:00 PM</span>
          </div>
        </div>

        <div className="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="/careers">Careers</a></li>
            <li><a href="/stores">Outlet locations</a></li>
          </ul>
        </div>
      </div>

     <div className="wrap footer-bottom">
  <span>&copy; {new Date().getFullYear()} The Promise Nigeria. All rights reserved.</span>
  <span>
    Website built by{' '}
    <a
      href="https://kreytmawr.web.app/"
      target="_blank"
      rel="noopener noreferrer"
      className="!text-white"
    >
      Kreyt Mawr
    </a>
  </span>
</div>

      <style jsx>{`
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

        .footer-contact-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .footer-contact-item :global(.icon) {
          flex-shrink: 0;
          margin-top: 2px;
        }

        @media (max-width: 860px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 32px;
            text-align: left;
            padding-top: 40px;
            padding-bottom: 32px;
          }

          .footer-brand {
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .footer-brand p {
            max-width: 46ch;
          }

          .footer-col h4 {
            margin-bottom: 12px;
          }

          .footer-col ul {
            display: grid;
            gap: 10px;
          }

          .social-row {
            margin-top: 16px;
          }

          .footer-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            text-align: left;
            padding-top: 20px;
            padding-bottom: 24px;
          }
        }
      `}</style>
    </footer>
  );
}