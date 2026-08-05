import { z } from "zod";

export const botDifficultySchema = z.enum([
  "random",
  "careful",
  "aggressive",
  "trickster",
  "balanced",
]);

export const playerDraftSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Enter a name").max(16, "Names can be at most 16 characters"),
  avatarId: z.string().min(1),
  colorId: z.string().min(1),
  isBot: z.boolean(),
  botDifficulty: botDifficultySchema.optional(),
});

export type PlayerDraft = z.infer<typeof playerDraftSchema>;

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 10;

export const playerRosterSchema = z
  .array(playerDraftSchema)
  .min(MIN_PLAYERS, `Add at least ${MIN_PLAYERS} players`)
  .max(MAX_PLAYERS, `Numera supports up to ${MAX_PLAYERS} players`);

/** Blank names fall back to "Player N" (plan §10.1) rather than blocking setup. */
export function normalizePlayerName(name: string, index: number): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 16) : `Player ${index + 1}`;
}
