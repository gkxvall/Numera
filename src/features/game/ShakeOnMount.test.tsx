import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShakeOnMount } from "./ShakeOnMount";

describe("ShakeOnMount", () => {
  it("renders its children", () => {
    render(
      <ShakeOnMount>
        <p>Round over</p>
      </ShakeOnMount>,
    );
    expect(screen.getByText("Round over")).toBeInTheDocument();
  });
});
