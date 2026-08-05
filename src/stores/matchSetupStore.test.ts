import { beforeEach, describe, expect, it } from "vitest";
import { useMatchSetupStore } from "./matchSetupStore";
import { AVATARS } from "@/config/avatars";
import { PLAYER_COLORS } from "@/config/playerColors";
import { MATCH_PRESETS } from "@/config/matchPresets";

beforeEach(() => {
  localStorage.clear();
  useMatchSetupStore.getState().resetToDefaults();
});

describe("useMatchSetupStore", () => {
  it("starts with two default players", () => {
    const { players } = useMatchSetupStore.getState();
    expect(players).toHaveLength(2);
    expect(players[0]?.name).toBe("Player 1");
    expect(players[1]?.name).toBe("Player 2");
  });

  it("addPlayer appends a new player with a distinct id", () => {
    useMatchSetupStore.getState().addPlayer();
    const { players } = useMatchSetupStore.getState();
    expect(players).toHaveLength(3);
    expect(new Set(players.map((p) => p.id)).size).toBe(3);
  });

  it("addBot appends a bot player with the requested difficulty", () => {
    useMatchSetupStore.getState().addBot("aggressive");
    const { players } = useMatchSetupStore.getState();
    const bot = players[players.length - 1];
    expect(bot?.isBot).toBe(true);
    expect(bot?.botDifficulty).toBe("aggressive");
  });

  it("addBot falls back to the match's configured default bot personality", () => {
    useMatchSetupStore.getState().updateSettings({ botDifficulty: "trickster" });
    useMatchSetupStore.getState().addBot();
    const { players } = useMatchSetupStore.getState();
    expect(players[players.length - 1]?.botDifficulty).toBe("trickster");
  });

  it("removePlayer removes exactly the targeted player", () => {
    const { players } = useMatchSetupStore.getState();
    const targetId = players[0]!.id;
    useMatchSetupStore.getState().removePlayer(targetId);
    const after = useMatchSetupStore.getState().players;
    expect(after).toHaveLength(1);
    expect(after.find((p) => p.id === targetId)).toBeUndefined();
  });

  it("updatePlayer merges partial updates without touching the id", () => {
    const { players } = useMatchSetupStore.getState();
    const targetId = players[0]!.id;
    useMatchSetupStore.getState().updatePlayer(targetId, { name: "Renamed" });
    const updated = useMatchSetupStore.getState().players.find((p) => p.id === targetId);
    expect(updated?.name).toBe("Renamed");
    expect(updated?.id).toBe(targetId);
  });

  it("duplicatePlayer copies avatar/color but assigns a new id", () => {
    const { players } = useMatchSetupStore.getState();
    const source = players[0]!;
    useMatchSetupStore.getState().duplicatePlayer(source.id);
    const all = useMatchSetupStore.getState().players;
    expect(all).toHaveLength(3);
    const duplicate = all[all.length - 1]!;
    expect(duplicate.id).not.toBe(source.id);
    expect(duplicate.avatarId).toBe(source.avatarId);
    expect(duplicate.colorId).toBe(source.colorId);
  });

  it("reorderPlayers moves a player to a new position", () => {
    const before = useMatchSetupStore.getState().players;
    const firstId = before[0]!.id;
    useMatchSetupStore.getState().reorderPlayers(0, 1);
    const after = useMatchSetupStore.getState().players;
    expect(after[1]?.id).toBe(firstId);
  });

  it("reorderPlayers ignores out-of-range indices", () => {
    const before = useMatchSetupStore.getState().players;
    useMatchSetupStore.getState().reorderPlayers(0, 99);
    const after = useMatchSetupStore.getState().players;
    expect(after).toEqual(before);
  });

  it("randomizeAll assigns valid avatar and color ids to every player", () => {
    useMatchSetupStore.getState().randomizeAll();
    const { players } = useMatchSetupStore.getState();
    const avatarIds = new Set(AVATARS.map((a) => a.id));
    const colorIds = new Set(PLAYER_COLORS.map((c) => c.id));
    for (const player of players) {
      expect(avatarIds.has(player.avatarId)).toBe(true);
      expect(colorIds.has(player.colorId)).toBe(true);
    }
  });

  it("updateSettings merges partial settings and marks the preset as custom", () => {
    useMatchSetupStore.getState().applyPreset("quick");
    useMatchSetupStore.getState().updateSettings({ maxMove: 5 });
    const state = useMatchSetupStore.getState();
    expect(state.settings.maxMove).toBe(5);
    expect(state.selectedPresetId).toBe("custom");
  });

  it("applyPreset sets both the settings and the selected preset id", () => {
    const suddenDeath = MATCH_PRESETS.find((p) => p.id === "suddenDeath")!;
    useMatchSetupStore.getState().applyPreset("suddenDeath");
    const state = useMatchSetupStore.getState();
    expect(state.settings).toEqual(suddenDeath.settings);
    expect(state.selectedPresetId).toBe("suddenDeath");
  });

  it("resetToDefaults restores the initial two-player setup", () => {
    useMatchSetupStore.getState().addPlayer();
    useMatchSetupStore.getState().updateSettings({ maxMove: 6 });
    useMatchSetupStore.getState().resetToDefaults();
    const state = useMatchSetupStore.getState();
    expect(state.players).toHaveLength(2);
    expect(state.settings.maxMove).toBe(3);
  });
});
