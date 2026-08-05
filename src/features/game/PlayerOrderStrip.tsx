import { PlayerChip } from "@/components/PlayerChip";
import type { ActiveMatch } from "@/game-engine/types";

export interface PlayerOrderStripProps {
  match: ActiveMatch;
}

export function PlayerOrderStrip({ match }: PlayerOrderStripProps) {
  const activeId = match.playerOrder[match.activePlayerIndex];

  return (
    <div className="flex justify-center gap-3 overflow-x-auto py-2" aria-label="Player order">
      {match.playerOrder.map((playerId) => {
        const player = match.players.find((candidate) => candidate.id === playerId);
        if (!player) return null;
        return (
          <PlayerChip
            key={player.id}
            name={player.name}
            colorId={player.colorId}
            avatarId={player.avatarId}
            lives={player.lives}
            maxLives={player.maxLives}
            isActive={player.id === activeId}
            isEliminated={player.isEliminated}
            size="sm"
          />
        );
      })}
    </div>
  );
}
