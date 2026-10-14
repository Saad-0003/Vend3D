"use client";

import { useEffect, useState } from "react";

import { StarRow } from "@/components/shared/star-row";
import { reviews, type Review } from "@/data/reviews";

import styles from "./reviews-wall.module.css";

type ReviewLayout = "static" | "tablet" | "desktop";

function ReviewCard({ review }: { review: Review }) {
  return (
    <li className={styles.card}>
      <div className={styles.cardContent}>
        <span role="img" aria-label="5 out of 5 stars">
          <StarRow />
        </span>
        <blockquote className={styles.quote}>“{review.quote}”</blockquote>
        <footer className={styles.author}>
          <span className={styles.authorName}>{review.author}</span>
          {review.business && <span className={styles.business}>{review.business}</span>}
        </footer>
      </div>
    </li>
  );
}

function distributeReviews(columnCount: number): Review[][] {
  const columns = Array.from({ length: columnCount }, () => [] as Review[]);
  reviews.forEach((review, index) => {
    const column = columns[index % columnCount];
    if (!column) {
      throw new Error("Could not assign a review to a scrolling column.");
    }
    column.push(review);
  });
  return columns;
}

function StaticReviews() {
  return (
    <ul className={styles.staticGrid}>
      {reviews.map((review) => (
        <ReviewCard key={review.author + review.quote} review={review} />
      ))}
    </ul>
  );
}

export function ReviewsWall() {
  const [layout, setLayout] = useState<ReviewLayout>("static");

  useEffect(() => {
    const tablet = window.matchMedia("(min-width: 768px)");
    const desktop = window.matchMedia("(min-width: 1024px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateLayout = () => {
      if (reducedMotion.matches || !tablet.matches) {
        setLayout("static");
      } else {
        setLayout(desktop.matches ? "desktop" : "tablet");
      }
    };

    updateLayout();
    tablet.addEventListener("change", updateLayout);
    desktop.addEventListener("change", updateLayout);
    reducedMotion.addEventListener("change", updateLayout);
    return () => {
      tablet.removeEventListener("change", updateLayout);
      desktop.removeEventListener("change", updateLayout);
      reducedMotion.removeEventListener("change", updateLayout);
    };
  }, []);

  if (layout === "static") {
    return <StaticReviews />;
  }

  const columns = distributeReviews(layout === "desktop" ? 3 : 2);

  return (
    <div
      className={styles.wall}
      role="region"
      aria-label="Review cards. Focus this area to pause scrolling."
      tabIndex={0}
    >
      <div className={layout === "desktop" ? styles.threeColumns : styles.twoColumns}>
        {columns.map((column, index) => (
          <div className={styles.column} key={index}>
            <div className={`${styles.track} ${index % 2 === 1 ? styles.reverse : ""}`}>
              <ul className={styles.stack}>
                {column.map((review) => (
                  <ReviewCard key={review.author + review.quote} review={review} />
                ))}
              </ul>
              <ul className={styles.stack} aria-hidden="true">
                {column.map((review) => (
                  <ReviewCard key={review.author + review.quote} review={review} />
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
