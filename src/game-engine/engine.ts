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
  applyMoveToCounter,
  calculateDangerLevel,
  findNextActivePlayerIndex,
  generateDangerUncertainty,
  getActivePlayers,
  placementForElimination,
  shuffle,
} from "./rules";

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
    currentRound: 0,
    counter: 0,
    target: 0,
    moveHistory: [],
    roundHistory: [],
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
      throw new GameRuleViolation("Power-ups are not implemented yet (arrives in Stage 7).");
    default: {
      const exhaustiveCheck: never = command;
      throw new GameRuleViolation(`Unknown command: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
}

function activePlayerId(state: ActiveMatch): string {
  const id = state.playerOrder[state.activePlayerIndex];
  if (!id) throw new GameRuleViolation("No active player is set for this turn.");
  return id;
}

function requirePlayer(state: ActiveMatch, playerId: string): Player {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new GameRuleViolation(`Unknown player: ${playerId}`);
  return player;
}

function replacePlayer(players: readonly Player[], updated: Player): Player[] {
  return players.map((player) => (player.id === updated.id ? updated : player));
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

  const nextState: ActiveMatch = {
    ...state,
    status: "in_progress",
    playerOrder,
    activePlayerIndex: 0,
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
 * Deducts a life from `playerId`, eliminates them if that was their last life, checks
 * for a match winner, and records the round. Does not touch the counter/target itself —
 * callers (a target hit, or a forced timeout life loss) are responsible for that.
 */
function resolveLifeLoss(state: ActiveMatch, playerId: string): CommandResult {
  const events: GameEvent[] = [];
  const activeCountBefore = getActivePlayers(state.players).length;

  const loser = requirePlayer(state, playerId);
  const updatedLoser: Player = {
    ...loser,
    lives: loser.lives - 1,
    stats: { ...loser.stats, livesLost: loser.stats.livesLost + 1 },
  };
  events.push({ type: "LIFE_LOST", playerId });

  let eliminatedPlayerId: string | null = null;
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

  let players = replacePlayer(state.players, updatedLoser);

  const now = new Date().toISOString();
  const roundRecord: RoundRecord = {
    round: state.currentRound,
    target: state.target,
    loserPlayerId: playerId,
    eliminatedPlayerId,
    livesRemainingAfterLoss: updatedLoser.lives,
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

  const validation = validateMoveAmount(amount, state.settings.maxMove);
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

  const stateAfterMove: ActiveMatch = {
    ...state,
    counter: counterAfter,
    players: replacePlayer(state.players, updatedPlayer),
    moveHistory: [...state.moveHistory, moveRecord],
  };

  const events: GameEvent[] = [{ type: "COUNTER_CHANGED", value: counterAfter }];

  if (state.settings.dangerIndicatorEnabled && !reachedTarget) {
    const uncertainty = generateDangerUncertainty(random);
    const level = calculateDangerLevel(counterAfter, state.target, uncertainty);
    events.push({ type: "DANGER_LEVEL_CHANGED", level });
  }

  if (!reachedTarget) {
    const nextIndex = findNextActivePlayerIndex(
      stateAfterMove.playerOrder,
      stateAfterMove.players,
      stateAfterMove.activePlayerIndex,
    );
    const nextPlayerId = stateAfterMove.playerOrder[nextIndex]!;
    events.push({ type: "TURN_CHANGED", playerId: nextPlayerId });
    return {
      state: { ...stateAfterMove, activePlayerIndex: nextIndex },
      events,
    };
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
      const nextIndex = findNextActivePlayerIndex(
        state.playerOrder,
        state.players,
        state.activePlayerIndex,
      );
      return {
        state: { ...state, activePlayerIndex: nextIndex },
        events: [{ type: "TURN_CHANGED", playerId: state.playerOrder[nextIndex]! }],
      };
    }
    case "loseLife":
      return resolveLifeLoss(state, playerId);
    case "losePoint": {
      const player = requirePlayer(state, playerId);
      const updatedPlayer: Player = { ...player, score: player.score - 1 };
      const nextIndex = findNextActivePlayerIndex(
        state.playerOrder,
        state.players,
        state.activePlayerIndex,
      );
      return {
        state: {
          ...state,
          players: replacePlayer(state.players, updatedPlayer),
          activePlayerIndex: nextIndex,
        },
        events: [{ type: "TURN_CHANGED", playerId: state.playerOrder[nextIndex]! }],
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
