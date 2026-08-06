import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EliminationScreen } from "./EliminationScreen";
import { applyCommand, createMatch } from "@/game-engine/engine";
import { createSeededRandomSource } from "@/game-engine/random";
import { makeTestPlayers, makeTestSettings } from "@/game-engine/test-helpers";

function roundEndedMatch(startingLives: number) {
  let match = createMatch(
    "m1",
    makeTestSettings({ mode: "multiLife", startingLives, targetRange: { min: 2, max: 2 } }),
    makeTestPlayers(2),
  );
  const random = createSeededRandomSource(1);
  match = applyCommand(match, { type: "START_MATCH" }, random).state;
  const loserId = match.playerOrder[match.activePlayerIndex]!;
  match = applyCommand(match, { type: "SUBMIT_MOVE", playerId: loserId, amount: 2 }, random).state;
  return match;
}

describe("EliminationScreen", () => {
  it("shows 'lost a life' and reveals the target when the player survives", () => {
    const match = roundEndedMatch(2);
    render(<EliminationScreen match={match} onContinue={vi.fn()} />);

    expect(screen.getByText(/lost a life\./)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // revealed target
    expect(screen.getByText(/1 life remaining/)).toBeInTheDocument();
  });

  it("shows 'was eliminated!' when the player's last life is gone", () => {
    const match = roundEndedMatch(1);
    render(<EliminationScreen match={match} onContinue={vi.fn()} />);

    expect(screen.getByText(/was eliminated!/)).toBeInTheDocument();
    expect(screen.queryByText(/lives? remaining/)).not.toBeInTheDocument();
  });

  it("calls onContinue when Continue is clicked", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    const match = roundEndedMatch(2);
    render(<EliminationScreen match={match} onContinue={onContinue} />);

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
