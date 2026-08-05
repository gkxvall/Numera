import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyCommand } from "@/game-engine/engine";
import { createSecureRandomSource } from "@/game-engine/random";
import {
  GameRuleViolation,
  type ActiveMatch,
  type DangerLevel,
  type GameCommand,
  type GameEvent,
} from "@/game-engine/types";

export interface ActiveMatchState {
  match: ActiveMatch | null;
  lastEvents: GameEvent[];
  lastError: string | null;
  dangerLevel: DangerLevel | null;
  dispatch: (command: GameCommand) => void;
  clearError: () => void;
  abandonAndClear: () => void;
}

function extractDangerLevel(events: GameEvent[]): DangerLevel | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (event?.type === "DANGER_LEVEL_CHANGED") return event.level;
  }
  return null;
}

export const useActiveMatchStore = create<ActiveMatchState>()(
  persist(
    (set, get) => ({
      match: null,
      lastEvents: [],
      lastError: null,
      dangerLevel: null,

      dispatch: (command) => {
        const { match } = get();
        if (!match) {
          set({ lastError: "There is no active match to update." });
          return;
        }
        try {
          const result = applyCommand(match, command, createSecureRandomSource());
          const dangerFromEvents = extractDangerLevel(result.events);
          set({
            match: result.state,
            lastEvents: result.events,
            lastError: null,
            // A new round or a fresh turn without a computed danger level yet should not
            // keep showing the previous turn's danger level.
            dangerLevel:
              command.type === "SUBMIT_MOVE" || command.type === "TURN_TIMEOUT"
                ? dangerFromEvents
                : null,
          });
        } catch (error) {
          const message =
            error instanceof GameRuleViolation ? error.message : "Something went wrong.";
          set({ lastError: message });
        }
      },

      clearError: () => set({ lastError: null }),

      abandonAndClear: () =>
        set({ match: null, lastEvents: [], lastError: null, dangerLevel: null }),
    }),
    {
      name: "numera-active-match",
      partialize: (state) => ({ match: state.match }),
    },
  ),
);

/** Creates a match and immediately starts it, in one call — used by the setup flow. */
export function startNewMatch(match: ActiveMatch): void {
  useActiveMatchStore.setState({ match, lastEvents: [], lastError: null, dangerLevel: null });
  useActiveMatchStore.getState().dispatch({ type: "START_MATCH" });
}
