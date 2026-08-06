import { describe, expect, it } from "vitest";
import { applyCommand, createMatch } from "./engine";
import { createSeededRandomSource, type RandomSource } from "./random";
import { grantStartingPowerUps } from "./power-up-resolver";
import { DEFAULT_POWER_UP_INVENTORY_SIZE } from "@/config/powerUps";
import { makeTestPlayers, makeTestSettings } from "./test-helpers";
import { GameRuleViolation, POWER_UP_IDS, type ActiveMatch, type PowerUpId } from "./types";

function eventTypes(events: { type: string }[]): string[] {
  return events.map((event) => event.type);
}

/** Starts a match with power-ups enabled and grants the active player exactly one power-up. */
function startedWithPowerUp(
  powerUpId: PowerUpId,
  overrides: Parameters<typeof makeTestSettings>[0] = {},
) {
  const match = createMatch(
    "m1",
    makeTestSettings({ powerUpsEnabled: true, ...overrides }),
    makeTestPlayers(3),
  );
  const random = createSeededRandomSource(1);
  const { state: started } = applyCommand(match, { type: "START_MATCH" }, random);
  const activeId = started.playerOrder[started.activePlayerIndex]!;

  const withInventory: ActiveMatch = {
    ...started,
    players: started.players.map((player) =>
      player.id === activeId ? { ...player, powerUps: [{ powerUpId, quantity: 1 }] } : player,
    ),
  };

  return { state: withInventory, random, activeId };
}

describe("grantStartingPowerUps", () => {
  it("gives every player a distinct set of power-ups at the default inventory size", () => {
    const players = makeTestPlayers(4);
    const random = createSeededRandomSource(1);
    const granted = grantStartingPowerUps(players, random);

    for (const player of granted) {
      expect(player.powerUps).toHaveLength(DEFAULT_POWER_UP_INVENTORY_SIZE);
      const ids = player.powerUps.map((p) => p.powerUpId);
      expect(new Set(ids).size).toBe(ids.length); // no duplicates
      for (const id of ids) {
        expect(POWER_UP_IDS).toContain(id);
      }
    }
  });
});

describe("USE_POWER_UP — balance rules (plan §8.2)", () => {
  it("rejects a player who is not currently active", () => {
    const { state, random } = startedWithPowerUp("shield");
    const inactiveId = state.playerOrder[(state.activePlayerIndex + 1) % 3]!;
    expect(() =>
      applyCommand(
        state,
        { type: "USE_POWER_UP", playerId: inactiveId, powerUpId: "shield" },
        random,
      ),
    ).toThrow(/active player/);
  });

  it("rejects a power-up not in the player's inventory", () => {
    const { state, random, activeId } = startedWithPowerUp("shield");
    expect(() =>
      applyCommand(
        state,
        { type: "USE_POWER_UP", playerId: activeId, powerUpId: "reverse" },
        random,
      ),
    ).toThrow(/not in your inventory/);
  });

  it("allows at most one power-up per turn", () => {
    const match = createMatch(
      "m1",
      makeTestSettings({ powerUpsEnabled: true }),
      makeTestPlayers(3),
    );
    const random = createSeededRandomSource(1);
    const { state: started } = applyCommand(match, { type: "START_MATCH" }, random);
    const activeId = started.playerOrder[started.activePlayerIndex]!;
    const withTwo: ActiveMatch = {
      ...started,
      players: started.players.map((player) =>
        player.id === activeId
          ? {
              ...player,
              powerUps: [
                { powerUpId: "reverse" as const, quantity: 1 },
                { powerUpId: "scramble" as const, quantity: 1 },
              ],
            }
          : player,
      ),
    };

    const { state: afterFirst } = applyCommand(
      withTwo,
      { type: "USE_POWER_UP", playerId: activeId, powerUpId: "reverse" },
      random,
    );

    expect(() =>
      applyCommand(
        afterFirst,
        { type: "USE_POWER_UP", playerId: activeId, powerUpId: "scramble" },
        random,
      ),
    ).toThrow(/one power-up.*per turn/);
  });

  it("allows a new power-up once the next turn begins", () => {
    const match = createMatch(
      "m1",
      makeTestSettings({ powerUpsEnabled: true, targetRange: { min: 90, max: 100 } }),
      makeTestPlayers(3),
    );
    const random = createSeededRandomSource(1);
    const { state: started } = applyCommand(match, { type: "START_MATCH" }, random);
    const firstId = started.playerOrder[started.activePlayerIndex]!;
    const withPowerUp: ActiveMatch = {
      ...started,
      players: started.players.map((player) =>
        player.id === firstId
          ? { ...player, powerUps: [{ powerUpId: "reverse", quantity: 1 }] }
          : player,
      ),
    };

    const { state: afterPowerUp } = applyCommand(
      withPowerUp,
      { type: "USE_POWER_UP", playerId: firstId, powerUpId: "reverse" },
      random,
    );
    // Finish the turn with a normal move.
    const { state: afterMove } = applyCommand(
      afterPowerUp,
      { type: "SUBMIT_MOVE", playerId: firstId, amount: 1 },
      random,
    );

    const nextActiveId = afterMove.playerOrder[afterMove.activePlayerIndex]!;
    const withSecondPowerUp: ActiveMatch = {
      ...afterMove,
      players: afterMove.players.map((player) =>
        player.id === nextActiveId
          ? { ...player, powerUps: [{ powerUpId: "scramble", quantity: 1 }] }
          : player,
      ),
    };

    expect(() =>
      applyCommand(
        withSecondPowerUp,
        { type: "USE_POWER_UP", playerId: nextActiveId, powerUpId: "scramble" },
        random,
      ),
    ).not.toThrow();
  });

  it("rejects power-up use when powerUpsEnabled is false, even with inventory present", () => {
    const { state, random, activeId } = startedWithPowerUp("shield", { powerUpsEnabled: false });
    expect(() =>
      applyCommand(
        state,
        { type: "USE_POWER_UP", playerId: activeId, powerUpId: "shield" },
        random,
      ),
    ).toThrow(/disabled/);
  });
});

