import type { ActiveMatch } from "@/game-engine/types";

export interface MatchLogProps {
  match: ActiveMatch;
  maxEntries?: number;
}

export function MatchLog({ match, maxEntries = 5 }: MatchLogProps) {
  const recent = match.moveHistory.slice(-maxEntries).reverse();

  if (recent.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-foreground/60 text-xs font-semibold uppercase">Match log</h2>
      <ul className="flex flex-col gap-1 text-sm">
        {recent.map((move) => {
          const player = match.players.find((candidate) => candidate.id === move.playerId);
          return (
            <li key={move.id} className="text-foreground/80 flex justify-between gap-2">
              <span>
                {player?.name ?? "Player"} played +{move.selectedAmount}
              </span>
              <span className="font-semibold">
                {move.counterAfter}
                {move.reachedTarget && " — hit!"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
