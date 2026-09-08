// components/OutletCard.tsx
import type { Outlet } from '../lib/outlets';
import { directionsUrl } from '../lib/outlets';

function PinIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24">
      <path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </svg>
  );
}

export default function OutletCard({ outlet }: { outlet: Outlet }) {
  return (
    <div className="cat-card">
      <div className="cat-icon">
        <PinIcon />
      </div>
      <h3>{outlet.name}</h3>
      <p>
        {outlet.address}
        <br />
        {outlet.city}, {outlet.state}
      </p>
      <a className="cat-link" href={directionsUrl(outlet)} target="_blank" rel="noopener noreferrer">
        Get Directions
        <svg className="icon" viewBox="0 0 24 24">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </a>
    </div>
  );
}