import { describe, expect, it } from "vitest";

import { reviews } from "@/data/reviews";

describe("demo reviews", () => {
  it("keeps the three homepage reviews and appends all twelve supplied entries", () => {
    expect(reviews).toHaveLength(15);
    expect(reviews.slice(0, 3).map(({ quote, author }) => ({ quote, author }))).toEqual([
      {
        quote:
          "Vend3D completely transformed our merchandise workflow. We designed, proofed, and launched 4 high-demand drops in 48 hours without touching sample freight.",
        author: "CyberProto Studios",
      },
      {
        quote:
          "The real-time WebGL proofing is unmatched. Colors calibrated 11 with industrial UV sublimation on our heavyweight tees. Zero surprises on arrival.",
        author: "Kaelen Vance, Studio V",
      },
      {
        quote:
          "Very appreciative of how high the build quality is. Single-piece MOQ lets us run limited hyper-exclusive preorder drops with zero dead stock risk.",
        author: "Marcus Ray, Apex DTC",
      },
    ]);
    expect(reviews.slice(3).every((review) => review.business)).toBe(true);
  });
});
