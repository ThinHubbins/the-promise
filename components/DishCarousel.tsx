"use client";

import { useState } from "react";

export default function DishCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;

  function prev() {
    setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }
  function next() {
    setIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }

  return (
    <div className="dish-carousel">
      <div className="dish-carousel-viewport">
        <img src={images[index]} alt={`${alt} photo ${index + 1}`} className="dish-carousel-img" />
        {images.length > 1 && (
          <>
            <button type="button" className="dish-carousel-nav dish-carousel-nav-prev" onClick={prev} aria-label="Previous photo">
              ‹
            </button>
            <button type="button" className="dish-carousel-nav dish-carousel-nav-next" onClick={next} aria-label="Next photo">
              ›
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="dish-carousel-dots">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`dish-carousel-dot${i === index ? " active" : ""}`}
              onClick={() => setIndex(i)}
              aria-label={`Go to photo ${i + 1}`}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .dish-carousel {
          width: 100%;
        }
        .dish-carousel-viewport {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          border-radius: 12px;
          overflow: hidden;
          background: #f3f4f6;
        }
        .dish-carousel-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .dish-carousel-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(0, 0, 0, 0.45);
          color: #fff;
          font-size: 1.4rem;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dish-carousel-nav-prev { left: 10px; }
        .dish-carousel-nav-next { right: 10px; }
        .dish-carousel-dots {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-top: 10px;
        }
        .dish-carousel-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          background: #d1d5db;
          cursor: pointer;
          padding: 0;
        }
        .dish-carousel-dot.active {
          background: var(--red, #c0392b);
        }
      `}</style>
    </div>
  );
}