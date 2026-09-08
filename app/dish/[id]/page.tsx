'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { fetchDishById } from '../../../lib/dishes';
import type { Dish } from '../../../lib/types';
import DishCarousel from '../../../components/DishCarousel';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import ReviewsSection from '../../../components/ReviewSection';

function formatNaira(n: number): string {
  return '\u20A6' + n.toLocaleString('en-NG');
}

export default function DishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToCart } = useCart();
  const { user, loading: authLoading } = useAuth();

  const [dish, setDish] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setDish(await fetchDishById(id));
      } catch (err) {
        console.error('Failed to load dish', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function handleAdd() {
    if (!dish || authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    addToCart(dish.id);
  }

  if (loading) {
    return (
      <main>
        <div className="wrap dish-page-wrap">
          <p>Loading…</p>
        </div>
      </main>
    );
  }

  if (!dish) {
    return (
      <main>
        <div className="wrap dish-page-wrap">
          <p>We couldn&apos;t find that dish.</p>
          <button className="btn btn-outline" onClick={() => router.push('/')}>
            Back to menu
          </button>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="wrap dish-page-wrap">
        <button className="btn btn-outline btn-sm dish-back-btn" onClick={() => router.back()}>
          ← Back
        </button>

        <div className="dish-detail">
          {dish.images.length > 0 ? (
            <div className="dish-detail-media">
              {dish.tag && <span className="dish-tag">{dish.tag}</span>}
              <DishCarousel images={dish.images} alt={dish.name} />
            </div>
          ) : (
            <div className={`dish-media tone-${dish.tone} dish-detail-media`}>
              {dish.tag && <span className="dish-tag">{dish.tag}</span>}
            </div>
          )}

          <div className="dish-detail-body">
            <span className="dish-cat">{dish.cat}</span>
            <h1>{dish.name}</h1>
            <p className="desc">{dish.desc}</p>
            <p className="desc">{dish.fullDesc}</p>
            <div className="dish-detail-foot">
              <span className="dish-price">{formatNaira(dish.price)}</span>
              <button className="btn btn-primary" onClick={handleAdd}>
                Add to cart
              </button>
            </div>
          </div>
        </div>

        <ReviewsSection dishId={dish.id} />
      </div>
    </main>
  );
}