import { describe, expect, it } from "vitest";
import { applyCommand, createMatch } from "@/game-engine/engine";
import { createSeededRandomSource } from "@/game-engine/random";
import { makeTestPlayers, makeTestSettings } from "@/game-engine/test-helpers";
import { computeMatchStats, rankPlayers } from "./matchStats";

function playToCompletion() {
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

describe("computeMatchStats", () => {
  it("computes moves, clicks, and rounds from a completed match", () => {
    const match = playToCompletion();
    const stats = computeMatchStats(match);

    expect(stats.totalMoves).toBe(1);
    expect(stats.totalClicks).toBe(2);
    expect(stats.largestMove).toBe(2);
    expect(stats.averageMove).toBe(2);
    expect(stats.totalRounds).toBe(1);
    expect(stats.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("does not divide by zero when no moves have been made yet", () => {
    const match = createMatch("m1", makeTestSettings(), makeTestPlayers(2));
    const stats = computeMatchStats(match);
    expect(stats.averageMove).toBe(0);
    expect(stats.totalMoves).toBe(0);
  });
});

describe("rankPlayers", () => {
  it("sorts the champion first", () => {
    const match = playToCompletion();
    const ranked = rankPlayers(match);
    expect(ranked[0]!.id).toBe(match.winnerId);
    expect(ranked[0]!.placement).toBe(1);
    expect(ranked[1]!.placement).toBe(2);
  });
});
