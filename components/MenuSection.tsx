"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DishIcon from "./DishIcon";
import { fetchDishes } from "../lib/dishes";
import { categories, FILTERS, type Filter } from "../lib/dishCategories";
import type { Dish } from "../lib/types";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function formatNaira(n: number): string {
  return "\u20A6" + n.toLocaleString("en-NG");
}

export default function MenuSection() {
  const [filter, setFilter] = useState<Filter>("All");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loadingDishes, setLoadingDishes] = useState(true);
  const { addToCart } = useCart();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        setDishes(await fetchDishes());
      } catch (err) {
        console.error("Failed to load menu", err);
      } finally {
        setLoadingDishes(false);
      }
    })();
  }, []);

  function goToFilter(key: Filter) {
    setFilter(key);
    document.getElementById("menu")?.scrollIntoView({
      behavior: "smooth",
    });
  }

  function handleAdd(dishId: string) {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    addToCart(dishId);
  }

  function goToDish(dishId: string) {
    router.push(`/dish/${dishId}`);
  }

  const visibleDishes = dishes.filter(
    (d) => filter === "All" || d.cat === filter,
  );

  return (
    <>
      {/* Categories section */}
      <section id="categories">{/* ...unchanged... */}</section>

      {/* Menu */}
      <section id="menu">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="section-tag">Popular right now</span>

              <h2>Dishes customers reorder the most</h2>

              <p>
                A short list from the full menu — add what you want, then log in
                to check out.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="filter-row">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`chip cursor-pointer${
                  filter === f ? " active" : ""
                }`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Dish Grid */}
          {loadingDishes ? (
            <div className="reviews-loading">
              <span className="reviews-spinner" />
              Loading menu…
            </div>
          ) : visibleDishes.length === 0 ? (
            <p className="reviews-empty">No dishes in this category yet.</p>
          ) : (
            <div className="dish-grid">
              {visibleDishes.map((d) => (
                <div
                  className="dish-card cursor-pointer"
                  key={d.id}
                  onClick={() => goToDish(d.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      goToDish(d.id);
                    }
                  }}
                >
                  {/* Dish Image / Icon */}
                  <div className={`dish-media tone-${d.tone}`}>
                    {d.tag && <span className="dish-tag">{d.tag}</span>}

                    {d.images && d.images.length > 0 ? (
                      <img
                        src={d.images[0]}
                        alt={d.name}
                        className="dish-media-img"
                      />
                    ) : (
                      <DishIcon type={d.icon} />
                    )}
                  </div>

                  {/* Dish Details */}
                  <div className="dish-body cursor-pointer">
                    <span className="dish-cat">{d.cat}</span>

                    <h3>{d.name}</h3>

                    <p className="desc">{d.desc}</p>

                    <div className="dish-foot">
                      <span className="dish-price">{formatNaira(d.price)}</span>

                      <button
                        type="button"
                        className="add-btn cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdd(d.id);
                        }}
                      >
                        <svg
                          className="icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
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
          )}
        </div>
      </section>
    </>
  );
}