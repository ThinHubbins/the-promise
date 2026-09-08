// lib/dishCategories.ts
import type { Category } from './types';

export const categories: Category[] = [
  { key: 'Rice & Sides', label: 'Rice & Sides', icon: 'rice', desc: 'Basmati, jollof, fried, native and more, plus pasta sides.' },
  { key: 'Soups & Swallow', label: 'Soups & Swallow', icon: 'soup', desc: 'Egusi, afang, ogbono and other soups with eba, amala, semo, fufu or poundo yam.' },
  { key: 'Burgers', label: 'Burgers', icon: 'burger', desc: 'Chicken, beef and ham burgers.' },
  { key: 'Shawarma', label: 'Shawarma', icon: 'shawarma', desc: 'Chicken and beef shawarma wraps.' },
  { key: 'Snacks', label: 'Snacks & Pastries', icon: 'snack', desc: 'Meat pies, scotch eggs and more.' },
  { key: 'Drinks', label: 'Drinks & Sweets', icon: 'drink', desc: 'Zobo, yoghurt, ice cream and chilled water.' },
];

export const FILTERS = ['All', ...categories.map((c) => c.key)] as const;
export type Filter = (typeof FILTERS)[number];