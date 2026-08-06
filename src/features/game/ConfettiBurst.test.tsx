import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { ConfettiBurst } from "./ConfettiBurst";

describe("ConfettiBurst", () => {
  it("renders confetti pieces by default", () => {
    const { container } = render(<ConfettiBurst pieceCount={10} />);
    expect(container.querySelectorAll("span")).toHaveLength(10);
  });

  it("renders nothing when reduced motion is preferred", async () => {
    vi.doMock("framer-motion", async (importOriginal) => {
      const actual = await importOriginal<typeof import("framer-motion")>();
      return { ...actual, useReducedMotion: () => true };
    });
    vi.resetModules();
    const { ConfettiBurst: ReducedConfetti } = await import("./ConfettiBurst");

    const { container } = render(<ReducedConfetti pieceCount={10} />);
    expect(container).toBeEmptyDOMElement();
    vi.doUnmock("framer-motion");
  });
});
