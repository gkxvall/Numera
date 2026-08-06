import {
  createEmptyMatchStats,
  GameRuleViolation,
  IMPLEMENTED_GAME_MODES,
  type ActiveMatch,
  type BotDifficulty,
  type GameCommand,
  type GameEvent,
  type MatchSettings,
  type Player,
  type RoundRecord,
} from "./types";
import type { RandomSource } from "./random";
import { generateTarget, resolveTargetRange } from "./target-generator";
import { validateMoveAmount } from "./move-validator";
import {
  activePlayerId,
  advanceTurn,
  applyMoveToCounter,
  calculateDangerLevel,
  consumePendingEffect,
  findNextActivePlayerIndex,
  generateDangerUncertainty,
  getActivePlayers,
  getEffectiveMaxMove,
  placementForElimination,
  replacePlayer,
  requirePlayer,
  shuffle,
} from "./rules";
import {
  assertCanActivate,
  consumeInventoryAndRecord,
  grantStartingPowerUps,
  resolveNonMovePowerUp,
} from "./power-up-resolver";

export interface CommandResult {
  state: ActiveMatch;
  events: GameEvent[];
}

export function createPlayer(input: {
  id: string;
  name: string;
  avatarId: string;
  colorId: string;
  isBot?: boolean;
  botDifficulty?: BotDifficulty;
}): Player {
  return {
    id: input.id,
    name: input.name,
    avatarId: input.avatarId,
    colorId: input.colorId,
    lives: 1,
    maxLives: 1,
    score: 0,
    coinsEarned: 0,
    powerUps: [],
    isEliminated: false,
    isBot: input.isBot ?? false,
    botDifficulty: input.botDifficulty,
    stats: createEmptyMatchStats(),
  };
}

/** Constructs a match in "setup" status. No randomness needed yet. */
export function createMatch(id: string, settings: MatchSettings, players: Player[]): ActiveMatch {
  if (players.length < 2) {
    throw new GameRuleViolation("A match needs at least 2 players.");
  }
  if (!IMPLEMENTED_GAME_MODES.includes(settings.mode)) {
    throw new GameRuleViolation(`Game mode "${settings.mode}" is not yet implemented.`);
  }

  return {
    id,
    status: "setup",
    settings,
    players: players.map((player) => ({
      ...player,
      lives: settings.startingLives,
      maxLives: settings.startingLives,
      isEliminated: false,
      placement: undefined,
    })),
    playerOrder: players.map((player) => player.id),
    activePlayerIndex: 0,
    turnOrdinal: 0,
    currentRound: 0,
    counter: 0,
    target: 0,
    moveHistory: [],
    roundHistory: [],
    powerUpHistory: [],
    pendingEffects: [],
    startedAt: new Date().toISOString(),
    roundStartedAt: new Date().toISOString(),
  };
}

