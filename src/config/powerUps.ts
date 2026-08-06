import type { PowerUpId } from "@/game-engine/types";

export interface PowerUpDefinition {
  id: PowerUpId;
  label: string;
  description: string;
  needsTargetPlayer?: boolean;
  needsAmount?: { min: number; max: number };
}

export const POWER_UP_DEFINITIONS: readonly PowerUpDefinition[] = [
  {
    id: "shield",
    label: "Shield",
    description:
      "Protects you from one losing hit this turn. If you'd hit the target, you survive and keep your life.",
  },
  {
    id: "peek",
    label: "Peek",
    description:
      "Reveals an approximate zone the secret number falls within — not the exact number.",
  },
  {
    id: "reverse",
    label: "Reverse",
    description: "Reverses the turn order.",
  },
  {
    id: "freeze",
    label: "Freeze",
    description: "The next player may only choose +1 on their turn.",
  },
  {
    id: "boost",
    label: "Boost",
    description: "Lets you choose one move value higher than usual this turn.",
  },
  {
    id: "skip",
    label: "Skip",
    description: "Skip your turn without changing the counter.",
  },
  {
    id: "swap",
    label: "Swap",
    description: "Swap turn positions with another active player.",
    needsTargetPlayer: true,
  },
  {
    id: "counterPushback",
    label: "Pushback",
    description: "Subtract 1 or 2 from the counter (never below zero).",
    needsAmount: { min: 1, max: 2 },
  },
  {
    id: "scramble",
    label: "Scramble",
    description: "Randomizes the turn order.",
  },
  {
    id: "doubleTrouble",
    label: "Double Trouble",
    description: "Forces the next player to take two turns in a row.",
  },
  {
    id: "luckyDice",
    label: "Lucky Dice",
    description: "Randomly makes a move for you within the allowed range.",
  },
];

export function getPowerUpDefinition(id: PowerUpId): PowerUpDefinition {
  const found = POWER_UP_DEFINITIONS.find((definition) => definition.id === id);
  if (!found) throw new Error(`Unknown power-up: ${id}`);
  return found;
}

export const DEFAULT_POWER_UP_INVENTORY_SIZE = 2;
