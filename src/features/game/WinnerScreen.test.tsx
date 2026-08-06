import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WinnerScreen } from "./WinnerScreen";
import { applyCommand, createMatch } from "@/game-engine/engine";
import { createSeededRandomSource } from "@/game-engine/random";
import { makeTestPlayers, makeTestSettings } from "@/game-engine/test-helpers";

function completedMatch() {
  let match = createMatch(
    "m1",
    makeTestSettings({ targetRange: { min: 2, max: 2 } }),
    makeTestPlayers(2),
  );
  const random = createSeededRandomSource(1);
  match = applyCommand(match, { type: "START_MATCH" }, random).state;
  const loserId = match.playerOrder[match.activePlayerIndex]!;
  match = applyCommand(match, { type: "SUBMIT_MOVE", playerId: loserId, amount: 2 }, random).state;
  return match;
}

describe("WinnerScreen", () => {
  it("announces the winner and lists the final ranking with the champion first", () => {
    const match = completedMatch();
    const winner = match.players.find((p) => p.id === match.winnerId)!;
    render(
      <WinnerScreen
        match={match}
        onPlayAgain={vi.fn()}
        onChangeSettings={vi.fn()}
        onReturnHome={vi.fn()}
      />,
    );

    expect(screen.getByText(`${winner.name} wins!`)).toBeInTheDocument();
    const rankingNumbers = screen.getAllByText(/^[12]$/);
    expect(rankingNumbers[0]).toHaveTextContent("1");
  });

  it("shows match statistics derived from the real match data", () => {
    const match = completedMatch();
    render(
      <WinnerScreen
        match={match}
        onPlayAgain={vi.fn()}
        onChangeSettings={vi.fn()}
        onReturnHome={vi.fn()}
      />,
    );

    expect(screen.getByText("Rounds played")).toBeInTheDocument();
    expect(screen.getByText("Total moves")).toBeInTheDocument();
  });

  it("calls the corresponding handler for each action button", async () => {
    const user = userEvent.setup();
    const onPlayAgain = vi.fn();
    const onChangeSettings = vi.fn();
    const onReturnHome = vi.fn();
    const match = completedMatch();
    render(
      <WinnerScreen
        match={match}
        onPlayAgain={onPlayAgain}
        onChangeSettings={onChangeSettings}
        onReturnHome={onReturnHome}
      />,
    );

    await user.click(screen.getByRole("button", { name: /play again/i }));
    await user.click(screen.getByRole("button", { name: "Change settings" }));
    await user.click(screen.getByRole("button", { name: "Return home" }));

    expect(onPlayAgain).toHaveBeenCalledTimes(1);
    expect(onChangeSettings).toHaveBeenCalledTimes(1);
    expect(onReturnHome).toHaveBeenCalledTimes(1);
  });
});
