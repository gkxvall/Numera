import type { RandomSource } from "./random";
import type { DangerLevel, Player } from "./types";

export function getActivePlayers(players: readonly Player[]): Player[] {
  return players.filter((player) => !player.isEliminated);
}

/**
 * Finds the next active player's index within `playerOrder`, rotating forward from
 * `fromIndex` and skipping eliminated players. Wraps around the end of the order.
 */
export function findNextActivePlayerIndex(
  playerOrder: readonly string[],
  players: readonly Player[],
  fromIndex: number,
): number {
  const playersById = new Map(players.map((player) => [player.id, player]));

  for (let step = 1; step <= playerOrder.length; step++) {
    const candidateIndex = (fromIndex + step) % playerOrder.length;
    const candidateId = playerOrder[candidateIndex];
    const candidate = candidateId ? playersById.get(candidateId) : undefined;
    if (candidate && !candidate.isEliminated) {
      return candidateIndex;
    }
  }

  throw new Error("No active players remain to take a turn.");
}

export interface MoveApplication {
  counterAfter: number;
  appliedAmount: number;
  reachedTarget: boolean;
}

/**
 * Processes a move one click at a time, stopping immediately if the target is hit
 * (plan §6.4) — the counter must never overshoot the target.
 */
export function applyMoveToCounter(
  counterBefore: number,
  selectedAmount: number,
  target: number,
): MoveApplication {
  let counter = counterBefore;
  let applied = 0;
  let reachedTarget = false;

  for (let click = 0; click < selectedAmount; click++) {
    counter += 1;
    applied += 1;
    if (counter === target) {
      reachedTarget = true;
      break;
    }
  }

  return { counterAfter: counter, appliedAmount: applied, reachedTarget };
}

/**
 * The placement earned by a player eliminated when `activeCountBeforeElimination`
 * players (including this one) were still active. Placement 1 is reserved for the
 * eventual champion.
 */
export function placementForElimination(activeCountBeforeElimination: number): number {
  return activeCountBeforeElimination;
}

/**
 * Pure danger-level calculation (plan §20). `uncertainty` is a jitter value the
 * caller generates from a RandomSource — kept out of this function so the bucketing
 * logic itself stays deterministic and directly testable.
 */
export function calculateDangerLevel(
  current: number,
  target: number,
  uncertainty: number,
): DangerLevel {
  const remaining = target - current + uncertainty;

  if (remaining <= 2) return "critical";
  if (remaining <= 5) return "danger";
  if (remaining <= 9) return "caution";
  return "safe";
}

/** Random jitter so the danger level can't be used to reverse-engineer the exact target. */
export function generateDangerUncertainty(random: RandomSource, maxMagnitude = 2): number {
  return random.nextInt(-maxMagnitude, maxMagnitude);
}

/** Fisher-Yates shuffle using an injected RandomSource, for deterministic tests. */
export function shuffle<T>(items: readonly T[], random: RandomSource): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = random.nextInt(0, i);
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }
  return result;
}
