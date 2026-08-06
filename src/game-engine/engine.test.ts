import { describe, expect, it } from "vitest";
import { applyCommand, createMatch } from "./engine";
import { createSeededRandomSource, type RandomSource } from "./random";
import { GameRuleViolation, type ActiveMatch, type GameEvent } from "./types";
import { makeTestPlayers, makeTestSettings } from "./test-helpers";

function eventTypes(events: GameEvent[]): string[] {
  return events.map((event) => event.type);
}

describe("createMatch", () => {
  it("requires at least two players", () => {
    expect(() => createMatch("m1", makeTestSettings(), makeTestPlayers(1))).toThrow(
      GameRuleViolation,
    );
  });

  it("rejects a game mode that isn't implemented yet", () => {
    expect(() =>
      createMatch("m1", makeTestSettings({ mode: "chaos" }), makeTestPlayers(2)),
    ).toThrow(/not yet implemented/);
  });

  it("applies startingLives to every player, overriding whatever they arrived with", () => {
    const match = createMatch("m1", makeTestSettings({ startingLives: 3 }), makeTestPlayers(2));
    for (const player of match.players) {
      expect(player.lives).toBe(3);
      expect(player.maxLives).toBe(3);
      expect(player.isEliminated).toBe(false);
    }
  });

  it("starts in setup status", () => {
    const match = createMatch("m1", makeTestSettings(), makeTestPlayers(2));
    expect(match.status).toBe("setup");
  });
});

describe("START_MATCH", () => {
  it("transitions to in_progress and generates a target within range", () => {
    const match = createMatch("m1", makeTestSettings(), makeTestPlayers(2));
    const random = createSeededRandomSource(1);
    const { state, events } = applyCommand(match, { type: "START_MATCH" }, random);

    expect(state.status).toBe("in_progress");
    expect(state.currentRound).toBe(1);
    expect(state.counter).toBe(0);
    expect(state.target).toBeGreaterThanOrEqual(20);
    expect(state.target).toBeLessThanOrEqual(40);
    expect(eventTypes(events)).toEqual(["MATCH_STARTED", "ROUND_STARTED"]);
  });

  it("cannot be started twice", () => {
    const match = createMatch("m1", makeTestSettings(), makeTestPlayers(2));
    const random = createSeededRandomSource(1);
    const { state } = applyCommand(match, { type: "START_MATCH" }, random);
    expect(() => applyCommand(state, { type: "START_MATCH" }, random)).toThrow(GameRuleViolation);
  });
});

