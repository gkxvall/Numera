import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyCommand } from "@/game-engine/engine";
import { createSecureRandomSource } from "@/game-engine/random";
import {
  GameRuleViolation,
  type ActiveMatch,
  type GameCommand,
  type GameEvent,
} from "@/game-engine/types";

export interface ActiveMatchState {
  match: ActiveMatch | null;
  lastEvents: GameEvent[];
  lastError: string | null;
  dispatch: (command: GameCommand) => void;
  clearError: () => void;
  abandonAndClear: () => void;
}

export const useActiveMatchStore = create<ActiveMatchState>()(
  persist(
    (set, get) => ({
      match: null,
      lastEvents: [],
      lastError: null,

      dispatch: (command) => {
        const { match } = get();
        if (!match) {
          set({ lastError: "There is no active match to update." });
          return;
        }
        try {
          const result = applyCommand(match, command, createSecureRandomSource());
          set({ match: result.state, lastEvents: result.events, lastError: null });
        } catch (error) {
          const message =
            error instanceof GameRuleViolation ? error.message : "Something went wrong.";
          set({ lastError: message });
        }
      },

      clearError: () => set({ lastError: null }),

      abandonAndClear: () => set({ match: null, lastEvents: [], lastError: null }),
    }),
    {
      name: "numera-active-match",
      partialize: (state) => ({ match: state.match }),
    },
  ),
);

/** Creates a match and immediately starts it, in one call — used by the setup flow. */
export function startNewMatch(match: ActiveMatch): void {
  useActiveMatchStore.setState({ match, lastEvents: [], lastError: null });
  useActiveMatchStore.getState().dispatch({ type: "START_MATCH" });
}
