import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  it("exposes progress via ARIA attributes, not color alone", () => {
    render(<ProgressBar value={30} max={100} label="XP progress" />);
    const bar = screen.getByRole("progressbar", { name: "XP progress" });
    expect(bar).toHaveAttribute("aria-valuenow", "30");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("clamps values above max to 100%", () => {
    render(<ProgressBar value={150} max={100} label="XP progress" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("clamps negative values to 0%", () => {
    render(<ProgressBar value={-10} max={100} label="XP progress" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("does not divide by zero when max is 0", () => {
    render(<ProgressBar value={5} max={0} label="XP progress" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });
});
