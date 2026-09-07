'use client';

import { useCart } from '../context/CartContext';

export default function Toast() {
  const { toastMsg } = useCart();

  return (
    <div className={`toast${toastMsg ? ' show' : ''}`}>
      <svg className="icon" viewBox="0 0 24 24">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      <span>{toastMsg}</span>
    </div>
  );
}