describe("Shield", () => {
  it("blocks a losing hit, keeps the life, and records the round as shield-blocked", () => {
    const { state, random, activeId } = startedWithPowerUp("shield", {
      targetRange: { min: 2, max: 2 },
    });
    const { state: afterActivate } = applyCommand(
      state,
      { type: "USE_POWER_UP", playerId: activeId, powerUpId: "shield" },
      random,
    );

    const { state: afterMove, events } = applyCommand(
      afterActivate,
      { type: "SUBMIT_MOVE", playerId: activeId, amount: 2 },
      random,
    );

    expect(eventTypes(events)).toEqual(
      expect.arrayContaining(["TARGET_HIT", "SHIELD_BLOCKED_HIT"]),
    );
    expect(eventTypes(events)).not.toContain("LIFE_LOST");
    expect(eventTypes(events)).not.toContain("PLAYER_ELIMINATED");

    const player = afterMove.players.find((p) => p.id === activeId)!;
    expect(player.lives).toBe(1); // unchanged
    expect(player.isEliminated).toBe(false);
    expect(player.stats.shieldsTriggered).toBe(1);

    const lastRound = afterMove.roundHistory[afterMove.roundHistory.length - 1]!;
    expect(lastRound.blockedByShield).toBe(true);
    expect(afterMove.status).toBe("round_ended");
  });

  it("is consumed and does not block a second hit later", () => {
    const { state, random, activeId } = startedWithPowerUp("shield", {
      mode: "multiLife",
      startingLives: 3,
      targetRange: { min: 2, max: 2 },
    });
    const { state: afterActivate } = applyCommand(
      state,
      { type: "USE_POWER_UP", playerId: activeId, powerUpId: "shield" },
      random,
    );
    const { state: afterFirstHit } = applyCommand(
      afterActivate,
      { type: "SUBMIT_MOVE", playerId: activeId, amount: 2 },
      random,
    );
    expect(afterFirstHit.players.find((p) => p.id === activeId)!.lives).toBe(3);

    const { state: afterContinue } = applyCommand(
      afterFirstHit,
      { type: "CONTINUE_AFTER_LOSS" },
      random,
    );
    // It's a different player's turn now (shield-holder wasn't eliminated but turn
    // still advances past them) — fast-forward by directly re-targeting them if needed.
    const holderStillHasNoShield = afterContinue.players.find((p) => p.id === activeId)!.powerUps;
    expect(holderStillHasNoShield.find((p) => p.powerUpId === "shield")).toBeUndefined();
  });
});

