import { describe, expect, it } from "vitest";
import { createSeededRandomSource } from "./random";
import { generateTarget, getAdaptiveTargetRange } from "./target-generator";

describe("generateTarget", () => {
  it("stays within the configured range", () => {
    const random = createSeededRandomSource(1);
    for (let i = 0; i < 200; i++) {
      const target = generateTarget({ min: 20, max: 40 }, 0, [], random);
      expect(target).toBeGreaterThanOrEqual(20);
      expect(target).toBeLessThanOrEqual(40);
    }
  });

  it("is always greater than the starting counter", () => {
    const random = createSeededRandomSource(2);
    for (let i = 0; i < 100; i++) {
      const startingCounter = 15;
      const target = generateTarget({ min: 5, max: 25 }, startingCounter, [], random);
      expect(target).toBeGreaterThan(startingCounter);
    }
  });

  it("never repeats the same target a third round in a row when the range allows it", () => {
    const random = createSeededRandomSource(3);
    let recent: number[] = [];
    for (let round = 0; round < 500; round++) {
      const target = generateTarget({ min: 20, max: 40 }, 0, recent, random);
      if (recent.length === 2) {
        const isThirdRepeat = recent[0] === target && recent[1] === target;
        expect(isThirdRepeat).toBe(false);
      }
      recent = [...recent, target].slice(-2);
    }
  });

  it("gives up gracefully and still returns a value when the range has only one possible target", () => {
    const random = createSeededRandomSource(4);
    const target = generateTarget({ min: 20, max: 20 }, 0, [20, 20], random);
    expect(target).toBe(20);
  });
});

describe("getAdaptiveTargetRange", () => {
  it("matches the suggested ranges from the plan for each player-count bracket", () => {
    expect(getAdaptiveTargetRange(2)).toEqual({ min: 12, max: 24 });
    expect(getAdaptiveTargetRange(3)).toEqual({ min: 16, max: 32 });
    expect(getAdaptiveTargetRange(4)).toEqual({ min: 20, max: 40 });
    expect(getAdaptiveTargetRange(5)).toEqual({ min: 25, max: 50 });
    expect(getAdaptiveTargetRange(6)).toEqual({ min: 25, max: 50 });
    expect(getAdaptiveTargetRange(7)).toEqual({ min: 30, max: 65 });
    expect(getAdaptiveTargetRange(8)).toEqual({ min: 30, max: 65 });
    expect(getAdaptiveTargetRange(9)).toEqual({ min: 40, max: 80 });
    expect(getAdaptiveTargetRange(10)).toEqual({ min: 40, max: 80 });
  });

  it("falls back to the widest range for player counts above 10", () => {
    expect(getAdaptiveTargetRange(15)).toEqual({ min: 40, max: 80 });
  });
});
