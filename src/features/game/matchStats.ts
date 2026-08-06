import type { ActiveMatch } from "@/game-engine/types";

export interface MatchSummaryStats {
  totalRounds: number;
  totalMoves: number;
  totalClicks: number;
  averageMove: number;
  largestMove: number;
  durationMs: number;
}

export function computeMatchStats(match: ActiveMatch): MatchSummaryStats {
  const totalMoves = match.moveHistory.length;
  const totalClicks = match.moveHistory.reduce((sum, move) => sum + move.appliedAmount, 0);
  const largestMove = match.moveHistory.reduce((max, move) => Math.max(max, move.appliedAmount), 0);
  const completedAt = match.completedAt ? new Date(match.completedAt).getTime() : Date.now();
  const startedAt = new Date(match.startedAt).getTime();

  return {
    totalRounds: match.roundHistory.length || match.currentRound,
    totalMoves,
    totalClicks,
    averageMove: totalMoves === 0 ? 0 : totalClicks / totalMoves,
    largestMove,
    durationMs: Math.max(0, completedAt - startedAt),
  };
}

export interface RankedPlayer {
  id: string;
  name: string;
  avatarId: string;
  colorId: string;
  placement: number;
}

/** Sorts players by placement (1 = champion); players with no placement yet sort last. */
export function rankPlayers(match: ActiveMatch): RankedPlayer[] {
  return [...match.players]
    .map((player) => ({
      id: player.id,
      name: player.name,
      avatarId: player.avatarId,
      colorId: player.colorId,
      placement: player.placement ?? match.players.length,
    }))
    .sort((a, b) => a.placement - b.placement);
}