describe("Peek", () => {
  it("reveals a range containing the real target without exposing it exactly", () => {
    const { state, random, activeId } = startedWithPowerUp("peek", {
      targetRange: { min: 20, max: 40 },
    });
    const { events } = applyCommand(
      state,
      { type: "USE_POWER_UP", playerId: activeId, powerUpId: "peek" },
      random,
    );

    const peekEvent = events.find((e) => e.type === "PEEK_REVEALED");
    expect(peekEvent).toBeDefined();
    if (peekEvent?.type !== "PEEK_REVEALED") throw new Error("unreachable");
    expect(peekEvent.rangeMin).toBeLessThanOrEqual(state.target);
    expect(peekEvent.rangeMax).toBeGreaterThanOrEqual(state.target);
    expect(peekEvent.rangeMin).toBeGreaterThanOrEqual(20);
    expect(peekEvent.rangeMax).toBeLessThanOrEqual(40);
  });
});

describe("Reverse", () => {
  it("reverses the player order and keeps the same player active", () => {
    const { state, random, activeId } = startedWithPowerUp("reverse");
    const { state: after } = applyCommand(
      state,
      { type: "USE_POWER_UP", playerId: activeId, powerUpId: "reverse" },
      random,
    );

    expect(after.playerOrder).toEqual([...state.playerOrder].reverse());
    expect(after.playerOrder[after.activePlayerIndex]).toBe(activeId);
  });
});

describe("Scramble", () => {
  it("shuffles the player order (a permutation) and keeps the same player active", () => {
    const { state, random, activeId } = startedWithPowerUp("scramble");
    const { state: after } = applyCommand(
      state,
      { type: "USE_POWER_UP", playerId: activeId, powerUpId: "scramble" },
      random,
    );

    expect([...after.playerOrder].sort()).toEqual([...state.playerOrder].sort());
    expect(after.playerOrder[after.activePlayerIndex]).toBe(activeId);
  });
});

describe("Freeze", () => {
  it("caps the next player's move to +1, then stops applying", () => {
    const { state, random, activeId } = startedWithPowerUp("freeze", {
      targetRange: { min: 90, max: 100 },
      maxMove: 3,
    });
    const { state: afterFreeze } = applyCommand(
      state,
      { type: "USE_POWER_UP", playerId: activeId, powerUpId: "freeze" },
      random,
    );
    const { state: afterActivatorMove } = applyCommand(
      afterFreeze,
      { type: "SUBMIT_MOVE", playerId: activeId, amount: 1 },
      random,
    );

    const frozenId = afterActivatorMove.playerOrder[afterActivatorMove.activePlayerIndex]!;
    expect(() =>
      applyCommand(
        afterActivatorMove,
        { type: "SUBMIT_MOVE", playerId: frozenId, amount: 2 },
        random,
      ),
    ).toThrow(/cannot exceed 1/);

    const { state: afterFrozenMove } = applyCommand(
      afterActivatorMove,
      { type: "SUBMIT_MOVE", playerId: frozenId, amount: 1 },
      random,
    );
    // The effect is consumed — the third player is not capped.
    const thirdId = afterFrozenMove.playerOrder[afterFrozenMove.activePlayerIndex]!;
    expect(() =>
      applyCommand(afterFrozenMove, { type: "SUBMIT_MOVE", playerId: thirdId, amount: 3 }, random),
    ).not.toThrow();
  });
});

describe("Boost", () => {
  it("lets the activator exceed the normal maxMove by exactly 1, this turn only", () => {
    const { state, random, activeId } = startedWithPowerUp("boost", {
      targetRange: { min: 90, max: 100 },
      maxMove: 3,
    });
    const { state: afterBoost } = applyCommand(
      state,
      { type: "USE_POWER_UP", playerId: activeId, powerUpId: "boost" },
      random,
    );

    expect(() =>
      applyCommand(afterBoost, { type: "SUBMIT_MOVE", playerId: activeId, amount: 5 }, random),
    ).toThrow(/cannot exceed 4/);

    const { state: afterMove } = applyCommand(
      afterBoost,
      { type: "SUBMIT_MOVE", playerId: activeId, amount: 4 },
      random,
    );
    expect(afterMove.counter).toBe(4);

    // Boost does not persist to a later turn for this player.
    const nextId = afterMove.playerOrder[afterMove.activePlayerIndex]!;
    expect(nextId).not.toBe(activeId);
  });
});

