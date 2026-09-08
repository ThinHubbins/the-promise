// context/CartContext.tsx
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { fetchDishes } from '../lib/dishes';
import type { CartLine, Dish } from '../lib/types';

type RawEntry = { id: string; qty: number };

type CartContextValue = {
  items: CartLine[];
  total: number;
  count: number;
  toastMsg: string;
  addToCart: (dishId: string, quantity?: number) => void;
  changeQty: (dishId: string, delta: number) => void;
  removeItem: (dishId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = 'promise_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<RawEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [dishMap, setDishMap] = useState<Map<string, Dish>>(new Map());

  // Load dish data once, for cart line lookups (name/price)
  useEffect(() => {
    (async () => {
      try {
        const all = await fetchDishes();
        setDishMap(new Map(all.map((d) => [d.id, d])));
      } catch (err) {
        console.error('Failed to load dishes for cart', err);
      }
    })();
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setRaw(JSON.parse(stored));
    } catch {
      // ignore malformed storage
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
  }, [raw, hydrated]);

  function showToast(msg: string) {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2200);
  }

  function addToCart(dishId: string, quantity = 1) {
    const dish = dishMap.get(dishId);
    setRaw((prev) => {
      const existing = prev.find((i) => i.id === dishId);
      if (existing) {
        return prev.map((i) => (i.id === dishId ? { ...i, qty: i.qty + quantity } : i));
      }
      return [...prev, { id: dishId, qty: quantity }];
    });
    if (dish) showToast(`${dish.name} added to your order`);
  }

  function changeQty(dishId: string, delta: number) {
    setRaw((prev) =>
      prev
        .map((i) => (i.id === dishId ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  }

  function removeItem(dishId: string) {
    setRaw((prev) => prev.filter((i) => i.id !== dishId));
  }

  function clearCart() {
    setRaw([]);
  }

  const items: CartLine[] = useMemo(() => {
    return raw
      .map((entry) => {
        const dish = dishMap.get(entry.id);
        if (!dish) return null;
        return { id: dish.id, name: dish.name, price: dish.price, qty: entry.qty };
      })
      .filter((line): line is CartLine => line !== null);
  }, [raw, dishMap]);

  const total = useMemo(() => items.reduce((sum, i) => sum + i.price * i.qty, 0), [items]);
  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, total, count, toastMsg, addToCart, changeQty, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}