describe("SUBMIT_MOVE", () => {
  function startedMatch(overrides: Parameters<typeof makeTestSettings>[0] = {}) {
    const match = createMatch("m1", makeTestSettings(overrides), makeTestPlayers(2));
    const random = createSeededRandomSource(1);
    const { state } = applyCommand(match, { type: "START_MATCH" }, random);
    return { state, random };
  }

  it("rejects a move from a player whose turn it isn't (prevents duplicate/out-of-turn submission)", () => {
    const { state, random } = startedMatch();
    const inactivePlayerId = state.playerOrder[1]!;
    expect(() =>
      applyCommand(state, { type: "SUBMIT_MOVE", playerId: inactivePlayerId, amount: 1 }, random),
    ).toThrow(/not this player's turn/);
  });

  it("rejects an out-of-range move amount", () => {
    const { state, random } = startedMatch();
    const activeId = state.playerOrder[state.activePlayerIndex]!;
    expect(() =>
      applyCommand(state, { type: "SUBMIT_MOVE", playerId: activeId, amount: 99 }, random),
    ).toThrow(GameRuleViolation);
  });

  it("advances the counter and passes the turn when the target isn't hit", () => {
    const { state, random } = startedMatch({ targetRange: { min: 90, max: 100 } });
    const activeId = state.playerOrder[state.activePlayerIndex]!;
    const otherId = state.playerOrder[1 - state.activePlayerIndex]!;

    const { state: next, events } = applyCommand(
      state,
      { type: "SUBMIT_MOVE", playerId: activeId, amount: 3 },
      random,
    );

    expect(next.counter).toBe(3);
    expect(next.playerOrder[next.activePlayerIndex]).toBe(otherId);
    expect(eventTypes(events)).toContain("COUNTER_CHANGED");
    expect(eventTypes(events)).toContain("TURN_CHANGED");
    expect(eventTypes(events)).not.toContain("TARGET_HIT");
  });

  it("never lets the counter overshoot the target, even mid-move (plan §6.4)", () => {
    // Force a tiny range so the target is deterministic and reachable in one move.
    const match = createMatch(
      "m1",
      makeTestSettings({ targetRange: { min: 2, max: 2 }, maxMove: 3 }),
      makeTestPlayers(2),
    );
    const random = createSeededRandomSource(1);
    const { state: started } = applyCommand(match, { type: "START_MATCH" }, random);
    expect(started.target).toBe(2);

    const activeId = started.playerOrder[started.activePlayerIndex]!;
    const { state: after, events } = applyCommand(
      started,
      { type: "SUBMIT_MOVE", playerId: activeId, amount: 3 },
      random,
    );

    // Classic mode (1 life): hitting the target ends the round/match, so counter
    // resets to 0 rather than persisting at 2 — assert it never exceeded the target.
    expect(eventTypes(events)).toContain("TARGET_HIT");
    const move = after.moveHistory[0]!;
    expect(move.counterAfter).toBe(2);
    expect(move.appliedAmount).toBe(2);
    expect(move.selectedAmount).toBe(3);
  });

  it("classic mode (1 life): hitting the target eliminates the player and finishes the match", () => {
    const match = createMatch(
      "m1",
      makeTestSettings({ targetRange: { min: 2, max: 2 } }),
      makeTestPlayers(2),
    );
    const random = createSeededRandomSource(1);
    const { state: started } = applyCommand(match, { type: "START_MATCH" }, random);
    const loserId = started.playerOrder[started.activePlayerIndex]!;
    const winnerId = started.playerOrder[1 - started.activePlayerIndex]!;

    const { state: finished, events } = applyCommand(
      started,
      { type: "SUBMIT_MOVE", playerId: loserId, amount: 2 },
      random,
    );

    expect(finished.status).toBe("completed");
    expect(finished.winnerId).toBe(winnerId);
    expect(eventTypes(events)).toEqual(
      expect.arrayContaining(["TARGET_HIT", "LIFE_LOST", "PLAYER_ELIMINATED", "MATCH_FINISHED"]),
    );

    const loser = finished.players.find((p) => p.id === loserId)!;
    const winner = finished.players.find((p) => p.id === winnerId)!;
    expect(loser.isEliminated).toBe(true);
    expect(loser.placement).toBe(2);
    expect(winner.placement).toBe(1);
  });

  it("multi-life mode: losing a life without running out keeps the match going", () => {
    const match = createMatch(
      "m1",
      makeTestSettings({ mode: "multiLife", startingLives: 2, targetRange: { min: 2, max: 2 } }),
      makeTestPlayers(2),
    );
    const random = createSeededRandomSource(1);
    const { state: started } = applyCommand(match, { type: "START_MATCH" }, random);
    const loserId = started.playerOrder[started.activePlayerIndex]!;

    const { state: afterHit, events } = applyCommand(
      started,
      { type: "SUBMIT_MOVE", playerId: loserId, amount: 2 },
      random,
    );

    expect(afterHit.status).toBe("round_ended");
    expect(eventTypes(events)).toContain("LIFE_LOST");
    expect(eventTypes(events)).not.toContain("PLAYER_ELIMINATED");
    expect(eventTypes(events)).not.toContain("MATCH_FINISHED");

    const loser = afterHit.players.find((p) => p.id === loserId)!;
    expect(loser.lives).toBe(1);
    expect(loser.isEliminated).toBe(false);
  });

  it("rejects further moves while a round is waiting to continue", () => {
    const match = createMatch(
      "m1",
      makeTestSettings({ mode: "multiLife", startingLives: 2, targetRange: { min: 2, max: 2 } }),
      makeTestPlayers(2),
    );
    const random = createSeededRandomSource(1);
    const { state: started } = applyCommand(match, { type: "START_MATCH" }, random);
    const loserId = started.playerOrder[started.activePlayerIndex]!;
    const { state: roundEnded } = applyCommand(
      started,
      { type: "SUBMIT_MOVE", playerId: loserId, amount: 2 },
      random,
    );

    expect(() =>
      applyCommand(roundEnded, { type: "SUBMIT_MOVE", playerId: loserId, amount: 1 }, random),
    ).toThrow(/not currently accepting moves/);
  });
});

describe("CONTINUE_AFTER_LOSS", () => {
  it("starts a new round, resets the counter, and advances the turn past the loser", () => {
    const match = createMatch(
      "m1",
      makeTestSettings({ mode: "multiLife", startingLives: 2, targetRange: { min: 2, max: 2 } }),
      makeTestPlayers(3),
    );
    const random = createSeededRandomSource(1);
    const { state: started } = applyCommand(match, { type: "START_MATCH" }, random);
    const loserId = started.playerOrder[started.activePlayerIndex]!;
    const { state: roundEnded } = applyCommand(
      started,
      { type: "SUBMIT_MOVE", playerId: loserId, amount: 2 },
      random,
    );

    const { state: nextRound, events } = applyCommand(
      roundEnded,
      { type: "CONTINUE_AFTER_LOSS" },
      random,
    );

    expect(nextRound.status).toBe("in_progress");
    expect(nextRound.currentRound).toBe(2);
    expect(nextRound.counter).toBe(0);
    expect(nextRound.playerOrder[nextRound.activePlayerIndex]).not.toBe(loserId);
    expect(eventTypes(events)).toEqual(["ROUND_STARTED", "TURN_CHANGED"]);
  });

  it("throws when there is no round waiting to continue", () => {
    const match = createMatch("m1", makeTestSettings(), makeTestPlayers(2));
    const random = createSeededRandomSource(1);
    const { state } = applyCommand(match, { type: "START_MATCH" }, random);
    expect(() => applyCommand(state, { type: "CONTINUE_AFTER_LOSS" }, random)).toThrow(
      /no round to continue/,
    );
  });
});

describe("TURN_TIMEOUT", () => {
  it("rejects a stale timeout for a player who is no longer active (race-condition guard)", () => {
    const match = createMatch(
      "m1",
      makeTestSettings({ targetRange: { min: 90, max: 100 } }),
      makeTestPlayers(2),
    );
    const random = createSeededRandomSource(1);
    const { state: started } = applyCommand(match, { type: "START_MATCH" }, random);
    const firstPlayerId = started.playerOrder[started.activePlayerIndex]!;

    // First player moves, turn passes on.
    const { state: afterMove } = applyCommand(
      started,
      { type: "SUBMIT_MOVE", playerId: firstPlayerId, amount: 1 },
      random,
    );

    // A stale timeout for the player who already moved must be rejected.
    expect(() =>
      applyCommand(afterMove, { type: "TURN_TIMEOUT", playerId: firstPlayerId }, random),
    ).toThrow(/no longer matches the active player/);
  });

  it("defaults to applying +1 on the active player's behalf", () => {
    const match = createMatch(
      "m1",
      makeTestSettings({ targetRange: { min: 90, max: 100 }, timeoutBehavior: "applyPlusOne" }),
      makeTestPlayers(2),
    );
    const random = createSeededRandomSource(1);
    const { state: started } = applyCommand(match, { type: "START_MATCH" }, random);
    const activeId = started.playerOrder[started.activePlayerIndex]!;

    const { state: after } = applyCommand(
      started,
      { type: "TURN_TIMEOUT", playerId: activeId },
      random,
    );
    expect(after.counter).toBe(1);
  });

  it("skipTurn passes the turn without touching the counter", () => {
    const match = createMatch(
      "m1",
      makeTestSettings({ targetRange: { min: 90, max: 100 }, timeoutBehavior: "skipTurn" }),
      makeTestPlayers(2),
    );
    const random = createSeededRandomSource(1);
    const { state: started } = applyCommand(match, { type: "START_MATCH" }, random);
    const activeId = started.playerOrder[started.activePlayerIndex]!;
    const otherId = started.playerOrder[1 - started.activePlayerIndex]!;

    const { state: after, events } = applyCommand(
      started,
      { type: "TURN_TIMEOUT", playerId: activeId },
      random,
    );
    expect(after.counter).toBe(0);
    expect(after.playerOrder[after.activePlayerIndex]).toBe(otherId);
    expect(eventTypes(events)).toEqual(["TURN_CHANGED"]);
  });

  it("loseLife deducts a life without touching the counter", () => {
    const match = createMatch(
      "m1",
      makeTestSettings({
        mode: "multiLife",
        startingLives: 2,
        targetRange: { min: 90, max: 100 },
        timeoutBehavior: "loseLife",
      }),
      makeTestPlayers(2),
    );
    const random = createSeededRandomSource(1);
    const { state: started } = applyCommand(match, { type: "START_MATCH" }, random);
    const activeId = started.playerOrder[started.activePlayerIndex]!;

    const { state: after } = applyCommand(
      started,
      { type: "TURN_TIMEOUT", playerId: activeId },
      random,
    );
    expect(after.counter).toBe(0);
    expect(after.players.find((p) => p.id === activeId)!.lives).toBe(1);
    expect(after.status).toBe("round_ended");
  });

  it("losePoint decrements score and passes the turn", () => {
    const match = createMatch(
      "m1",
      makeTestSettings({ targetRange: { min: 90, max: 100 }, timeoutBehavior: "losePoint" }),
      makeTestPlayers(2),
    );
    const random = createSeededRandomSource(1);
    const { state: started } = applyCommand(match, { type: "START_MATCH" }, random);
    const activeId = started.playerOrder[started.activePlayerIndex]!;

    const { state: after } = applyCommand(
      started,
      { type: "TURN_TIMEOUT", playerId: activeId },
      random,
    );
    expect(after.players.find((p) => p.id === activeId)!.score).toBe(-1);
    expect(after.playerOrder[after.activePlayerIndex]).not.toBe(activeId);
  });

  it("randomMove stays within the configured maximum", () => {
    const match = createMatch(
      "m1",
      makeTestSettings({
        targetRange: { min: 90, max: 100 },
        maxMove: 3,
        timeoutBehavior: "randomMove",
      }),
      makeTestPlayers(2),
    );
    const random = createSeededRandomSource(1);
    const { state: started } = applyCommand(match, { type: "START_MATCH" }, random);
    const activeId = started.playerOrder[started.activePlayerIndex]!;

    const { state: after } = applyCommand(
      started,
      { type: "TURN_TIMEOUT", playerId: activeId },
      random,
    );
    expect(after.counter).toBeGreaterThanOrEqual(1);
    expect(after.counter).toBeLessThanOrEqual(3);
  });
});

describe("PAUSE_MATCH / RESUME_MATCH", () => {
  it("rejects moves while paused, and allows them again after resuming", () => {
    const match = createMatch("m1", makeTestSettings(), makeTestPlayers(2));
    const random = createSeededRandomSource(1);
    const { state: started } = applyCommand(match, { type: "START_MATCH" }, random);
    const activeId = started.playerOrder[started.activePlayerIndex]!;

    const { state: paused, events: pauseEvents } = applyCommand(
      started,
      { type: "PAUSE_MATCH" },
      random,
    );
    expect(paused.status).toBe("paused");
    expect(eventTypes(pauseEvents)).toEqual(["MATCH_PAUSED"]);

    expect(() =>
      applyCommand(paused, { type: "SUBMIT_MOVE", playerId: activeId, amount: 1 }, random),
    ).toThrow(/not currently accepting moves/);

    const { state: resumed, events: resumeEvents } = applyCommand(
      paused,
      { type: "RESUME_MATCH" },
      random,
    );
    expect(resumed.status).toBe("in_progress");
    expect(eventTypes(resumeEvents)).toEqual(["MATCH_RESUMED"]);

    const { state: afterMove } = applyCommand(
      resumed,
      { type: "SUBMIT_MOVE", playerId: activeId, amount: 1 },
      random,
    );
    expect(afterMove.counter).toBe(1);
  });

  it("cannot pause a match that isn't in progress", () => {
    const match = createMatch("m1", makeTestSettings(), makeTestPlayers(2));
    const random = createSeededRandomSource(1);
    expect(() => applyCommand(match, { type: "PAUSE_MATCH" }, random)).toThrow(GameRuleViolation);
  });
});

describe("ABANDON_MATCH", () => {
  it("marks the match abandoned and blocks further commands", () => {
    const match = createMatch("m1", makeTestSettings(), makeTestPlayers(2));
    const random = createSeededRandomSource(1);
    const { state: started } = applyCommand(match, { type: "START_MATCH" }, random);
    const { state: abandoned, events } = applyCommand(started, { type: "ABANDON_MATCH" }, random);

    expect(abandoned.status).toBe("abandoned");
    expect(abandoned.completedAt).toBeDefined();
    expect(eventTypes(events)).toEqual(["MATCH_ABANDONED"]);

    expect(() => applyCommand(abandoned, { type: "ABANDON_MATCH" }, random)).toThrow(
      /already finished/,
    );
  });
});

describe("USE_POWER_UP", () => {
  // Full power-up behavior (all 11 types, balance rules) is covered in
  // power-up-resolver.test.ts. This just checks the engine-level gate.
  it("is rejected when power-ups are disabled for the match", () => {
    const match = createMatch(
      "m1",
      makeTestSettings({ powerUpsEnabled: false }),
      makeTestPlayers(2),
    );
    const random = createSeededRandomSource(1);
    const { state } = applyCommand(match, { type: "START_MATCH" }, random);
    const activeId = state.playerOrder[state.activePlayerIndex]!;

    expect(() =>
      applyCommand(
        state,
        { type: "USE_POWER_UP", playerId: activeId, powerUpId: "shield" },
        random,
      ),
    ).toThrow(/disabled/);
  });
});

/** Auto-plays a match to completion using only the public command API. */
function playFullMatch(
  playerCount: number,
  random: RandomSource,
  settingsOverrides: Parameters<typeof makeTestSettings>[0] = {},
): { match: ActiveMatch; events: GameEvent[] } {
  let match = createMatch("m1", makeTestSettings(settingsOverrides), makeTestPlayers(playerCount));
  const allEvents: GameEvent[] = [];

  const started = applyCommand(match, { type: "START_MATCH" }, random);
  match = started.state;
  allEvents.push(...started.events);

  let guard = 0;
  while (match.status !== "completed" && guard < 5000) {
    guard++;
    if (match.status === "round_ended") {
      const result = applyCommand(match, { type: "CONTINUE_AFTER_LOSS" }, random);
      match = result.state;
      allEvents.push(...result.events);
      continue;
    }
    const activeId = match.playerOrder[match.activePlayerIndex]!;
    const amount = random.nextInt(1, match.settings.maxMove);
    const result = applyCommand(match, { type: "SUBMIT_MOVE", playerId: activeId, amount }, random);
    match = result.state;
    allEvents.push(...result.events);
  }

  if (guard >= 5000) throw new Error("Match did not finish — possible infinite loop.");
  return { match, events: allEvents };
}

describe("full match simulations", () => {
  it("a 2-player classic match always finishes with a winner and correct placements", () => {
    const { match } = playFullMatch(2, createSeededRandomSource(10));
    expect(match.status).toBe("completed");
    expect(match.winnerId).toBeDefined();

    const winner = match.players.find((p) => p.id === match.winnerId)!;
    const loser = match.players.find((p) => p.id !== match.winnerId)!;
    expect(winner.placement).toBe(1);
    expect(loser.placement).toBe(2);
    expect(loser.isEliminated).toBe(true);
  });

  it("a 10-player adaptive-range match finishes with distinct placements 1..10", () => {
    const { match } = playFullMatch(10, createSeededRandomSource(42), {
      adaptiveTargetRange: true,
      targetRange: { min: 20, max: 40 },
    });

    expect(match.status).toBe("completed");
    const placements = match.players.map((p) => p.placement).sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(placements).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("never records a move whose counter exceeds its round's target", () => {
    const { match } = playFullMatch(6, createSeededRandomSource(7));
    // Every move's counterAfter must never have exceeded the target it was checked against.
    const roundTargetByRound = new Map(match.roundHistory.map((r) => [r.round, r.target]));
    for (const move of match.moveHistory) {
      const target = roundTargetByRound.get(move.round);
      if (target !== undefined) {
        expect(move.counterAfter).toBeLessThanOrEqual(target);
      }
    }
  });

  it("is fully deterministic: the same seed reproduces an identical match trajectory", () => {
    function normalize(match: ActiveMatch) {
      return {
        ...match,
        startedAt: undefined,
        roundStartedAt: undefined,
        completedAt: undefined,
        moveHistory: match.moveHistory.map((m) => ({ ...m, id: undefined, timestamp: undefined })),
        roundHistory: match.roundHistory.map((r) => ({
          ...r,
          startedAt: undefined,
          endedAt: undefined,
        })),
      };
    }

    const runA = playFullMatch(4, createSeededRandomSource(2024));
    const runB = playFullMatch(4, createSeededRandomSource(2024));

    expect(normalize(runA.match)).toEqual(normalize(runB.match));
    expect(runA.events.map((e) => e.type)).toEqual(runB.events.map((e) => e.type));
  });
});
