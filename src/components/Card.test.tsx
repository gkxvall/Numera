import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "./Card";

describe("Card", () => {
  it("renders its children", () => {
    render(<Card>Match summary</Card>);
    expect(screen.getByText("Match summary")).toBeInTheDocument();
  });

  it("merges a custom className with the base styles", () => {
    render(<Card className="max-w-sm">content</Card>);
    expect(screen.getByText("content")).toHaveClass("max-w-sm");
  });
});
