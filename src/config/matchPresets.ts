import type { MatchSettings } from "@/game-engine/types";

/** Plan §6.2 default rules. */
export const DEFAULT_MATCH_SETTINGS: MatchSettings = {
  mode: "classic",
  startingLives: 1,
  targetRange: { min: 20, max: 40 },
  maxMove: 3,
  turnTimerSeconds: 10,
  timeoutBehavior: "applyPlusOne",
  randomizePlayerOrder: true,
  dangerIndicatorEnabled: true,
  powerUpsEnabled: true,
  specialEventsEnabled: false,
  adaptiveTargetRange: false,
  botDifficulty: "balanced",
};

export interface MatchPreset {
  id: string;
  label: string;
  description: string;
  settings: MatchSettings;
}

const CUSTOM_PRESET: MatchPreset = {
  id: "custom",
  label: "Custom",
  description: "Start from the defaults and configure everything yourself.",
  settings: DEFAULT_MATCH_SETTINGS,
};

/**
 * Preset configurations (plan §15.5). "Chaos" is omitted until Chaos Mode is
 * implemented in Stage 8 — offering it now would create a match the engine rejects.
 */
export const MATCH_PRESETS: readonly MatchPreset[] = [
  {
    id: "quick",
    label: "Quick",
    description: "Fast rounds and a short range — get playing in seconds.",
    settings: {
      ...DEFAULT_MATCH_SETTINGS,
      targetRange: { min: 15, max: 25 },
      turnTimerSeconds: 8,
      adaptiveTargetRange: true,
    },
  },
  {
    id: "party",
    label: "Party",
    description: "Extra lives keep everyone in the game longer.",
    settings: {
      ...DEFAULT_MATCH_SETTINGS,
      mode: "multiLife",
      startingLives: 3,
      turnTimerSeconds: 12,
      adaptiveTargetRange: true,
    },
  },
  {
    id: "strategic",
    label: "Strategic",
    description: "A wider range, more move choices, and no clock.",
    settings: {
      ...DEFAULT_MATCH_SETTINGS,
      targetRange: { min: 25, max: 60 },
      maxMove: 4,
      turnTimerSeconds: null,
      randomizePlayerOrder: false,
    },
  },
  {
    id: "suddenDeath",
    label: "Sudden Death",
    description: "Tiny range, five-second timer, high intensity.",
    settings: {
      ...DEFAULT_MATCH_SETTINGS,
      mode: "suddenDeath",
      targetRange: { min: 8, max: 15 },
      turnTimerSeconds: 5,
    },
  },
  CUSTOM_PRESET,
];

export const DEFAULT_PRESET_ID = CUSTOM_PRESET.id;

export function getMatchPreset(presetId: string): MatchPreset {
  return MATCH_PRESETS.find((preset) => preset.id === presetId) ?? CUSTOM_PRESET;
}
