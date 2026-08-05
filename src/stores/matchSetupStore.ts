import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AVATARS, DEFAULT_AVATAR_ID } from "@/config/avatars";
import { DEFAULT_PLAYER_COLOR_ID, PLAYER_COLORS } from "@/config/playerColors";
import { DEFAULT_MATCH_SETTINGS, DEFAULT_PRESET_ID, getMatchPreset } from "@/config/matchPresets";
import { normalizePlayerName, type PlayerDraft } from "@/features/players/schemas";
import type { BotDifficulty, MatchSettings } from "@/game-engine/types";

function createId(): string {
  return crypto.randomUUID();
}

function nextAvatarId(index: number): string {
  return AVATARS[index % AVATARS.length]?.id ?? DEFAULT_AVATAR_ID;
}

function nextColorId(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length]?.id ?? DEFAULT_PLAYER_COLOR_ID;
}

function createDefaultPlayer(index: number): PlayerDraft {
  return {
    id: createId(),
    name: `Player ${index + 1}`,
    avatarId: nextAvatarId(index),
    colorId: nextColorId(index),
    isBot: false,
  };
}

export interface MatchSetupState {
  matchName: string;
  players: PlayerDraft[];
  settings: MatchSettings;
  selectedPresetId: string;

  setMatchName: (name: string) => void;
  addPlayer: () => void;
  addBot: (difficulty?: BotDifficulty) => void;
  removePlayer: (id: string) => void;
  updatePlayer: (id: string, updates: Partial<Omit<PlayerDraft, "id">>) => void;
  duplicatePlayer: (id: string) => void;
  reorderPlayers: (fromIndex: number, toIndex: number) => void;
  randomizeAll: () => void;
  updateSettings: (updates: Partial<MatchSettings>) => void;
  applyPreset: (presetId: string) => void;
  resetToDefaults: () => void;
}

function initialPlayers(): PlayerDraft[] {
  return [createDefaultPlayer(0), createDefaultPlayer(1)];
}

export const useMatchSetupStore = create<MatchSetupState>()(
  persist(
    (set) => ({
      matchName: "",
      players: initialPlayers(),
      settings: DEFAULT_MATCH_SETTINGS,
      selectedPresetId: DEFAULT_PRESET_ID,

      setMatchName: (name) => set({ matchName: name }),

      addPlayer: () =>
        set((state) => ({
          players: [...state.players, createDefaultPlayer(state.players.length)],
        })),

      addBot: (difficulty) =>
        set((state) => ({
          players: [
            ...state.players,
            {
              ...createDefaultPlayer(state.players.length),
              isBot: true,
              botDifficulty: difficulty ?? state.settings.botDifficulty,
            },
          ],
        })),

      removePlayer: (id) =>
        set((state) => ({
          players: state.players.filter((player) => player.id !== id),
        })),

      updatePlayer: (id, updates) =>
        set((state) => ({
          players: state.players.map((player) =>
            player.id === id ? { ...player, ...updates } : player,
          ),
        })),

      duplicatePlayer: (id) =>
        set((state) => {
          const source = state.players.find((player) => player.id === id);
          if (!source) return state;
          const duplicate: PlayerDraft = {
            ...source,
            id: createId(),
            name: `Player ${state.players.length + 1}`,
          };
          return { players: [...state.players, duplicate] };
        }),

      reorderPlayers: (fromIndex, toIndex) =>
        set((state) => {
          if (
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= state.players.length ||
            toIndex >= state.players.length
          ) {
            return state;
          }
          const players = [...state.players];
          const [moved] = players.splice(fromIndex, 1);
          if (!moved) return state;
          players.splice(toIndex, 0, moved);
          return { players };
        }),

      randomizeAll: () =>
        set((state) => {
          const shuffledAvatars = [...AVATARS].sort(() => Math.random() - 0.5);
          const shuffledColors = [...PLAYER_COLORS].sort(() => Math.random() - 0.5);
          return {
            players: state.players.map((player, index) => ({
              ...player,
              avatarId: shuffledAvatars[index % shuffledAvatars.length]?.id ?? player.avatarId,
              colorId: shuffledColors[index % shuffledColors.length]?.id ?? player.colorId,
            })),
          };
        }),

      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
          selectedPresetId: "custom",
        })),

      applyPreset: (presetId) =>
        set(() => ({ settings: getMatchPreset(presetId).settings, selectedPresetId: presetId })),

      resetToDefaults: () =>
        set({
          matchName: "",
          players: initialPlayers(),
          settings: DEFAULT_MATCH_SETTINGS,
          selectedPresetId: DEFAULT_PRESET_ID,
        }),
    }),
    {
      name: "numera-match-setup",
      partialize: (state) => ({
        matchName: state.matchName,
        players: state.players,
        settings: state.settings,
        selectedPresetId: state.selectedPresetId,
      }),
    },
  ),
);

function normalizeNamesForValidation(players: PlayerDraft[]): PlayerDraft[] {
  return players.map((player, index) => ({
    ...player,
    name: normalizePlayerName(player.name, index),
  }));
}

export { normalizeNamesForValidation };
