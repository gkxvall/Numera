import { getPowerUpDefinition } from "@/config/powerUps";
import type { ActiveMatch } from "@/game-engine/types";

export interface MatchLogProps {
  match: ActiveMatch;
  maxEntries?: number;
}

interface LogEntry {
  key: string;
  timestamp: string;
  label: string;
  detail: string;
}

export function MatchLog({ match, maxEntries = 5 }: MatchLogProps) {
  const moveEntries: LogEntry[] = match.moveHistory.map((move) => {
    const player = match.players.find((candidate) => candidate.id === move.playerId);
    return {
      key: move.id,
      timestamp: move.timestamp,
      label: `${player?.name ?? "Player"} played +${move.selectedAmount}`,
      detail: `${move.counterAfter}${move.reachedTarget ? " — hit!" : ""}`,
    };
  });

  const powerUpEntries: LogEntry[] = match.powerUpHistory.map((usage) => {
    const player = match.players.find((candidate) => candidate.id === usage.playerId);
    const definition = getPowerUpDefinition(usage.powerUpId);
    return {
      key: usage.id,
      timestamp: usage.timestamp,
      label: `${player?.name ?? "Player"} used ${definition.label}`,
      detail: "",
    };
  });

  const recent = [...moveEntries, ...powerUpEntries]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .slice(-maxEntries)
    .reverse();

  if (recent.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-foreground/60 text-xs font-semibold uppercase">Match log</h2>
      <ul className="flex flex-col gap-1 text-sm">
        {recent.map((entry) => (
          <li key={entry.key} className="text-foreground/80 flex justify-between gap-2">
            <span>{entry.label}</span>
            {entry.detail && <span className="font-semibold">{entry.detail}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
