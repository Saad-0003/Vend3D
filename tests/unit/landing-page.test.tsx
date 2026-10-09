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
      "/products",
    );
    expect(screen.getByRole("link", { name: /^Shop$/ })).toHaveAttribute("href", "/products");
  });

  it("renders every landing section", () => {
    render(<HomePage />);

    // The precision heading is split word-by-word for a blur reveal, so the
    // words are separate text nodes; assert each is present rather than one
    // contiguous string.
    for (const word of ["Built", "for", "tactile", "perfection."]) {
      expect(screen.getByText(word, { exact: true })).toBeInTheDocument();
    }
    expect(screen.getByText("Blanks engineered to endure.")).toBeInTheDocument();
    expect(screen.getByText("From 3D viewport to your studio.")).toBeInTheDocument();
    // Benefits labels are lowercased in the DOM (uppercased via CSS).
    expect(screen.getByText("carbon neutral dispatch")).toBeInTheDocument();
    expect(screen.getByText("Creators launch drops without waiting.")).toBeInTheDocument();
  });

  it("no longer renders the reviews section", () => {
    render(<HomePage />);

    expect(screen.queryByText("Verified studio builds.")).not.toBeInTheDocument();
    expect(screen.queryByText("Based on 2,480 verified builds globally")).not.toBeInTheDocument();
  });

  it("renders the featured collection placeholders with prices", () => {
    render(<HomePage />);

    expect(screen.getByRole("link", { name: /Heavyweight Boxy Tee/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Luna Glazed Mug/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Structured 6-Panel Cap/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Insulated Steel Bottle/ })).toBeInTheDocument();
    expect(screen.getByText("$48.00")).toBeInTheDocument();
    expect(screen.getByText("$42.00")).toBeInTheDocument();
  });

  it("renders the three how-it-works steps", () => {
    render(<HomePage />);

    for (const step of ["Pick", "Shape", "Own"]) {
      expect(screen.getByRole("heading", { name: step })).toBeInTheDocument();
    }
  });
});
