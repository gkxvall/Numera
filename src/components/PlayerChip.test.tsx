import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlayerChip } from "./PlayerChip";

describe("PlayerChip", () => {
  it("renders the player's name", () => {
    render(<PlayerChip name="Maya" colorId="blue" />);
    expect(screen.getByText("Maya")).toBeInTheDocument();
  });

  it("communicates turn state through text, not color alone", () => {
    render(<PlayerChip name="Maya" colorId="blue" isActive />);
    expect(screen.getByLabelText("Maya, current turn")).toBeInTheDocument();
  });

  it("communicates elimination through text, not color alone", () => {
    render(<PlayerChip name="Maya" colorId="blue" isEliminated />);
    expect(screen.getByLabelText("Maya, eliminated")).toBeInTheDocument();
  });

  it("falls back to a default color for an unknown colorId", () => {
    render(<PlayerChip name="Maya" colorId="not-a-real-color" />);
    expect(screen.getByText("Maya")).toBeInTheDocument();
  });
});
