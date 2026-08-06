"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import type { ActiveMatch } from "@/game-engine/types";
import { ShakeOnMount } from "./ShakeOnMount";

export interface EliminationScreenProps {
  match: ActiveMatch;
  onContinue: () => void;
}

export function EliminationScreen({ match, onContinue }: EliminationScreenProps) {
  const reducedMotion = useReducedMotion();
  const lastRound = match.roundHistory[match.roundHistory.length - 1];
  const loser = match.players.find((player) => player.id === lastRound?.loserPlayerId);
  const wasEliminated = Boolean(lastRound?.eliminatedPlayerId);

  return (
    <ShakeOnMount>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <Badge tone="red">Round {match.currentRound} over</Badge>

        {loser && (
          <motion.div
            initial={reducedMotion ? false : { scale: 1.4, rotate: -12, opacity: 0.6 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <Avatar
              avatarId={loser.avatarId}
              colorId={loser.colorId}
              size={100}
              title={loser.name}
              className={wasEliminated ? "opacity-70 grayscale" : undefined}
            />
          </motion.div>
        )}

        <h1 className="font-display text-foreground text-2xl">
          {loser?.name ?? "A player"} {wasEliminated ? "was eliminated!" : "lost a life."}
        </h1>

        {lastRound && (
          <p className="text-foreground/70 text-sm">
            The number was <span className="font-bold">{lastRound.target}</span>.
          </p>
        )}

        {!wasEliminated && loser && (
          <p className="text-foreground/60 text-sm">
            {loser.lives} {loser.lives === 1 ? "life" : "lives"} remaining
          </p>
        )}

        <Button size="lg" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </ShakeOnMount>
  );
}
