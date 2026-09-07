import type { IconType } from '../lib/types';

interface DishIconProps {
  type: IconType;
  className?: string;
}

export default function DishIcon({ type, className = '' }: DishIconProps) {
  const props = { viewBox: '0 0 24 24', className };

  switch (type) {
    case 'rice':
      return (
        <svg {...props}>
          <path d="M4 12h16a8 8 0 0 1-8 8 8 8 0 0 1-8-8Z" />
          <path d="M9 12c0-3 1.3-5 3-6.5C13.7 7 15 9 15 12" />
        </svg>
      );
    case 'burger':
      return (
        <svg {...props}>
          <path d="M4 10h16M4 14h16" />
          <path d="M5 10a7 4 0 0 1 14 0M5 14a1 2 0 0 0 14 0" />
        </svg>
      );
    case 'shawarma':
      return (
        <svg {...props}>
          <path d="M6 6l13 5-4 3 2 7-13-5 4-3-2-7Z" />
        </svg>
      );
    case 'soup':
      return (
        <svg {...props}>
          <path d="M4 11h16v3a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6v-3Z" />
          <path d="M9 11c-.5-2 .5-3 0-5M15 11c.5-2-.5-3 0-5" />
          <path d="M2 20h20" />
        </svg>
      );
    case 'snack':
      return (
        <svg {...props}>
          <path d="M12 3c4 3 6 6 6 9a6 6 0 0 1-12 0c0-3 2-6 6-9Z" />
        </svg>
      );
    case 'drink':
      return (
        <svg {...props}>
          <path d="M8 3h8l-1 5H9L8 3Z" />
          <path d="M9 8h6l-.6 10a2 2 0 0 1-2 1.9h-.8A2 2 0 0 1 9.6 18L9 8Z" />
        </svg>
      );
    default:
      return null;
  }
}