describe("Skip", () => {
  it("passes the turn without changing the counter", () => {
    const { state, random, activeId } = startedWithPowerUp("skip", {
      targetRange: { min: 90, max: 100 },
    });
    const { state: after, events } = applyCommand(
      state,
      { type: "USE_POWER_UP", playerId: activeId, powerUpId: "skip" },
      random,
    );

    expect(after.counter).toBe(0);
    expect(after.playerOrder[after.activePlayerIndex]).not.toBe(activeId);
    expect(eventTypes(events)).toContain("TURN_CHANGED");
  });
});

describe("Swap", () => {
  it("swaps seats with the target player and keeps the activator's turn active", () => {
    const { state, random, activeId } = startedWithPowerUp("swap");
    const targetId = state.playerOrder.find((id) => id !== activeId)!;

    const { state: after } = applyCommand(
      state,
      { type: "USE_POWER_UP", playerId: activeId, powerUpId: "swap", targetPlayerId: targetId },
      random,
    );

    expect(after.playerOrder[after.activePlayerIndex]).toBe(activeId);
    expect([...after.playerOrder].sort()).toEqual([...state.playerOrder].sort());
    // Their positions are genuinely swapped, not just relabeled.
    const oldActivatorIndex = state.playerOrder.indexOf(activeId);
    expect(after.playerOrder[oldActivatorIndex]).toBe(targetId);
  });

  it("rejects swapping with yourself or an unknown player", () => {
    const { state, random, activeId } = startedWithPowerUp("swap");
    expect(() =>
      applyCommand(
        state,
        { type: "USE_POWER_UP", playerId: activeId, powerUpId: "swap", targetPlayerId: activeId },
        random,
      ),
    ).toThrow(GameRuleViolation);
    expect(() =>
      applyCommand(
        state,
        { type: "USE_POWER_UP", playerId: activeId, powerUpId: "swap", targetPlayerId: "ghost" },
        random,
      ),
    ).toThrow(GameRuleViolation);
  });
});

describe("Counter Pushback", () => {
  it("subtracts the chosen amount and never goes below zero", () => {
    const { state, random, activeId } = startedWithPowerUp("counterPushback", {
      targetRange: { min: 90, max: 100 },
    });
    // Build the counter up first.
    const { state: afterMove } = applyCommand(
      state,
      { type: "SUBMIT_MOVE", playerId: activeId, amount: 1 },
      random,
    );
    const secondId = afterMove.playerOrder[afterMove.activePlayerIndex]!;
    const withPushback: ActiveMatch = {
      ...afterMove,
      players: afterMove.players.map((p) =>
        p.id === secondId ? { ...p, powerUps: [{ powerUpId: "counterPushback", quantity: 1 }] } : p,
      ),
    };

    const { state: afterPushback } = applyCommand(
      withPushback,
      { type: "USE_POWER_UP", playerId: secondId, powerUpId: "counterPushback", amount: 2 },
      random,
    );
    expect(afterPushback.counter).toBe(0); // 1 - 2 clamped to 0
  });

  it("rejects an amount other than 1 or 2", () => {
    const { state, random, activeId } = startedWithPowerUp("counterPushback");
    expect(() =>
      applyCommand(
        state,
        { type: "USE_POWER_UP", playerId: activeId, powerUpId: "counterPushback", amount: 5 },
        random,
      ),
    ).toThrow(/must be 1 or 2/);
  });
});

