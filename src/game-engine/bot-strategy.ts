import type { RandomSource } from "./random";
import { resolveTargetRange } from "./target-generator";
import { findNextActivePlayerIndex, getActivePlayers } from "./rules";
import { GameRuleViolation, type ActiveMatch, type BotDifficulty, type GameMode } from "./types";

/**
 * What a bot is allowed to know when choosing a move. Deliberately excludes the
 * secret target (plan §10.2: "Bots must not directly know the secret target") — the
 * shape of this type is what enforces that, not just a convention.
 */
export interface BotDecisionContext {
  counter: number;
  targetRangeMin: number;
  targetRangeMax: number;
  maxMove: number;
  currentLives: number;
  nextPlayerLives: number;
  mode: GameMode;
}

export function buildBotDecisionContext(state: ActiveMatch, playerId: string): BotDecisionContext {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new GameRuleViolation(`Unknown player: ${playerId}`);

  const activeCount = getActivePlayers(state.players).length;
  const range = resolveTargetRange(state.settings, activeCount);

  let nextPlayerLives = player.lives;
  if (activeCount > 1) {
    const nextIndex = findNextActivePlayerIndex(
      state.playerOrder,
      state.players,
      state.activePlayerIndex,
    );
    const nextPlayerId = state.playerOrder[nextIndex];
    const nextPlayer = state.players.find((candidate) => candidate.id === nextPlayerId);
    if (nextPlayer) nextPlayerLives = nextPlayer.lives;
  }

  return {
    counter: state.counter,
    targetRangeMin: range.min,
    targetRangeMax: range.max,
    maxMove: state.settings.maxMove,
    currentLives: player.lives,
    nextPlayerLives,
    mode: state.settings.mode,
  };
}

/** 0 (far from the worst-case target) to 1 (right at the worst-case target). */
function estimateRisk(context: BotDecisionContext): number {
  const { counter, targetRangeMin, targetRangeMax } = context;
  if (targetRangeMax <= targetRangeMin) return 0.5;
  const risk = (counter - targetRangeMin) / (targetRangeMax - targetRangeMin);
  return Math.min(1, Math.max(0, risk));
}

export function chooseBotMove(
  context: BotDecisionContext,
  difficulty: BotDifficulty,
  random: RandomSource,
): number {
  const { maxMove } = context;
  if (maxMove <= 1) return 1;

  const risk = estimateRisk(context);

  switch (difficulty) {
    case "random":
      return random.nextInt(1, maxMove);

    case "careful": {
      const ceiling = risk > 0.6 ? 1 : Math.max(1, Math.ceil(maxMove / 2));
      return random.nextInt(1, ceiling);
    }

    case "aggressive": {
      if (risk > 0.85) return 1;
      const floor = Math.max(1, Math.floor(maxMove / 2));
      return random.nextInt(floor, maxMove);
    }

    case "trickster":
      return random.nextFloat() < 0.5 ? 1 : maxMove;

    case "balanced":
    default: {
      const preferred = Math.round(maxMove * (1 - risk));
      return Math.min(maxMove, Math.max(1, preferred));
    }
  }
}
