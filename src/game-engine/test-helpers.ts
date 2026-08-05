import { createPlayer } from "./engine";
import type { MatchSettings, Player } from "./types";

export function makeTestPlayer(overrides: Partial<Player> & { id: string; name: string }): Player {
  return {
    ...createPlayer({
      id: overrides.id,
      name: overrides.name,
      avatarId: "avatar-1",
      colorId: "blue",
    }),
    ...overrides,
  };
}

export function makeTestPlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, index) =>
    makeTestPlayer({ id: `p${index + 1}`, name: `Player ${index + 1}` }),
  );
}

export function makeTestSettings(overrides: Partial<MatchSettings> = {}): MatchSettings {
  return {
    mode: "classic",
    startingLives: 1,
    targetRange: { min: 20, max: 40 },
    maxMove: 3,
    turnTimerSeconds: 10,
    timeoutBehavior: "applyPlusOne",
    randomizePlayerOrder: false,
    dangerIndicatorEnabled: true,
    powerUpsEnabled: false,
    specialEventsEnabled: false,
    adaptiveTargetRange: false,
    botDifficulty: "balanced",
    ...overrides,
  };
}
