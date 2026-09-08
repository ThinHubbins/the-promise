'use client';

import { useState } from 'react';

export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 'md',
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div
      className={`star-rating star-rating-${size}${readOnly ? ' readonly' : ''}`}
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          className={`star${n <= active ? ' filled' : ''}`}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readOnly && setHovered(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}