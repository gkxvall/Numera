import { beforeEach, describe, expect, it } from "vitest";
import { startNewMatch, useActiveMatchStore } from "./activeMatchStore";
import { createMatch, createPlayer } from "@/game-engine/engine";
import { makeTestSettings } from "@/game-engine/test-helpers";

function twoPlayers() {
  return [
    createPlayer({ id: "p1", name: "Maya", avatarId: "spike", colorId: "blue" }),
    createPlayer({ id: "p2", name: "Theo", avatarId: "grin", colorId: "red" }),
  ];
}

beforeEach(() => {
  localStorage.clear();
  useActiveMatchStore.setState({ match: null, lastEvents: [], lastError: null, dangerLevel: null });
});

describe("startNewMatch", () => {
  it("creates and starts a match in one call", () => {
    const match = createMatch("m1", makeTestSettings(), twoPlayers());
    startNewMatch(match);

    const state = useActiveMatchStore.getState();
    expect(state.match?.status).toBe("in_progress");
    expect(state.match?.currentRound).toBe(1);
    expect(state.lastError).toBeNull();
  });
});

describe("useActiveMatchStore.dispatch", () => {
  it("applies a valid command and updates the stored match", () => {
    const match = createMatch("m1", makeTestSettings(), twoPlayers());
    startNewMatch(match);

    const activeId = useActiveMatchStore.getState().match!.playerOrder[0]!;
    useActiveMatchStore.getState().dispatch({ type: "SUBMIT_MOVE", playerId: activeId, amount: 1 });

    expect(useActiveMatchStore.getState().match?.counter).toBe(1);
  });

  it("records a readable error instead of throwing when a command is invalid", () => {
    const match = createMatch("m1", makeTestSettings(), twoPlayers());
    startNewMatch(match);

    const inactiveId = useActiveMatchStore.getState().match!.playerOrder[1]!;
    useActiveMatchStore
      .getState()
      .dispatch({ type: "SUBMIT_MOVE", playerId: inactiveId, amount: 1 });

    expect(useActiveMatchStore.getState().lastError).toMatch(/not this player's turn/);
  });

  it("reports an error when there is no active match", () => {
    useActiveMatchStore.getState().dispatch({ type: "PAUSE_MATCH" });
    expect(useActiveMatchStore.getState().lastError).toMatch(/no active match/);
  });
});

describe("abandonAndClear", () => {
  it("clears the stored match", () => {
    const match = createMatch("m1", makeTestSettings(), twoPlayers());
    startNewMatch(match);
    useActiveMatchStore.getState().abandonAndClear();
    expect(useActiveMatchStore.getState().match).toBeNull();
  });
});

describe("dangerLevel tracking", () => {
  it("records a danger level after a move when the indicator is enabled", () => {
    const match = createMatch(
      "m1",
      makeTestSettings({ dangerIndicatorEnabled: true, targetRange: { min: 90, max: 100 } }),
      twoPlayers(),
    );
    startNewMatch(match);
    const activeId = useActiveMatchStore.getState().match!.playerOrder[0]!;
    useActiveMatchStore.getState().dispatch({ type: "SUBMIT_MOVE", playerId: activeId, amount: 1 });

    expect(useActiveMatchStore.getState().dangerLevel).not.toBeNull();
  });

  it("stays null when the danger indicator is disabled", () => {
    const match = createMatch(
      "m1",
      makeTestSettings({ dangerIndicatorEnabled: false, targetRange: { min: 90, max: 100 } }),
      twoPlayers(),
    );
    startNewMatch(match);
    const activeId = useActiveMatchStore.getState().match!.playerOrder[0]!;
    useActiveMatchStore.getState().dispatch({ type: "SUBMIT_MOVE", playerId: activeId, amount: 1 });

    expect(useActiveMatchStore.getState().dangerLevel).toBeNull();
  });

  it("clears on a fresh round so a stale danger level never leaks across turns", () => {
    const match = createMatch(
      "m1",
      makeTestSettings({
        mode: "multiLife",
        startingLives: 2,
        dangerIndicatorEnabled: true,
        targetRange: { min: 2, max: 2 },
      }),
      twoPlayers(),
    );
    startNewMatch(match);
    const loserId = useActiveMatchStore.getState().match!.playerOrder[0]!;
    useActiveMatchStore.getState().dispatch({ type: "SUBMIT_MOVE", playerId: loserId, amount: 2 });
    expect(useActiveMatchStore.getState().match!.status).toBe("round_ended");

    useActiveMatchStore.getState().dispatch({ type: "CONTINUE_AFTER_LOSS" });
    expect(useActiveMatchStore.getState().dangerLevel).toBeNull();
  });
});
