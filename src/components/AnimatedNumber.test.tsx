import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedNumber } from "./AnimatedNumber";

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return { ...actual, useReducedMotion: () => true };
});

describe("AnimatedNumber", () => {
  it("displays the value immediately when reduced motion is preferred", () => {
    render(<AnimatedNumber value={42} />);
    expect(screen.getAllByText("42").length).toBeGreaterThan(0);
  });

  it("applies a custom formatter to both the visible and announced value", () => {
    render(<AnimatedNumber value={1500} formatter={(n) => n.toLocaleString()} label="Coins" />);
    expect(screen.getByText("1,500")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Coins: 1,500");
  });
});
