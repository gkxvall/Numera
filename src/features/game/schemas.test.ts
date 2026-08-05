import { describe, expect, it } from "vitest";
import {
  matchConfigSchema,
  matchSettingsSchema,
  targetRangeSchema,
  type MatchSettingsInput,
} from "./schemas";

function settings(overrides: Partial<MatchSettingsInput> = {}): MatchSettingsInput {
  return {
    mode: "classic",
    startingLives: 1,
    targetRange: { min: 20, max: 40 },
    maxMove: 3,
    turnTimerSeconds: 10,
    timeoutBehavior: "applyPlusOne",
    randomizePlayerOrder: true,
    dangerIndicatorEnabled: true,
    powerUpsEnabled: false,
    specialEventsEnabled: false,
    adaptiveTargetRange: false,
    botDifficulty: "balanced",
    ...overrides,
  };
}

describe("targetRangeSchema", () => {
  it("accepts a valid ascending range", () => {
    expect(targetRangeSchema.safeParse({ min: 20, max: 40 }).success).toBe(true);
  });

  it("rejects a range where max is not greater than min", () => {
    expect(targetRangeSchema.safeParse({ min: 40, max: 40 }).success).toBe(false);
    expect(targetRangeSchema.safeParse({ min: 40, max: 20 }).success).toBe(false);
  });
});

describe("matchSettingsSchema", () => {
  it("accepts the plan's default settings (§6.2)", () => {
    const result = matchSettingsSchema.safeParse(settings());
    expect(result.success).toBe(true);
  });

  it("accepts every currently-implemented game mode", () => {
    for (const mode of ["classic", "multiLife", "suddenDeath"] as const) {
      expect(matchSettingsSchema.safeParse(settings({ mode })).success).toBe(true);
    }
  });

  it("rejects a game mode that isn't implemented yet", () => {
    const result = matchSettingsSchema.safeParse(settings({ mode: "chaos" }));
    expect(result.success).toBe(false);
  });

  it("allows a null turn timer (disabled)", () => {
    expect(matchSettingsSchema.safeParse(settings({ turnTimerSeconds: null })).success).toBe(true);
  });

  it("rejects zero starting lives", () => {
    expect(matchSettingsSchema.safeParse(settings({ startingLives: 0 })).success).toBe(false);
  });

  it("rejects more than 5 starting lives", () => {
    expect(matchSettingsSchema.safeParse(settings({ startingLives: 6 })).success).toBe(false);
  });
});

describe("matchConfigSchema", () => {
  it("rejects a config with only 1 player", () => {
    const result = matchConfigSchema.safeParse({
      players: [{ id: "p1", name: "Solo", avatarId: "spike", colorId: "blue", isBot: false }],
      settings: settings(),
    });
    expect(result.success).toBe(false);
  });

  it("accepts a fully valid config", () => {
    const result = matchConfigSchema.safeParse({
      matchName: "Friday Night",
      players: [
        { id: "p1", name: "Maya", avatarId: "spike", colorId: "blue", isBot: false },
        { id: "p2", name: "Theo", avatarId: "grin", colorId: "red", isBot: false },
      ],
      settings: settings(),
    });
    expect(result.success).toBe(true);
  });
});
