import { describe, expect, it } from "vitest";
import { applyCommand, createMatch } from "./engine";
import { createSeededRandomSource } from "./random";
import { buildBotDecisionContext, chooseBotMove, type BotDecisionContext } from "./bot-strategy";
import type { BotDifficulty } from "./types";
import { makeTestPlayers, makeTestSettings } from "./test-helpers";

const DIFFICULTIES: BotDifficulty[] = ["random", "careful", "aggressive", "trickster", "balanced"];

function baseContext(overrides: Partial<BotDecisionContext> = {}): BotDecisionContext {
  return {
    counter: 10,
    targetRangeMin: 20,
    targetRangeMax: 40,
    maxMove: 3,
    currentLives: 1,
    nextPlayerLives: 1,
    mode: "classic",
    ...overrides,
  };
}

describe("buildBotDecisionContext", () => {
  it("never exposes the secret target, structurally or at runtime", () => {
    const match = createMatch("m1", makeTestSettings(), makeTestPlayers(2));
    const { state } = applyCommand(match, { type: "START_MATCH" }, createSeededRandomSource(1));
    const activeId = state.playerOrder[state.activePlayerIndex]!;

    const context = buildBotDecisionContext(state, activeId);
    expect(Object.keys(context)).not.toContain("target");
    // @ts-expect-error -- target is intentionally not part of BotDecisionContext
    expect(context.target).toBeUndefined();
  });

  it("throws for an unknown player id", () => {
    const match = createMatch("m1", makeTestSettings(), makeTestPlayers(2));
    const { state } = applyCommand(match, { type: "START_MATCH" }, createSeededRandomSource(1));
    expect(() => buildBotDecisionContext(state, "ghost")).toThrow(/Unknown player/);
  });

  it("reports the next active player's lives", () => {
    const match = createMatch(
      "m1",
      makeTestSettings({ mode: "multiLife", startingLives: 2 }),
      makeTestPlayers(2),
    );
    const { state } = applyCommand(match, { type: "START_MATCH" }, createSeededRandomSource(1));
    const activeId = state.playerOrder[state.activePlayerIndex]!;
    const context = buildBotDecisionContext(state, activeId);
    expect(context.nextPlayerLives).toBe(2);
  });

  it("uses the adaptive range when adaptiveTargetRange is enabled", () => {
    const match = createMatch(
      "m1",
      makeTestSettings({ adaptiveTargetRange: true, targetRange: { min: 1, max: 1 } }),
      makeTestPlayers(2),
    );
    const { state } = applyCommand(match, { type: "START_MATCH" }, createSeededRandomSource(1));
    const activeId = state.playerOrder[state.activePlayerIndex]!;
    const context = buildBotDecisionContext(state, activeId);
    // 2 active players -> adaptive range is {min:12, max:24}, not the configured {1,1}.
    expect(context.targetRangeMin).toBe(12);
    expect(context.targetRangeMax).toBe(24);
  });
});

describe("chooseBotMove", () => {
  it("always returns an integer within [1, maxMove] for every difficulty", () => {
    const random = createSeededRandomSource(1);
    for (const difficulty of DIFFICULTIES) {
      for (let i = 0; i < 100; i++) {
        const amount = chooseBotMove(baseContext(), difficulty, random);
        expect(Number.isInteger(amount)).toBe(true);
        expect(amount).toBeGreaterThanOrEqual(1);
        expect(amount).toBeLessThanOrEqual(3);
      }
    }
  });

  it("always returns 1 when maxMove is 1, regardless of difficulty", () => {
    const random = createSeededRandomSource(1);
    for (const difficulty of DIFFICULTIES) {
      expect(chooseBotMove(baseContext({ maxMove: 1 }), difficulty, random)).toBe(1);
    }
  });

  it("trickster only ever picks the extremes", () => {
    const random = createSeededRandomSource(1);
    for (let i = 0; i < 100; i++) {
      const amount = chooseBotMove(baseContext({ maxMove: 5 }), "trickster", random);
      expect([1, 5]).toContain(amount);
    }
  });

  it("careful bots pick smaller moves on average than aggressive bots under the same risk", () => {
    const random = createSeededRandomSource(1);
    const context = baseContext({
      counter: 10,
      targetRangeMin: 20,
      targetRangeMax: 40,
      maxMove: 5,
    });

    const carefulAverage =
      Array.from({ length: 200 }, () => chooseBotMove(context, "careful", random)).reduce(
        (a, b) => a + b,
        0,
      ) / 200;
    const aggressiveAverage =
      Array.from({ length: 200 }, () => chooseBotMove(context, "aggressive", random)).reduce(
        (a, b) => a + b,
        0,
      ) / 200;

    expect(carefulAverage).toBeLessThan(aggressiveAverage);
  });

  it("balanced bots shrink their moves as risk (proximity to the worst-case target) increases", () => {
    const random = createSeededRandomSource(1);
    const lowRisk = baseContext({
      counter: 21,
      targetRangeMin: 20,
      targetRangeMax: 40,
      maxMove: 5,
    });
    const highRisk = baseContext({
      counter: 39,
      targetRangeMin: 20,
      targetRangeMax: 40,
      maxMove: 5,
    });

    const lowRiskAverage =
      Array.from({ length: 100 }, () => chooseBotMove(lowRisk, "balanced", random)).reduce(
        (a, b) => a + b,
        0,
      ) / 100;
    const highRiskAverage =
      Array.from({ length: 100 }, () => chooseBotMove(highRisk, "balanced", random)).reduce(
        (a, b) => a + b,
        0,
      ) / 100;

    expect(highRiskAverage).toBeLessThan(lowRiskAverage);
  });
});
