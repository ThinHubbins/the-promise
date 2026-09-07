'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DishIcon from './DishIcon';
import { dishes, categories, FILTERS, type Filter } from '../lib/dishes';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

function formatNaira(n: number): string {
  return '\u20A6' + n.toLocaleString('en-NG');
}

export default function MenuSection() {
  const [filter, setFilter] = useState<Filter>('All');
  const { addToCart } = useCart();
  const { user, loading } = useAuth();
  const router = useRouter();

  function goToFilter(key: Filter) {
    setFilter(key);
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleAdd(dishId: number) {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    addToCart(dishId);
  }

  const visibleDishes = dishes.filter((d) => filter === 'All' || d.cat === filter);

  return (
    <>
      {/* Categories */}
      <section id="categories">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="section-tag">What we serve</span>
              <h2>Six ways to eat at The Promise</h2>
              <p>Every outlet runs the same core menu, built around the dishes Nigerians order the most.</p>
            </div>
          </div>

          <div className="cat-grid">
            {categories.map((cat) => (
              <div className="cat-card" key={cat.key}>
                <div className="cat-icon">
                  <DishIcon type={cat.icon} className="icon" />
                </div>
                <h3>{cat.label}</h3>
                <p>{cat.desc}</p>
                <button className="cat-link" onClick={() => goToFilter(cat.key as Filter)}>
                  See dishes
                  <svg className="icon" viewBox="0 0 24 24">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="13 6 19 12 13 18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Menu */}
      <section id="menu">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="section-tag">Popular right now</span>
              <h2>Dishes customers reorder the most</h2>
              <p>A short list from the full menu — add what you want, then log in to check out.</p>
            </div>
          </div>

          <div className="filter-row">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`chip${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="dish-grid">
            {visibleDishes.map((d) => (
              <div className="dish-card" key={d.id}>
                <div className={`dish-media tone-${d.tone}`}>
                  {d.tag && <span className="dish-tag">{d.tag}</span>}
                  <DishIcon type={d.icon} />
                </div>
                <div className="dish-body">
                  <span className="dish-cat">{d.cat}</span>
                  <h3>{d.name}</h3>
                  <p className="desc">{d.desc}</p>
                  <div className="dish-foot">
                    <span className="dish-price">{formatNaira(d.price)}</span>
                    <button className="add-btn" onClick={() => handleAdd(d.id)}>
                      <svg className="icon" viewBox="0 0 24 24">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="menu-more">
            <a
              href="#"
              className="btn btn-outline"
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              View full menu
            </a>
          </div>
        </div>
      </section>
    </>
  );
}