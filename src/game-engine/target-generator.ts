import type { RandomSource } from "./random";
import type { MatchSettings, TargetRange } from "./types";

/** Suggested adaptive ranges by active player count (plan §6.5). */
const ADAPTIVE_RANGES: ReadonlyArray<{ maxPlayers: number; range: TargetRange }> = [
  { maxPlayers: 2, range: { min: 12, max: 24 } },
  { maxPlayers: 3, range: { min: 16, max: 32 } },
  { maxPlayers: 4, range: { min: 20, max: 40 } },
  { maxPlayers: 6, range: { min: 25, max: 50 } },
  { maxPlayers: 8, range: { min: 30, max: 65 } },
  { maxPlayers: 10, range: { min: 40, max: 80 } },
];

export function getAdaptiveTargetRange(activePlayerCount: number): TargetRange {
  const match = ADAPTIVE_RANGES.find((entry) => activePlayerCount <= entry.maxPlayers);
  return match?.range ?? ADAPTIVE_RANGES[ADAPTIVE_RANGES.length - 1]!.range;
}

/** The range actually in effect for target generation right now, given match settings. */
export function resolveTargetRange(
  settings: Pick<MatchSettings, "adaptiveTargetRange" | "targetRange">,
  activePlayerCount: number,
): TargetRange {
  if (!settings.adaptiveTargetRange) return settings.targetRange;
  return getAdaptiveTargetRange(activePlayerCount);
}

const MAX_GENERATION_ATTEMPTS = 50;

/**
 * Picks the next round's target. Never below `startingCounter + 1`, and avoids
 * repeating the same value a third round in a row (plan §6.5) unless the range is
 * too narrow to allow it.
 */
export function generateTarget(
  range: TargetRange,
  startingCounter: number,
  recentTargets: readonly number[],
  random: RandomSource,
): number {
  const min = Math.max(range.min, startingCounter + 1);
  const max = Math.max(min, range.max);

  const lastTwo = recentTargets.slice(-2);
  const wouldTriggerThreeInARow = (candidate: number) =>
    lastTwo.length === 2 && lastTwo[0] === candidate && lastTwo[1] === candidate;

  let candidate = random.nextInt(min, max);
  let attempts = 1;
  while (wouldTriggerThreeInARow(candidate) && attempts < MAX_GENERATION_ATTEMPTS) {
    candidate = random.nextInt(min, max);
    attempts++;
  }

  return candidate;
}
