import { describe, expect, it } from "vitest";
import { createSeededRandomSource } from "./random";
import {
  applyMoveToCounter,
  calculateDangerLevel,
  findNextActivePlayerIndex,
  getActivePlayers,
  placementForElimination,
  shuffle,
} from "./rules";
import { makeTestPlayers } from "./test-helpers";

describe("getActivePlayers", () => {
  it("excludes eliminated players", () => {
    const players = makeTestPlayers(3);
    players[1]!.isEliminated = true;
    expect(getActivePlayers(players).map((p) => p.id)).toEqual(["p1", "p3"]);
  });
});

describe("findNextActivePlayerIndex", () => {
  it("advances to the next player in order", () => {
    const players = makeTestPlayers(3);
    const order = players.map((p) => p.id);
    expect(findNextActivePlayerIndex(order, players, 0)).toBe(1);
  });

  it("wraps around to the start of the order", () => {
    const players = makeTestPlayers(3);
    const order = players.map((p) => p.id);
    expect(findNextActivePlayerIndex(order, players, 2)).toBe(0);
  });

  it("skips eliminated players", () => {
    const players = makeTestPlayers(4);
    players[1]!.isEliminated = true;
    const order = players.map((p) => p.id);
    expect(findNextActivePlayerIndex(order, players, 0)).toBe(2);
  });

  it("throws when no active players remain", () => {
    const players = makeTestPlayers(2);
    players.forEach((p) => (p.isEliminated = true));
    const order = players.map((p) => p.id);
    expect(() => findNextActivePlayerIndex(order, players, 0)).toThrow();
  });
});

describe("applyMoveToCounter", () => {
  it("applies the full move when the target is not reached", () => {
    const result = applyMoveToCounter(10, 3, 40);
    expect(result).toEqual({ counterAfter: 13, appliedAmount: 3, reachedTarget: false });
  });

  it("stops exactly at the target and never overshoots it (plan §6.4 example)", () => {
    // Counter 18, target 20, player selects +3 -> must stop at 20, not continue to 21.
    const result = applyMoveToCounter(18, 3, 20);
    expect(result.counterAfter).toBe(20);
    expect(result.appliedAmount).toBe(2);
    expect(result.reachedTarget).toBe(true);
  });

  it("reports reachedTarget when the move lands exactly on the target with no room to spare", () => {
    const result = applyMoveToCounter(19, 1, 20);
    expect(result).toEqual({ counterAfter: 20, appliedAmount: 1, reachedTarget: true });
  });
});

describe("placementForElimination", () => {
  it("assigns the placement equal to the active count before elimination", () => {
    expect(placementForElimination(6)).toBe(6);
    expect(placementForElimination(2)).toBe(2);
  });
});

describe("calculateDangerLevel", () => {
  it("is critical when very close to the target", () => {
    expect(calculateDangerLevel(38, 40, 0)).toBe("critical");
  });

  it("is danger when moderately close", () => {
    expect(calculateDangerLevel(35, 40, 0)).toBe("danger");
  });

  it("is caution when somewhat close", () => {
    expect(calculateDangerLevel(32, 40, 0)).toBe("caution");
  });

  it("is safe when far away", () => {
    expect(calculateDangerLevel(10, 40, 0)).toBe("safe");
  });

  it("shifts buckets with the uncertainty jitter, preventing exact reverse-engineering", () => {
    // Baseline: remaining = 40 - 33 = 7 -> caution.
    expect(calculateDangerLevel(33, 40, 0)).toBe("caution");
    // Positive jitter increases apparent remaining distance -> safe.
    expect(calculateDangerLevel(33, 40, 3)).toBe("safe");
    // Negative jitter decreases apparent remaining distance -> danger.
    expect(calculateDangerLevel(33, 40, -3)).toBe("danger");
  });
});

describe("shuffle", () => {
  it("returns a permutation containing exactly the same elements", () => {
    const random = createSeededRandomSource(5);
    const input = ["a", "b", "c", "d", "e"];
    const result = shuffle(input, random);
    expect(result).toHaveLength(input.length);
    expect([...result].sort()).toEqual([...input].sort());
  });

  it("does not mutate the input array", () => {
    const random = createSeededRandomSource(5);
    const input = ["a", "b", "c"];
    shuffle(input, random);
    expect(input).toEqual(["a", "b", "c"]);
  });

  it("is deterministic for a given seed", () => {
    const input = ["a", "b", "c", "d", "e", "f"];
    const resultA = shuffle(input, createSeededRandomSource(123));
    const resultB = shuffle(input, createSeededRandomSource(123));
    expect(resultA).toEqual(resultB);
  });
});
