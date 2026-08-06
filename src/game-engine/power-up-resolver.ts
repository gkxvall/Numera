import type { RandomSource } from "./random";
import {
  activePlayerId,
  advanceTurn,
  findNextActivePlayerIndex,
  replacePlayer,
  requirePlayer,
  shuffle,
} from "./rules";
import {
  GameRuleViolation,
  POWER_UP_IDS,
  type ActiveMatch,
  type GameCommand,
  type GameEvent,
  type Player,
  type PowerUpId,
  type PowerUpUsageRecord,
} from "./types";
import { DEFAULT_POWER_UP_INVENTORY_SIZE } from "@/config/powerUps";
import type { CommandResult } from "./engine";

/** Grants each player a starting inventory of distinct random power-ups (plan §8.1). */
export function grantStartingPowerUps(players: readonly Player[], random: RandomSource): Player[] {
  return players.map((player) => {
    const shuffled = shuffle(POWER_UP_IDS, random);
    const chosen = shuffled.slice(0, DEFAULT_POWER_UP_INVENTORY_SIZE);
    return {
      ...player,
      powerUps: chosen.map((powerUpId) => ({ powerUpId, quantity: 1 })),
    };
  });
}

/** Validates that `playerId` may activate `powerUpId` right now; returns the player. */
export function assertCanActivate(
  state: ActiveMatch,
  playerId: string,
  powerUpId: PowerUpId,
): Player {
  if (!state.settings.powerUpsEnabled) {
    throw new GameRuleViolation("Power-ups are disabled for this match.");
  }
  if (state.status !== "in_progress") {
    throw new GameRuleViolation("Power-ups can only be used during an active turn.");
  }
  if (activePlayerId(state) !== playerId) {
    throw new GameRuleViolation("Only the active player can use a power-up.");
  }
  const alreadyUsedThisTurn = state.powerUpHistory.some(
    (usage) => usage.turnOrdinal === state.turnOrdinal,
  );
  if (alreadyUsedThisTurn) {
    throw new GameRuleViolation("Only one power-up can be used per turn.");
  }

  const player = requirePlayer(state, playerId);
  const inventory = player.powerUps.find((entry) => entry.powerUpId === powerUpId);
  if (!inventory || inventory.quantity <= 0) {
    throw new GameRuleViolation("This power-up is not in your inventory.");
  }
  return player;
}

/** Deducts one from inventory, records the usage, and bumps the usage stat. */
export function consumeInventoryAndRecord(
  state: ActiveMatch,
  player: Player,
  powerUpId: PowerUpId,
  targetPlayerId?: string,
  amount?: number,
): { state: ActiveMatch; usage: PowerUpUsageRecord } {
  const updatedInventory = player.powerUps
    .map((entry) =>
      entry.powerUpId === powerUpId ? { ...entry, quantity: entry.quantity - 1 } : entry,
    )
    .filter((entry) => entry.quantity > 0);
  const updatedPlayer: Player = {
    ...player,
    powerUps: updatedInventory,
    stats: { ...player.stats, powerUpsUsed: player.stats.powerUpsUsed + 1 },
  };

  const usage: PowerUpUsageRecord = {
    id: crypto.randomUUID(),
    powerUpId,
    playerId: player.id,
    round: state.currentRound,
    turnOrdinal: state.turnOrdinal,
    targetPlayerId,
    amount,
    timestamp: new Date().toISOString(),
  };

  return {
    state: {
      ...state,
      players: replacePlayer(state.players, updatedPlayer),
      powerUpHistory: [...state.powerUpHistory, usage],
    },
    usage,
  };
}

/**
 * Resolves every power-up except Lucky Dice, which also performs a move and is
 * orchestrated by engine.ts (it needs to call submitMove; keeping that out of this
 * module avoids a circular import between engine.ts and power-up-resolver.ts).
 */
