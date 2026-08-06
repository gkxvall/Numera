"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import type { ActiveMatch } from "@/game-engine/types";
import { ConfettiBurst } from "./ConfettiBurst";
import { computeMatchStats, rankPlayers } from "./matchStats";

export interface WinnerScreenProps {
  match: ActiveMatch;
  onPlayAgain: () => void;
  onChangeSettings: () => void;
  onReturnHome: () => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export function WinnerScreen({
  match,
  onPlayAgain,
  onChangeSettings,
  onReturnHome,
}: WinnerScreenProps) {
  const winner = match.players.find((player) => player.id === match.winnerId);
  const stats = computeMatchStats(match);
  const ranking = rankPlayers(match);

  return (
    <div className="flex flex-1 flex-col items-center gap-6 overflow-y-auto py-4 text-center">
      <ConfettiBurst />

      <Badge tone="green">Match complete</Badge>

      {winner && (
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
        >
          <Avatar
            avatarId={winner.avatarId}
            colorId={winner.colorId}
            size={120}
            title={winner.name}
          />
        </motion.div>
      )}

      <h1 className="font-display text-numera-outline text-4xl">
        {winner?.name ?? "A player"} wins!
      </h1>

      <Card className="flex w-full max-w-xs flex-col gap-2 text-left">
        <h2 className="text-foreground/60 text-xs font-semibold uppercase">Final ranking</h2>
        {ranking.map((player) => (
          <div key={player.id} className="flex items-center gap-3">
            <span className="font-display text-foreground/50 w-6 text-lg">{player.placement}</span>
            <Avatar avatarId={player.avatarId} colorId={player.colorId} size={32} />
            <span className="text-foreground flex-1 font-semibold">{player.name}</span>
          </div>
        ))}
      </Card>

      <Card className="flex w-full max-w-xs flex-col gap-2 text-left">
        <h2 className="text-foreground/60 text-xs font-semibold uppercase">Match statistics</h2>
        <Stat label="Rounds played" value={stats.totalRounds} />
        <Stat label="Total moves" value={stats.totalMoves} />
        <Stat label="Total clicks" value={stats.totalClicks} />
        <Stat label="Average move" value={stats.averageMove.toFixed(1)} />
        <Stat label="Largest move" value={`+${stats.largestMove}`} />
        <Stat label="Duration" value={formatDuration(stats.durationMs)} />
      </Card>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button size="lg" onClick={onPlayAgain} fullWidth>
          Play again — same players
        </Button>
        <Button variant="secondary" onClick={onChangeSettings} fullWidth>
          Change settings
        </Button>
        <Button variant="ghost" onClick={onReturnHome} fullWidth>
          Return home
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-foreground/70">{label}</span>
      <span className="text-foreground font-semibold">{value}</span>
    </div>
  );
}
