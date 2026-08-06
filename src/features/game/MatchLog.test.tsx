import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatchLog } from "./MatchLog";
import { applyCommand, createMatch } from "@/game-engine/engine";
import { createSeededRandomSource } from "@/game-engine/random";
import { makeTestPlayers, makeTestSettings } from "@/game-engine/test-helpers";
import type { ActiveMatch } from "@/game-engine/types";

describe("MatchLog", () => {
  it("renders nothing when there is no history yet", () => {
    const match = createMatch("m1", makeTestSettings(), makeTestPlayers(2));
    const { container } = render(<MatchLog match={match} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows recent moves, most recent first", () => {
    const match = createMatch(
      "m1",
      makeTestSettings({ targetRange: { min: 90, max: 100 } }),
      makeTestPlayers(2),
    );
    const random = createSeededRandomSource(1);
    const { state: started } = applyCommand(match, { type: "START_MATCH" }, random);
    const firstId = started.playerOrder[started.activePlayerIndex]!;
    const { state: afterMove } = applyCommand(
      started,
      { type: "SUBMIT_MOVE", playerId: firstId, amount: 2 },
      random,
    );

    render(<MatchLog match={afterMove} />);
    const firstPlayer = afterMove.players.find((p) => p.id === firstId)!;
    expect(screen.getByText(`${firstPlayer.name} played +2`)).toBeInTheDocument();
  });

  it("interleaves power-up usage with moves in chronological order", () => {
    const match = createMatch(
      "m1",
      makeTestSettings({ powerUpsEnabled: true, targetRange: { min: 90, max: 100 } }),
      makeTestPlayers(2),
    );
    const random = createSeededRandomSource(1);
    const { state: started } = applyCommand(match, { type: "START_MATCH" }, random);
    const activeId = started.playerOrder[started.activePlayerIndex]!;
    const withPowerUp: ActiveMatch = {
      ...started,
      players: started.players.map((p) =>
        p.id === activeId ? { ...p, powerUps: [{ powerUpId: "reverse", quantity: 1 }] } : p,
      ),
    };

    const { state: afterPowerUp } = applyCommand(
      withPowerUp,
      { type: "USE_POWER_UP", playerId: activeId, powerUpId: "reverse" },
      random,
    );

    render(<MatchLog match={afterPowerUp} />);
    const player = afterPowerUp.players.find((p) => p.id === activeId)!;
    expect(screen.getByText(`${player.name} used Reverse`)).toBeInTheDocument();
  });
});
