import { useMatchSetupStore, normalizeNamesForValidation } from "@/stores/matchSetupStore";
import { createMatch, createPlayer } from "@/game-engine/engine";
import type { ActiveMatch } from "@/game-engine/types";

/** Builds a fresh (not-yet-started) match from whatever is currently in matchSetupStore. */
export function buildMatchFromCurrentSetup(): ActiveMatch {
  const { players, settings } = useMatchSetupStore.getState();
  const normalizedPlayers = normalizeNamesForValidation(players);
  const enginePlayers = normalizedPlayers.map((player) =>
    createPlayer({
      id: player.id,
      name: player.name,
      avatarId: player.avatarId,
      colorId: player.colorId,
      isBot: player.isBot,
      botDifficulty: player.botDifficulty,
    }),
  );
  return createMatch(crypto.randomUUID(), settings, enginePlayers);
}
