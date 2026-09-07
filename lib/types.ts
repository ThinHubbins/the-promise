export type IconType = 'rice' | 'burger' | 'shawarma' | 'soup' | 'snack' | 'drink';

export interface Dish {
  id: number;
  name: string;
  cat: string;
  desc: string;
  price: number;
  icon: IconType;
  tone: 'yellow' | 'red';
  tag?: string;
}

export interface Category {
  key: string;
  label: string;
  icon: IconType;
  desc: string;
}

export interface CartLine extends Dish {
  qty: number;
}

export interface User {
  email: string;
  name: string;
  phone: string;
}
