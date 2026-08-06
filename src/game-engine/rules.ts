import type { RandomSource } from "./random";
import {
  GameRuleViolation,
  type ActiveMatch,
  type DangerLevel,
  type PendingEffect,
  type Player,
} from "./types";

export function getActivePlayers(players: readonly Player[]): Player[] {
  return players.filter((player) => !player.isEliminated);
}

export function activePlayerId(state: ActiveMatch): string {
  const id = state.playerOrder[state.activePlayerIndex];
  if (!id) throw new GameRuleViolation("No active player is set for this turn.");
  return id;
}

export function requirePlayer(state: ActiveMatch, playerId: string): Player {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new GameRuleViolation(`Unknown player: ${playerId}`);
  return player;
}

export function replacePlayer(players: readonly Player[], updated: Player): Player[] {
  return players.map((player) => (player.id === updated.id ? updated : player));
}

export interface NextTurn {
  activePlayerIndex: number;
  pendingEffects: PendingEffect[];
  /** True if this "next turn" is actually a repeat turn granted by Double Trouble. */
  isRepeatTurn: boolean;
}

/**
 * Determines whose turn is next after `finishedPlayerId` acts (or passes). Shared by
 * every code path that ends a turn — a normal move, Skip, and a timeout — so Double
 * Trouble (plan §8.1: "forces the next player to take two consecutive turns") behaves
 * identically no matter how that turn ends.
 */
export function advanceTurn(state: ActiveMatch, finishedPlayerId: string): NextTurn {
  const repeatEffectIndex = state.pendingEffects.findIndex(
    (effect) => effect.type === "doubleTurn" && effect.targetPlayerId === finishedPlayerId,
  );

  if (repeatEffectIndex !== -1) {
    const pendingEffects = [...state.pendingEffects];
    pendingEffects.splice(repeatEffectIndex, 1);
    return { activePlayerIndex: state.activePlayerIndex, pendingEffects, isRepeatTurn: true };
  }

  const activePlayerIndex = findNextActivePlayerIndex(
    state.playerOrder,
    state.players,
    state.activePlayerIndex,
  );
  return { activePlayerIndex, pendingEffects: state.pendingEffects, isRepeatTurn: false };
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

export interface EffectiveMaxMove {
  maxMove: number;
  appliedEffect: "freeze" | "boost" | null;
}

/**
 * The move cap actually in effect for `playerId` right now, accounting for a pending
 * Freeze (caps to 1) or Boost (+1) targeting them. If both are somehow pending at once,
 * Freeze wins — a documented safety-first tie-break (plan §8.2: prevent unbalanced
 * combinations).
 */
export function getEffectiveMaxMove(state: ActiveMatch, playerId: string): EffectiveMaxMove {
  const hasFreeze = state.pendingEffects.some(
    (effect) => effect.type === "freeze" && effect.targetPlayerId === playerId,
  );
  if (hasFreeze) return { maxMove: 1, appliedEffect: "freeze" };

  const hasBoost = state.pendingEffects.some(
    (effect) => effect.type === "boost" && effect.targetPlayerId === playerId,
  );
  if (hasBoost) return { maxMove: state.settings.maxMove + 1, appliedEffect: "boost" };

  return { maxMove: state.settings.maxMove, appliedEffect: null };
}

/** Removes one pending effect of `type` targeting `playerId`, if any (first match). */
export function consumePendingEffect(
  effects: readonly PendingEffect[],
  type: PendingEffect["type"],
  playerId: string,
): PendingEffect[] {
  const index = effects.findIndex(
    (effect) => effect.type === type && effect.targetPlayerId === playerId,
  );
  if (index === -1) return [...effects];
  const next = [...effects];
  next.splice(index, 1);
  return next;
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
