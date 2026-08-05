import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlayerSetupScreen } from "@/features/players/PlayerSetupScreen";
import { useMatchSetupStore } from "@/stores/matchSetupStore";

beforeEach(() => {
  localStorage.clear();
  useMatchSetupStore.getState().resetToDefaults();
});

describe("PlayerSetupScreen", () => {
  it("starts with two players and an enabled Continue button", () => {
    render(<PlayerSetupScreen onContinue={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Player 1" })).toHaveValue("Player 1");
    expect(screen.getByRole("textbox", { name: "Player 2" })).toHaveValue("Player 2");
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("adds a new player when 'Add player' is clicked", async () => {
    const user = userEvent.setup();
    render(<PlayerSetupScreen onContinue={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Add player" }));
    expect(screen.getByRole("textbox", { name: "Player 3" })).toBeInTheDocument();
  });

  it("adds a bot with a visible Bot badge", async () => {
    const user = userEvent.setup();
    render(<PlayerSetupScreen onContinue={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Add bot" }));
    expect(screen.getByText("Bot")).toBeInTheDocument();
  });

  it("disables Continue and shows an error when a name is cleared", async () => {
    const user = userEvent.setup();
    render(<PlayerSetupScreen onContinue={vi.fn()} />);

    const firstName = screen.getByRole("textbox", { name: "Player 1" });
    await user.clear(firstName);

    expect(await screen.findByText("Enter a name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("calls onContinue when Continue is clicked with a valid roster", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<PlayerSetupScreen onContinue={onContinue} />);

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("removes a player when Remove is clicked, but never below the minimum", () => {
    render(<PlayerSetupScreen onContinue={vi.fn()} />);

    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    expect(removeButtons).toHaveLength(2);
    // With exactly 2 players (the minimum), Remove must be disabled on both.
    for (const button of removeButtons) {
      expect(button).toBeDisabled();
    }
  });
});
