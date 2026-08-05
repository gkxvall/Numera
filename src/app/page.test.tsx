import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home", () => {
  it("renders the Numera brand name", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "Numera" })).toBeInTheDocument();
  });
});
