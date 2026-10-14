import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import {
  AccountPageSkeleton,
  DesignsPageSkeleton,
  ShopPageSkeleton,
  StageWithSidebarSkeleton,
  StudioHubPageSkeleton,
  StudioProductPageSkeleton,
} from "@/components/ui/route-skeletons";

/**
 * The route skeleton vocabulary (DESIGN.md rule 12).
 *
 * These assert the thing that matters for a loading state: that it reserves the
 * *same* geometry as the page it stands in for, so nothing shifts when the route
 * resolves — and that it carries exactly one status region rather than a nested
 * pair. A dev-server route-level `loading.tsx` cannot be observed reliably from
 * Playwright (Next renders nothing new until the flight response starts
 * streaming, and an aborted request is recovered from the prefetch cache), so
 * the shape contract is proven here instead.
 */

function classesOf(element: Element | null): string {
  return element?.getAttribute("class") ?? "";
}

describe("route skeletons", () => {
  it("the shop skeleton reserves the archive's own grid", () => {
    const { container } = render(<ShopPageSkeleton />);

    // Exactly one status region, so a screen reader announces one pending load.
    expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(container.querySelector('[role="status"]')?.getAttribute("aria-label")).toBe(
      "Loading shop",
    );

    // Same grid geometry as the shop screen's `motion.ul`.
    const grid = container.querySelector('ul[aria-label="Loading archive"]');
    expect(grid).not.toBeNull();
    expect(classesOf(grid)).toContain("grid-cols-2");
    expect(classesOf(grid)).toContain("lg:grid-cols-4");
    // Eight placeholders, matching the count the screen shows.
    expect(grid?.querySelectorAll(":scope > li")).toHaveLength(8);

    // The toolbar row is reserved too: count line, tabs, sort, filters.
    expect(classesOf(container.querySelector('[role="status"]'))).toBeTruthy();
  });

  it("the designs skeleton reserves the saved-design grid", () => {
    const { container } = render(<DesignsPageSkeleton />);
    expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);

    const grid = container.querySelector('ul[aria-label="Loading designs"]');
    expect(grid).not.toBeNull();
    expect(classesOf(grid)).toContain("sm:grid-cols-2");
    expect(classesOf(grid)).toContain("lg:grid-cols-3");
    expect(grid?.querySelectorAll(":scope > li")).toHaveLength(6);
  });

  it("the account skeleton reserves the chips and the panel card", () => {
    const { container } = render(<AccountPageSkeleton />);
    expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(container.querySelector('[role="status"]')?.getAttribute("aria-label")).toBe(
      "Loading account",
    );

    // Five section chips, and the panel card keeps its minimum height.
    const chips = container.querySelectorAll('[role="status"] > div > div');
    expect(chips.length).toBeGreaterThanOrEqual(2);
    expect(container.querySelector(".min-h-\\[26rem\\]")).not.toBeNull();
  });

  it("the studio hub skeleton reserves the blanks grid, not the stage", () => {
    const { container } = render(<StudioHubPageSkeleton />);
    expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);

    const grid = container.querySelector('ul[aria-label="Loading blanks"]');
    expect(grid).not.toBeNull();
    expect(classesOf(grid)).toContain("sm:grid-cols-2");
    expect(classesOf(grid)).toContain("xl:grid-cols-4");
    expect(grid?.querySelectorAll(":scope > li")).toHaveLength(4);

    // The hub has no stage, so the stage's full-height desktop box must not
    // appear here. (The blank cards *do* carry 4:5 media, like the real cards.)
    expect(container.querySelector(".lg\\:h-\\[calc\\(100svh-150px\\)\\]")).toBeNull();
  });

  it("the product skeleton reserves the stage beside its sidebar", () => {
    const { container } = render(<StudioProductPageSkeleton />);
    expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);

    const stage = container.querySelector(".lg\\:flex-1");
    expect(stage).not.toBeNull();
    expect(classesOf(stage)).toContain("lg:h-[calc(100svh-150px)]");

    // The sidebar keeps its fixed width, matching the studio screen.
    const sidebar = container.querySelector(".lg\\:w-\\[440px\\]");
    expect(sidebar).not.toBeNull();

    // Four suggestion cards, as the studio's "you may also like" rail shows.
    const rail = container.querySelector('ul[aria-label="Loading suggestions"]');
    expect(rail?.querySelectorAll(":scope > li")).toHaveLength(4);
  });

  it("the shared stage block is reusable on its own", () => {
    const { container } = render(<StageWithSidebarSkeleton />);
    // Used by the studio screen while its store hydrates, so no status wrapper.
    expect(container.querySelectorAll('[role="status"]')).toHaveLength(0);
    expect(container.querySelector(".lg\\:flex-1")).not.toBeNull();
  });

  it("no skeleton uses a spinner", () => {
    // "Shimmer, no spinners" — the house Skeleton is a pulse, and nothing here
    // reaches for `animate-spin` (DESIGN.md §5 documents the primitive).
    const skeletons = [
      <ShopPageSkeleton key="shop" />,
      <DesignsPageSkeleton key="designs" />,
      <AccountPageSkeleton key="account" />,
      <StudioHubPageSkeleton key="hub" />,
      <StudioProductPageSkeleton key="product" />,
    ];
    for (const skeleton of skeletons) {
      const { container } = render(skeleton);
      const spinning = [...container.querySelectorAll('[class*="animate-spin"]')];
      expect(spinning).toHaveLength(0);
      // Every placeholder is the shared Skeleton primitive, not a bespoke div.
      expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    }
  });
});