export function applyCommand(
  state: ActiveMatch,
  command: GameCommand,
  random: RandomSource,
): CommandResult {
  switch (command.type) {
    case "START_MATCH":
      return startMatch(state, random);
    case "SUBMIT_MOVE":
      return submitMove(state, command.playerId, command.amount, random);
    case "TURN_TIMEOUT":
      return handleTimeout(state, command.playerId, random);
    case "CONTINUE_AFTER_LOSS":
      return continueAfterLoss(state, random);
    case "PAUSE_MATCH":
      return pauseMatch(state);
    case "RESUME_MATCH":
      return resumeMatch(state);
    case "ABANDON_MATCH":
      return abandonMatch(state);
    case "USE_POWER_UP":
      return handleUsePowerUp(state, command, random);
    default: {
      const exhaustiveCheck: never = command;
      throw new GameRuleViolation(`Unknown command: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
}

/**
 * Lucky Dice both consumes a power-up and performs a move, so it needs submitMove —
 * kept here (rather than in power-up-resolver.ts) to avoid a circular import. Every
 * other power-up is handled by resolveNonMovePowerUp.
 */
function handleUsePowerUp(
  state: ActiveMatch,
  command: Extract<GameCommand, { type: "USE_POWER_UP" }>,
  random: RandomSource,
): CommandResult {
  if (command.powerUpId !== "luckyDice") {
    return resolveNonMovePowerUp(state, command, random);
  }

  const player = assertCanActivate(state, command.playerId, command.powerUpId);
  const { state: stateAfterConsume } = consumeInventoryAndRecord(state, player, "luckyDice");
  const amount = random.nextInt(1, state.settings.maxMove);
  const moveResult = submitMove(stateAfterConsume, player.id, amount, random);

  return {
    state: moveResult.state,
    events: [
      { type: "POWER_UP_USED", playerId: player.id, powerUpId: "luckyDice" },
      ...moveResult.events,
    ],
  };
}

function startMatch(state: ActiveMatch, random: RandomSource): CommandResult {
  if (state.status !== "setup") {
    throw new GameRuleViolation("The match has already been started.");
  }

  const playerOrder = state.settings.randomizePlayerOrder
    ? shuffle(state.playerOrder, random)
    : state.playerOrder;

  const range = resolveTargetRange(state.settings, getActivePlayers(state.players).length);
  const target = generateTarget(range, 0, [], random);
  const startedAt = new Date().toISOString();
  const players = state.settings.powerUpsEnabled
    ? grantStartingPowerUps(state.players, random)
    : state.players;

  const nextState: ActiveMatch = {
    ...state,
    status: "in_progress",
    playerOrder,
    players,
    activePlayerIndex: 0,
    turnOrdinal: 1,
    currentRound: 1,
    counter: 0,
    target,
    startedAt,
    roundStartedAt: startedAt,
  };

  return {
    state: nextState,
    events: [{ type: "MATCH_STARTED" }, { type: "ROUND_STARTED", round: 1, target }],
  };
}

/**
 * Deducts a life from `playerId` (unless `blockedByShield`), eliminates them if that
 * was their last life, checks for a match winner, and records the round. Does not touch
 * the counter/target itself — callers (a target hit, or a forced timeout life loss) are
 * responsible for that.
 */
function resolveLifeLoss(
  state: ActiveMatch,
  playerId: string,
  blockedByShield = false,
): CommandResult {
  const events: GameEvent[] = [];
  const activeCountBefore = getActivePlayers(state.players).length;

  const loser = requirePlayer(state, playerId);
  let updatedLoser: Player = loser;
  let eliminatedPlayerId: string | null = null;

  if (blockedByShield) {
    updatedLoser = {
      ...loser,
      stats: { ...loser.stats, shieldsTriggered: loser.stats.shieldsTriggered + 1 },
    };
    events.push({ type: "SHIELD_BLOCKED_HIT", playerId });
  } else {
    updatedLoser = {
      ...loser,
      lives: loser.lives - 1,
      stats: { ...loser.stats, livesLost: loser.stats.livesLost + 1 },
    };
    events.push({ type: "LIFE_LOST", playerId });

    if (updatedLoser.lives <= 0) {
      updatedLoser.isEliminated = true;
      updatedLoser.placement = placementForElimination(activeCountBefore);
      eliminatedPlayerId = playerId;
      events.push({
        type: "PLAYER_ELIMINATED",
        playerId,
        placement: updatedLoser.placement,
      });
    }
  }

  let players = replacePlayer(state.players, updatedLoser);

  const now = new Date().toISOString();
  const roundRecord: RoundRecord = {
    round: state.currentRound,
    target: state.target,
    loserPlayerId: playerId,
    eliminatedPlayerId,
    livesRemainingAfterLoss: updatedLoser.lives,
    blockedByShield,
    startedAt: state.roundStartedAt,
    endedAt: now,
  };
  const roundHistory = [...state.roundHistory, roundRecord];

  const activeAfter = getActivePlayers(players);

  if (activeAfter.length <= 1) {
    const winner = activeAfter[0];
    if (winner) {
      players = replacePlayer(players, { ...winner, placement: 1 });
    }
    const nextState: ActiveMatch = {
      ...state,
      players,
      roundHistory,
      status: "completed",
      completedAt: now,
      winnerId: winner?.id,
    };
    if (winner) events.push({ type: "MATCH_FINISHED", winnerId: winner.id });
    return { state: nextState, events };
  }

  const nextState: ActiveMatch = {
    ...state,
    players,
    roundHistory,
    status: "round_ended",
  };
  events.push({ type: "ROUND_ENDED", round: state.currentRound });
  return { state: nextState, events };
}

function submitMove(
  state: ActiveMatch,
  playerId: string,
  amount: number,
  random: RandomSource,
): CommandResult {
  if (state.status !== "in_progress") {
    throw new GameRuleViolation("The match is not currently accepting moves.");
  }
  if (activePlayerId(state) !== playerId) {
    throw new GameRuleViolation("It is not this player's turn.");
  }

  const { maxMove: effectiveMaxMove, appliedEffect } = getEffectiveMaxMove(state, playerId);
  const validation = validateMoveAmount(amount, effectiveMaxMove);
  if (!validation.valid) {
    throw new GameRuleViolation(validation.error ?? "Invalid move amount.");
  }

  const player = requirePlayer(state, playerId);
  const { counterAfter, appliedAmount, reachedTarget } = applyMoveToCounter(
    state.counter,
    amount,
    state.target,
  );

  const moveRecord = {
    id: crypto.randomUUID(),
    round: state.currentRound,
    playerId,
    selectedAmount: amount,
    appliedAmount,
    counterBefore: state.counter,
    counterAfter,
    reachedTarget,
    timestamp: new Date().toISOString(),
  };

  const updatedPlayer: Player = {
    ...player,
    stats: {
      ...player.stats,
      movesMade: player.stats.movesMade + 1,
      totalClicks: player.stats.totalClicks + appliedAmount,
      largestMove: Math.max(player.stats.largestMove, appliedAmount),
    },
  };

  // A Freeze/Boost effect applying to this move is used up regardless of the outcome.
  const pendingEffects = appliedEffect
    ? consumePendingEffect(state.pendingEffects, appliedEffect, playerId)
    : state.pendingEffects;

  const stateAfterMove: ActiveMatch = {
    ...state,
    counter: counterAfter,
    players: replacePlayer(state.players, updatedPlayer),
    moveHistory: [...state.moveHistory, moveRecord],
    pendingEffects,
  };

  const events: GameEvent[] = [{ type: "COUNTER_CHANGED", value: counterAfter }];

  if (state.settings.dangerIndicatorEnabled && !reachedTarget) {
    const uncertainty = generateDangerUncertainty(random);
    const level = calculateDangerLevel(counterAfter, state.target, uncertainty);
    events.push({ type: "DANGER_LEVEL_CHANGED", level });
  }

  if (!reachedTarget) {
    const next = advanceTurn(stateAfterMove, playerId);
    const nextPlayerId = stateAfterMove.playerOrder[next.activePlayerIndex]!;
    events.push({ type: "TURN_CHANGED", playerId: nextPlayerId });
    return {
      state: {
        ...stateAfterMove,
        activePlayerIndex: next.activePlayerIndex,
        pendingEffects: next.pendingEffects,
        turnOrdinal: stateAfterMove.turnOrdinal + 1,
      },
      events,
    };
  }

  const hasShield = stateAfterMove.pendingEffects.some(
    (effect) => effect.type === "shield" && effect.targetPlayerId === playerId,
  );

  if (hasShield) {
    const shieldedState: ActiveMatch = {
      ...stateAfterMove,
      pendingEffects: consumePendingEffect(stateAfterMove.pendingEffects, "shield", playerId),
    };
    events.push({ type: "TARGET_HIT", playerId });
    const shieldResult = resolveLifeLoss(shieldedState, playerId, true);
    return { state: shieldResult.state, events: [...events, ...shieldResult.events] };
  }

  events.push({ type: "TARGET_HIT", playerId });
  const lossResult = resolveLifeLoss(stateAfterMove, playerId);
  return { state: lossResult.state, events: [...events, ...lossResult.events] };
}

function continueAfterLoss(state: ActiveMatch, random: RandomSource): CommandResult {
  if (state.status !== "round_ended") {
    throw new GameRuleViolation("There is no round to continue from.");
  }

  const nextIndex = findNextActivePlayerIndex(
    state.playerOrder,
    state.players,
    state.activePlayerIndex,
  );

  const range = resolveTargetRange(state.settings, getActivePlayers(state.players).length);
  const recentTargets = state.roundHistory.map((round) => round.target);
  const target = generateTarget(range, 0, recentTargets, random);
  const nextRound = state.currentRound + 1;
  const now = new Date().toISOString();

  const nextState: ActiveMatch = {
    ...state,
    status: "in_progress",
    counter: 0,
    target,
    currentRound: nextRound,
    activePlayerIndex: nextIndex,
    turnOrdinal: state.turnOrdinal + 1,
    roundStartedAt: now,
  };

  return {
    state: nextState,
    events: [
      { type: "ROUND_STARTED", round: nextRound, target },
      { type: "TURN_CHANGED", playerId: state.playerOrder[nextIndex]! },
    ],
  };
}

function handleTimeout(state: ActiveMatch, playerId: string, random: RandomSource): CommandResult {
  if (state.status !== "in_progress") {
    throw new GameRuleViolation("The match is not currently accepting moves.");
  }
  if (activePlayerId(state) !== playerId) {
    throw new GameRuleViolation("This timeout no longer matches the active player.");
  }

  switch (state.settings.timeoutBehavior) {
    case "applyPlusOne":
      return submitMove(state, playerId, 1, random);
    case "randomMove": {
      const amount = random.nextInt(1, state.settings.maxMove);
      return submitMove(state, playerId, amount, random);
    }
    case "skipTurn": {
      const next = advanceTurn(state, playerId);
      return {
        state: {
          ...state,
          activePlayerIndex: next.activePlayerIndex,
          pendingEffects: next.pendingEffects,
          turnOrdinal: state.turnOrdinal + 1,
        },
        events: [{ type: "TURN_CHANGED", playerId: state.playerOrder[next.activePlayerIndex]! }],
      };
    }
    case "loseLife":
      return resolveLifeLoss(state, playerId);
    case "losePoint": {
      const player = requirePlayer(state, playerId);
      const updatedPlayer: Player = { ...player, score: player.score - 1 };
      const next = advanceTurn(state, playerId);
      return {
        state: {
          ...state,
          players: replacePlayer(state.players, updatedPlayer),
          activePlayerIndex: next.activePlayerIndex,
          pendingEffects: next.pendingEffects,
          turnOrdinal: state.turnOrdinal + 1,
        },
        events: [{ type: "TURN_CHANGED", playerId: state.playerOrder[next.activePlayerIndex]! }],
      };
    }
  }
}

function pauseMatch(state: ActiveMatch): CommandResult {
  if (state.status !== "in_progress") {
    throw new GameRuleViolation("Only an in-progress match can be paused.");
  }
  return { state: { ...state, status: "paused" }, events: [{ type: "MATCH_PAUSED" }] };
}

function resumeMatch(state: ActiveMatch): CommandResult {
  if (state.status !== "paused") {
    throw new GameRuleViolation("Only a paused match can be resumed.");
  }
  return { state: { ...state, status: "in_progress" }, events: [{ type: "MATCH_RESUMED" }] };
}

function abandonMatch(state: ActiveMatch): CommandResult {
  if (state.status === "completed" || state.status === "abandoned") {
    throw new GameRuleViolation("This match has already finished.");
  }
  return {
    state: { ...state, status: "abandoned", completedAt: new Date().toISOString() },
    events: [{ type: "MATCH_ABANDONED" }],
  };
}
