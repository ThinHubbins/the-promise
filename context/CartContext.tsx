'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { dishes } from '../lib/dishes';
import type { CartLine } from '../lib/types';

type CartMap = Record<number, number>; // dishId -> qty

interface CartContextValue {
  items: CartLine[];
  total: number;
  count: number;
  addToCart: (id: number) => void;
  changeQty: (id: number, delta: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  showToast: (msg: string) => void;
  toastMsg: string | null;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartMap>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg((current) => (current === msg ? null : current)), 2200);
  }, []);

  const addToCart = useCallback(
    (id: number) => {
      setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
      showToast('Added to your order');
    },
    [showToast]
  );

  const changeQty = useCallback((id: number, delta: number) => {
    setCart((prev) => {
      const next = { ...prev };
      const qty = (next[id] || 0) + delta;
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }, []);

  const removeItem = useCallback((id: number) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

  const items = useMemo<CartLine[]>(
    () =>
      Object.entries(cart).map(([id, qty]) => {
        const dish = dishes.find((d) => d.id === Number(id))!;
        return { ...dish, qty };
      }),
    [cart]
  );

  const total = useMemo(() => items.reduce((sum, it) => sum + it.qty * it.price, 0), [items]);
  const count = useMemo(() => items.reduce((sum, it) => sum + it.qty, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, total, count, addToCart, changeQty, removeItem, clearCart, showToast, toastMsg }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