export function resolveNonMovePowerUp(
  state: ActiveMatch,
  command: Extract<GameCommand, { type: "USE_POWER_UP" }>,
  random: RandomSource,
): CommandResult {
  const player = assertCanActivate(state, command.playerId, command.powerUpId);

  switch (command.powerUpId) {
    case "shield": {
      const { state: next } = consumeInventoryAndRecord(state, player, "shield");
      return {
        state: {
          ...next,
          pendingEffects: [...next.pendingEffects, { type: "shield", targetPlayerId: player.id }],
        },
        events: [{ type: "POWER_UP_USED", playerId: player.id, powerUpId: "shield" }],
      };
    }

    case "peek": {
      const { state: next } = consumeInventoryAndRecord(state, player, "peek");
      const paddingLow = random.nextInt(3, 6);
      const paddingHigh = random.nextInt(3, 6);
      const rangeMin = Math.max(state.settings.targetRange.min, state.target - paddingLow);
      const rangeMax = Math.min(state.settings.targetRange.max, state.target + paddingHigh);
      const events: GameEvent[] = [
        { type: "POWER_UP_USED", playerId: player.id, powerUpId: "peek" },
        { type: "PEEK_REVEALED", playerId: player.id, rangeMin, rangeMax },
      ];
      return { state: next, events };
    }

    case "reverse": {
      const { state: next } = consumeInventoryAndRecord(state, player, "reverse");
      const playerOrder = [...next.playerOrder].reverse();
      const activePlayerIndex = playerOrder.indexOf(player.id);
      return {
        state: { ...next, playerOrder, activePlayerIndex },
        events: [{ type: "POWER_UP_USED", playerId: player.id, powerUpId: "reverse" }],
      };
    }

    case "freeze": {
      const targetIndex = findNextActivePlayerIndex(
        state.playerOrder,
        state.players,
        state.activePlayerIndex,
      );
      const targetPlayerId = state.playerOrder[targetIndex]!;
      const { state: next } = consumeInventoryAndRecord(state, player, "freeze", targetPlayerId);
      return {
        state: {
          ...next,
          pendingEffects: [...next.pendingEffects, { type: "freeze", targetPlayerId }],
        },
        events: [
          { type: "POWER_UP_USED", playerId: player.id, powerUpId: "freeze", targetPlayerId },
        ],
      };
    }

    case "boost": {
      const { state: next } = consumeInventoryAndRecord(state, player, "boost");
      return {
        state: {
          ...next,
          pendingEffects: [...next.pendingEffects, { type: "boost", targetPlayerId: player.id }],
        },
        events: [{ type: "POWER_UP_USED", playerId: player.id, powerUpId: "boost" }],
      };
    }

    case "skip": {
      const { state: next } = consumeInventoryAndRecord(state, player, "skip");
      const turn = advanceTurn(next, player.id);
      return {
        state: {
          ...next,
          activePlayerIndex: turn.activePlayerIndex,
          pendingEffects: turn.pendingEffects,
          turnOrdinal: next.turnOrdinal + 1,
        },
        events: [
          { type: "POWER_UP_USED", playerId: player.id, powerUpId: "skip" },
          { type: "TURN_CHANGED", playerId: next.playerOrder[turn.activePlayerIndex]! },
        ],
      };
    }

    case "swap": {
      const targetPlayerId = command.targetPlayerId;
      if (!targetPlayerId) {
        throw new GameRuleViolation("Swap requires a target player.");
      }
      if (targetPlayerId === player.id) {
        throw new GameRuleViolation("Choose a different player to swap with.");
      }
      const target = requirePlayer(state, targetPlayerId);
      if (target.isEliminated) {
        throw new GameRuleViolation("Cannot swap with an eliminated player.");
      }

      const { state: next } = consumeInventoryAndRecord(state, player, "swap", targetPlayerId);
      const activatorIndex = next.playerOrder.indexOf(player.id);
      const targetIndex = next.playerOrder.indexOf(targetPlayerId);
      const playerOrder = [...next.playerOrder];
      playerOrder[activatorIndex] = targetPlayerId;
      playerOrder[targetIndex] = player.id;

      return {
        state: { ...next, playerOrder, activePlayerIndex: targetIndex },
        events: [{ type: "POWER_UP_USED", playerId: player.id, powerUpId: "swap", targetPlayerId }],
      };
    }

    case "counterPushback": {
      const amount = command.amount;
      if (amount !== 1 && amount !== 2) {
        throw new GameRuleViolation("Pushback amount must be 1 or 2.");
      }
      const { state: next } = consumeInventoryAndRecord(
        state,
        player,
        "counterPushback",
        undefined,
        amount,
      );
      const counter = Math.max(0, next.counter - amount);
      return {
        state: { ...next, counter },
        events: [
          { type: "POWER_UP_USED", playerId: player.id, powerUpId: "counterPushback" },
          { type: "COUNTER_CHANGED", value: counter },
        ],
      };
    }

    case "scramble": {
      const { state: next } = consumeInventoryAndRecord(state, player, "scramble");
      const playerOrder = shuffle(next.playerOrder, random);
      const activePlayerIndex = playerOrder.indexOf(player.id);
      return {
        state: { ...next, playerOrder, activePlayerIndex },
        events: [{ type: "POWER_UP_USED", playerId: player.id, powerUpId: "scramble" }],
      };
    }

    case "doubleTrouble": {
      const targetIndex = findNextActivePlayerIndex(
        state.playerOrder,
        state.players,
        state.activePlayerIndex,
      );
      const targetPlayerId = state.playerOrder[targetIndex]!;
      const { state: next } = consumeInventoryAndRecord(
        state,
        player,
        "doubleTrouble",
        targetPlayerId,
      );
      return {
        state: {
          ...next,
          pendingEffects: [...next.pendingEffects, { type: "doubleTurn", targetPlayerId }],
        },
        events: [
          {
            type: "POWER_UP_USED",
            playerId: player.id,
            powerUpId: "doubleTrouble",
            targetPlayerId,
          },
        ],
      };
    }

    case "luckyDice":
      throw new GameRuleViolation("Lucky Dice must be resolved by the engine, not this module.");
  }
}