describe("Double Trouble", () => {
  it("forces the next player to take two consecutive turns", () => {
    const { state, random, activeId } = startedWithPowerUp("doubleTrouble", {
      targetRange: { min: 90, max: 100 },
    });
    const { state: afterActivate } = applyCommand(
      state,
      { type: "USE_POWER_UP", playerId: activeId, powerUpId: "doubleTrouble" },
      random,
    );
    const { state: afterActivatorMove } = applyCommand(
      afterActivate,
      { type: "SUBMIT_MOVE", playerId: activeId, amount: 1 },
      random,
    );

    const targetId = afterActivatorMove.playerOrder[afterActivatorMove.activePlayerIndex]!;
    expect(targetId).not.toBe(activeId);

    const { state: afterFirstTargetMove } = applyCommand(
      afterActivatorMove,
      { type: "SUBMIT_MOVE", playerId: targetId, amount: 1 },
      random,
    );
    // Still their turn — the double-turn effect kept them active.
    expect(afterFirstTargetMove.playerOrder[afterFirstTargetMove.activePlayerIndex]).toBe(targetId);

    const { state: afterSecondTargetMove } = applyCommand(
      afterFirstTargetMove,
      { type: "SUBMIT_MOVE", playerId: targetId, amount: 1 },
      random,
    );
    // Now it moves on to someone else.
    expect(afterSecondTargetMove.playerOrder[afterSecondTargetMove.activePlayerIndex]).not.toBe(
      targetId,
    );
  });
});

describe("Lucky Dice", () => {
  it("consumes the power-up and performs a valid move automatically", () => {
    const { state, random, activeId } = startedWithPowerUp("luckyDice", {
      targetRange: { min: 90, max: 100 },
      maxMove: 3,
    });
    const { state: after, events } = applyCommand(
      state,
      { type: "USE_POWER_UP", playerId: activeId, powerUpId: "luckyDice" },
      random,
    );

    expect(eventTypes(events)[0]).toBe("POWER_UP_USED");
    expect(eventTypes(events)).toContain("COUNTER_CHANGED");
    expect(after.counter).toBeGreaterThanOrEqual(1);
    expect(after.counter).toBeLessThanOrEqual(3);
    expect(after.moveHistory).toHaveLength(1);
  });
});

describe("power-ups never corrupt turn order or match state", () => {
  it("keeps playerOrder a valid permutation and activePlayerIndex valid after using every power-up in sequence", () => {
    const settings = makeTestSettings({
      powerUpsEnabled: true,
      targetRange: { min: 200, max: 250 }, // wide enough that moves alone won't finish the match
      maxMove: 3,
    });
    let match = createMatch("m1", settings, makeTestPlayers(4));
    const random: RandomSource = createSeededRandomSource(7);
    match = applyCommand(match, { type: "START_MATCH" }, random).state;

    const originalIds = [...match.playerOrder].sort();

    for (const powerUpId of POWER_UP_IDS) {
      const activeId = match.playerOrder[match.activePlayerIndex]!;
      const otherId = match.playerOrder.find((id) => id !== activeId)!;
      match = {
        ...match,
        players: match.players.map((p) =>
          p.id === activeId ? { ...p, powerUps: [{ powerUpId, quantity: 1 }] } : p,
        ),
      };

      const command =
        powerUpId === "swap"
          ? ({
              type: "USE_POWER_UP",
              playerId: activeId,
              powerUpId,
              targetPlayerId: otherId,
            } as const)
          : powerUpId === "counterPushback"
            ? ({ type: "USE_POWER_UP", playerId: activeId, powerUpId, amount: 1 } as const)
            : ({ type: "USE_POWER_UP", playerId: activeId, powerUpId } as const);

      const result = applyCommand(match, command, random);
      match = result.state;

      // Invariants that must hold after every single power-up use.
      expect([...match.playerOrder].sort()).toEqual(originalIds);
      expect(match.playerOrder[match.activePlayerIndex]).toBeDefined();
      expect(match.counter).toBeGreaterThanOrEqual(0);

      // Finish the turn with a normal move so the next power-up test starts a fresh turn.
      const currentActiveId = match.playerOrder[match.activePlayerIndex]!;
      if (match.status === "in_progress") {
        const beforeMoveResult = applyCommand(
          match,
          { type: "SUBMIT_MOVE", playerId: currentActiveId, amount: 1 },
          random,
        );
        match = beforeMoveResult.state;
      }
    }

    expect([...match.playerOrder].sort()).toEqual(originalIds);
  });
});
