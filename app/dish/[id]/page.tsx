'use client';

import { useRouter } from 'next/navigation';
import { use } from 'react';
import { dishes } from '../../../lib/dishes';
import DishIcon from '../../../components/DishIcon';
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
  const { user, loading } = useAuth();

  const dish = dishes.find((d) => d.id === Number(id));

  function handleAdd() {
    if (!dish || loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    addToCart(dish.id);
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
          <div className={`dish-media tone-${dish.tone} dish-detail-media`}>
            {dish.tag && <span className="dish-tag">{dish.tag}</span>}
            <DishIcon type={dish.icon} />
          </div>

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