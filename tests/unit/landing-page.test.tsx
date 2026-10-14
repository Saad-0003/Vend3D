import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

afterEach(cleanup);

describe("landing page", () => {
  it("renders the hero headline and both calls to action", () => {
    render(<HomePage />);

    const headline = screen.getByRole("heading", { level: 1 });
    expect(headline).toHaveTextContent("See it.");
    expect(headline).toHaveTextContent("Shape it.");
    expect(headline).toHaveTextContent("Own it.");
    expect(screen.getByRole("link", { name: "Start designing" })).toHaveAttribute(
      "href",
      "/studio",
    );
    // "Shop" is now an in-page smooth scroll, not a route.
    expect(screen.getByRole("button", { name: /^Shop$/ })).toBeInTheDocument();
  });

  it("renders every landing section", () => {
    render(<HomePage />);

    expect(screen.getByText("Blanks engineered to endure.")).toBeInTheDocument();
    expect(screen.getByText("From 3D viewport to your studio.")).toBeInTheDocument();
    // Benefits metric labels (rendered uppercase via CSS, title-case in the DOM).
    expect(screen.getByText("Carbon neutral dispatch")).toBeInTheDocument();
    expect(screen.getByText("Creators launch drops without waiting.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See all reviews" })).toHaveAttribute(
      "href",
      "/reviews",
    );
    expect(screen.getByRole("link", { name: "Launch Your Canvas" })).toHaveAttribute(
      "href",
      "/studio",
    );
    const readAllLinks = screen.getAllByRole("link", { name: "Read all" });
    expect(readAllLinks).toHaveLength(3);
    readAllLinks.forEach((link) => expect(link).toHaveAttribute("href", "/products"));
    // Shop sits directly under the hero and is the smooth-scroll target.
    expect(document.getElementById("shop")).toBeInTheDocument();
  });

  it("no longer renders the reviews section", () => {
    render(<HomePage />);

    expect(screen.queryByText("Verified studio builds.")).not.toBeInTheDocument();
    expect(screen.queryByText("Based on 2,480 verified builds globally")).not.toBeInTheDocument();
  });

  it("renders the featured collection placeholders with prices", () => {
    render(<HomePage />);

    // Each card's media link is labelled with the bare product name; the swatch
    // links repeat it as "<name> — <colorway>". A string `name` matcher matches
    // the full accessible name, so this picks the media link only.
    for (const name of [
      "Heavyweight Boxy Tee",
      "Luna Glazed Mug",
      "Structured 6-Panel Cap",
      "Insulated Steel Bottle",
    ]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute(
        "href",
        expect.stringMatching(/^\/products\//) as unknown as string,
      );
    }
    expect(screen.getByText("$48.00")).toBeInTheDocument();
    expect(screen.getByText("$42.00")).toBeInTheDocument();
  });

  it("removed the precision section and its controls", () => {
    render(<HomePage />);

    for (const gone of ["Built for tactile perfection.", "Precision color", "Material physics"]) {
      expect(screen.queryByText(gone)).not.toBeInTheDocument();
    }
  });

  it("opens Studio from the hero CTA and points a swatch at the colour query param", () => {
    render(<HomePage />);

    expect(screen.getByRole("link", { name: "Start designing" })).toHaveAttribute(
      "href",
      "/studio",
    );
    expect(screen.getByRole("button", { name: /^Shop$/ })).toHaveAttribute("type", "button");
    expect(screen.getByRole("link", { name: "Heavyweight Boxy Tee — Onyx" })).toHaveAttribute(
      "href",
      expect.stringContaining("?color=onyx") as unknown as string,
    );
  });

  it("renders the three how-it-works steps", () => {
    render(<HomePage />);

    for (const step of ["Pick", "Shape", "Own"]) {
      expect(screen.getByRole("heading", { name: step })).toBeInTheDocument();
    }
  });
});
