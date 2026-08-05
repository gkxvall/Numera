/**
 * Core Numera game-engine types (plan §10, §18.2-18.3, §25).
 *
 * This module has zero React/Next.js dependencies — see docs/architecture.md
 * "Engine independence".
 */

export type GameMode =
  | "classic"
  | "multiLife"
  | "scoreRush"
  | "reverseCountdown"
  | "teamBattle"
  | "suddenDeath"
  | "chaos";

/** Modes fully implemented by the Stage 3 core engine. Others arrive in Stage 8. */
export const IMPLEMENTED_GAME_MODES: readonly GameMode[] = ["classic", "multiLife", "suddenDeath"];

export type TimeoutBehavior = "applyPlusOne" | "skipTurn" | "losePoint" | "loseLife" | "randomMove";

export type BotDifficulty = "random" | "careful" | "aggressive" | "trickster" | "balanced";

export type DangerLevel = "safe" | "caution" | "danger" | "critical";

export type MatchStatus =
  "setup" | "in_progress" | "round_ended" | "paused" | "completed" | "abandoned";

export interface TargetRange {
  min: number;
  max: number;
}

export interface MatchSettings {
  mode: GameMode;
  startingLives: number;
  targetRange: TargetRange;
  maxMove: number;
  turnTimerSeconds: number | null;
  timeoutBehavior: TimeoutBehavior;
  randomizePlayerOrder: boolean;
  dangerIndicatorEnabled: boolean;
  powerUpsEnabled: boolean;
  specialEventsEnabled: boolean;
  adaptiveTargetRange: boolean;
  botDifficulty: BotDifficulty;
}

/** Minimal shape for now; power-up resolution logic arrives in Stage 7. */
export interface PlayerPowerUp {
  powerUpId: string;
  quantity: number;
}

export interface PlayerMatchStats {
  movesMade: number;
  totalClicks: number;
  largestMove: number;
  powerUpsUsed: number;
  shieldsTriggered: number;
  dangerTurnsSurvived: number;
  roundsSurvived: number;
  livesLost: number;
  totalDecisionTimeMs: number;
}

export function createEmptyMatchStats(): PlayerMatchStats {
  return {
    movesMade: 0,
    totalClicks: 0,
    largestMove: 0,
    powerUpsUsed: 0,
    shieldsTriggered: 0,
    dangerTurnsSurvived: 0,
    roundsSurvived: 0,
    livesLost: 0,
    totalDecisionTimeMs: 0,
  };
}

export interface Player {
  id: string;
  name: string;
  avatarId: string;
  colorId: string;
  lives: number;
  maxLives: number;
  score: number;
  coinsEarned: number;
  powerUps: PlayerPowerUp[];
  isEliminated: boolean;
  isBot: boolean;
  placement?: number;
  stats: PlayerMatchStats;
}

export interface MoveRecord {
  id: string;
  round: number;
  playerId: string;
  selectedAmount: number;
  appliedAmount: number;
  counterBefore: number;
  counterAfter: number;
  reachedTarget: boolean;
  powerUpUsed?: string;
  timestamp: string;
}

export interface RoundRecord {
  round: number;
  target: number;
  loserPlayerId: string;
  eliminatedPlayerId: string | null;
  livesRemainingAfterLoss: number;
  startedAt: string;
  endedAt: string;
}

export interface ActiveMatch {
  id: string;
  status: MatchStatus;
  settings: MatchSettings;
  players: Player[];
  playerOrder: string[];
  activePlayerIndex: number;
  currentRound: number;
  counter: number;
  target: number;
  moveHistory: MoveRecord[];
  roundHistory: RoundRecord[];
  startedAt: string;
  roundStartedAt: string;
  completedAt?: string;
  winnerId?: string;
}

export type GameCommand =
  | { type: "START_MATCH" }
  | { type: "SUBMIT_MOVE"; playerId: string; amount: number }
  | { type: "USE_POWER_UP"; playerId: string; powerUpId: string }
  | { type: "TURN_TIMEOUT"; playerId: string }
  | { type: "CONTINUE_AFTER_LOSS" }
  | { type: "PAUSE_MATCH" }
  | { type: "RESUME_MATCH" }
  | { type: "ABANDON_MATCH" };

export type GameEvent =
  | { type: "MATCH_STARTED" }
  | { type: "ROUND_STARTED"; round: number; target: number }
  | { type: "COUNTER_CHANGED"; value: number }
  | { type: "DANGER_LEVEL_CHANGED"; level: DangerLevel }
  | { type: "TARGET_HIT"; playerId: string }
  | { type: "LIFE_LOST"; playerId: string }
  | { type: "PLAYER_ELIMINATED"; playerId: string; placement: number }
  | { type: "ROUND_ENDED"; round: number }
  | { type: "POWER_UP_USED"; playerId: string; powerUpId: string }
  | { type: "TURN_CHANGED"; playerId: string }
  | { type: "MATCH_PAUSED" }
  | { type: "MATCH_RESUMED" }
  | { type: "MATCH_ABANDONED" }
  | { type: "MATCH_FINISHED"; winnerId: string };

/** Thrown when a command is invalid given the current match state — never silently ignored. */
export class GameRuleViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameRuleViolation";
  }
}
