import { describe, expect, it } from "vitest";
import { z } from "zod";
import { normalizePlayerName, playerDraftSchema, playerRosterSchema } from "./schemas";

type PlayerDraftInput = z.infer<typeof playerDraftSchema>;

function draft(overrides: Partial<PlayerDraftInput> = {}): PlayerDraftInput {
  return {
    id: "p1",
    name: "Maya",
    avatarId: "spike",
    colorId: "blue",
    isBot: false,
    ...overrides,
  };
}

describe("playerDraftSchema", () => {
  it("accepts a valid player draft", () => {
    expect(playerDraftSchema.safeParse(draft()).success).toBe(true);
  });

  it("rejects a blank name", () => {
    expect(playerDraftSchema.safeParse(draft({ name: "   " })).success).toBe(false);
  });

  it("rejects a name longer than 16 characters", () => {
    expect(playerDraftSchema.safeParse(draft({ name: "a".repeat(17) })).success).toBe(false);
  });

  it("accepts a name at exactly 16 characters", () => {
    expect(playerDraftSchema.safeParse(draft({ name: "a".repeat(16) })).success).toBe(true);
  });
});

describe("playerRosterSchema", () => {
  it("rejects fewer than 2 players", () => {
    expect(playerRosterSchema.safeParse([draft()]).success).toBe(false);
  });

  it("accepts exactly 2 players", () => {
    const roster = [draft({ id: "p1" }), draft({ id: "p2" })];
    expect(playerRosterSchema.safeParse(roster).success).toBe(true);
  });

  it("accepts 10 players", () => {
    const roster = Array.from({ length: 10 }, (_, i) => draft({ id: `p${i}` }));
    expect(playerRosterSchema.safeParse(roster).success).toBe(true);
  });

  it("rejects more than 10 players", () => {
    const roster = Array.from({ length: 11 }, (_, i) => draft({ id: `p${i}` }));
    expect(playerRosterSchema.safeParse(roster).success).toBe(false);
  });
});

describe("normalizePlayerName", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizePlayerName("  Maya  ", 0)).toBe("Maya");
  });

  it("generates a placeholder name for a blank entry", () => {
    expect(normalizePlayerName("", 2)).toBe("Player 3");
    expect(normalizePlayerName("   ", 5)).toBe("Player 6");
  });

  it("truncates overly long names", () => {
    expect(normalizePlayerName("a".repeat(30), 0)).toBe("a".repeat(16));
  });
});
