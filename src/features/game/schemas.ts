import { z } from "zod";
import { IMPLEMENTED_GAME_MODES } from "@/game-engine/types";
import { playerRosterSchema } from "@/features/players/schemas";

export const gameModeSchema = z.enum([
  "classic",
  "multiLife",
  "scoreRush",
  "reverseCountdown",
  "teamBattle",
  "suddenDeath",
  "chaos",
]);

export const timeoutBehaviorSchema = z.enum([
  "applyPlusOne",
  "skipTurn",
  "losePoint",
  "loseLife",
  "randomMove",
]);

export const botDifficultySchema = z.enum([
  "random",
  "careful",
  "aggressive",
  "trickster",
  "balanced",
]);

export const targetRangeSchema = z
  .object({
    min: z.number().int().min(5).max(300),
    max: z.number().int().min(5).max(300),
  })
  .refine((range) => range.max > range.min, {
    message: "Maximum target must be greater than minimum target",
    path: ["max"],
  });

export const matchSettingsSchema = z
  .object({
    mode: gameModeSchema,
    startingLives: z.number().int().min(1).max(5),
    targetRange: targetRangeSchema,
    maxMove: z.number().int().min(1).max(6),
    turnTimerSeconds: z.number().int().min(3).max(60).nullable(),
    timeoutBehavior: timeoutBehaviorSchema,
    randomizePlayerOrder: z.boolean(),
    dangerIndicatorEnabled: z.boolean(),
    powerUpsEnabled: z.boolean(),
    specialEventsEnabled: z.boolean(),
    adaptiveTargetRange: z.boolean(),
    botDifficulty: botDifficultySchema,
  })
  .refine((settings) => (IMPLEMENTED_GAME_MODES as readonly string[]).includes(settings.mode), {
    message: "This game mode isn't available yet",
    path: ["mode"],
  });

export type MatchSettingsInput = z.infer<typeof matchSettingsSchema>;

export const matchConfigSchema = z.object({
  matchName: z.string().trim().max(40, "Match name must be 40 characters or fewer").optional(),
  players: playerRosterSchema,
  settings: matchSettingsSchema,
});

export type MatchConfigInput = z.infer<typeof matchConfigSchema>;
