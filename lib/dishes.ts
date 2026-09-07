import type { Dish, Category } from './types';

export const dishes: Dish[] = [
  { id: 1, name: 'Jollof Rice & Chicken', cat: 'Rice & Combos', desc: 'Smoky party-style jollof rice with grilled chicken.', price: 2500, icon: 'rice', tone: 'yellow', tag: 'Bestseller' },
  { id: 2, name: 'Fried Rice & Turkey', cat: 'Rice & Combos', desc: 'Vegetable fried rice served with roast turkey.', price: 2800, icon: 'rice', tone: 'yellow' },
  { id: 3, name: 'Chicken Burger', cat: 'Burgers', desc: 'Grilled chicken patty, lettuce and house sauce.', price: 1800, icon: 'burger', tone: 'red' },
  { id: 4, name: 'Beef Burger', cat: 'Burgers', desc: 'Seasoned beef patty stacked with fresh toppings.', price: 1800, icon: 'burger', tone: 'red' },
  { id: 5, name: 'Beef Shawarma', cat: 'Shawarma', desc: 'Grilled beef strips wrapped with vegetables and sauce.', price: 2200, icon: 'shawarma', tone: 'yellow', tag: 'Popular' },
  { id: 6, name: 'Chicken Shawarma', cat: 'Shawarma', desc: 'Grilled chicken wrap with a spiced house sauce.', price: 2000, icon: 'shawarma', tone: 'yellow' },
  { id: 7, name: 'Egusi Soup & Poundo Yam', cat: 'Soups & Swallow', desc: 'Melon-seed soup with assorted meat and poundo yam.', price: 2300, icon: 'soup', tone: 'red' },
  { id: 8, name: 'Native Soup & Garri', cat: 'Soups & Swallow', desc: 'Vegetable native soup served with garri.', price: 2100, icon: 'soup', tone: 'red' },
  { id: 9, name: 'Meat Pie', cat: 'Snacks', desc: 'Flaky pastry filled with seasoned minced meat.', price: 500, icon: 'snack', tone: 'yellow' },
  { id: 10, name: 'Scotch Eggs', cat: 'Snacks', desc: 'Boiled egg wrapped in seasoned meat, deep fried.', price: 600, icon: 'snack', tone: 'yellow' },
  { id: 11, name: 'Zobo Drink', cat: 'Drinks', desc: 'Chilled hibiscus drink with a hint of ginger.', price: 500, icon: 'drink', tone: 'red' },
  { id: 12, name: 'Vanilla Ice Cream', cat: 'Drinks', desc: 'TP signature ice cream, served chilled.', price: 700, icon: 'drink', tone: 'red' },
];

export const categories: Category[] = [
  { key: 'Rice & Combos', label: 'Rice & Combos', icon: 'rice', desc: 'Jollof rice, fried rice and combo plates served with chicken, turkey or fish.' },
  { key: 'Burgers', label: 'Burgers', icon: 'burger', desc: 'Chicken, beef and ham burgers, grilled and stacked fresh to order.' },
  { key: 'Shawarma', label: 'Shawarma', icon: 'shawarma', desc: 'Chicken and beef shawarma wraps, grilled fresh with house sauce.' },
  { key: 'Soups & Swallow', label: 'Soups & Swallow', icon: 'soup', desc: 'Egusi, okazi, bitter leaf and native soups with garri, semo or poundo yam.' },
  { key: 'Snacks', label: 'Snacks & Pastries', icon: 'snack', desc: 'Meat pies, chicken pies, scotch eggs, doughnuts and moimoi, made daily.' },
  { key: 'Drinks', label: 'Drinks & Sweets', icon: 'drink', desc: 'Zobo, yoghurt, ice cream and chilled water to go with any order.' },
];

export const FILTERS = ['All', 'Rice & Combos', 'Burgers', 'Shawarma', 'Soups & Swallow', 'Snacks', 'Drinks'] as const;

export type Filter = (typeof FILTERS)[number];
