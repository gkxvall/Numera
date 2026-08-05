"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { useActiveMatchStore } from "@/stores/activeMatchStore";
import { buildBotDecisionContext, chooseBotMove } from "@/game-engine/bot-strategy";
import { createSecureRandomSource } from "@/game-engine/random";
import { Counter } from "./Counter";
import { MoveButtons } from "./MoveButtons";
import { PassThePhoneScreen } from "./PassThePhoneScreen";
import { PlayerOrderStrip } from "./PlayerOrderStrip";
import { TurnTimer } from "./TurnTimer";
import { MatchLog } from "./MatchLog";
import { useSteppedCounter } from "./useSteppedCounter";

const BOT_MOVE_DELAY_MS = 900;

export interface GameplayScreenProps {
  onExit: () => void;
}

export function GameplayScreen({ onExit }: GameplayScreenProps) {
  const match = useActiveMatchStore((state) => state.match);
  const dangerLevel = useActiveMatchStore((state) => state.dangerLevel);
  const lastError = useActiveMatchStore((state) => state.lastError);
  const clearError = useActiveMatchStore((state) => state.clearError);
  const dispatch = useActiveMatchStore((state) => state.dispatch);
  const abandonAndClear = useActiveMatchStore((state) => state.abandonAndClear);

  const reducedMotion = useReducedMotion() ?? false;
  const { displayCounter, isAnimating } = useSteppedCounter(match, reducedMotion);

  const activePlayer = match
    ? match.players.find((player) => player.id === match.playerOrder[match.activePlayerIndex])
    : undefined;

  const turnKey = match ? `${match.id}:${match.currentRound}:${match.activePlayerIndex}` : "none";

  const [phoneReady, setPhoneReady] = useState(false);
  const turnKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (turnKeyRef.current !== turnKey) {
      turnKeyRef.current = turnKey;
      setPhoneReady(activePlayer?.isBot ?? false);
    }
  }, [turnKey, activePlayer?.isBot]);

  const botMovedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!match || match.status !== "in_progress" || !activePlayer?.isBot || isAnimating) return;
    if (botMovedRef.current === turnKey) return;

    const timeout = setTimeout(() => {
      const current = useActiveMatchStore.getState().match;
      if (!current || current.status !== "in_progress") return;
      const currentActiveId = current.playerOrder[current.activePlayerIndex];
      if (currentActiveId !== activePlayer.id) return;

      botMovedRef.current = turnKey;
      const context = buildBotDecisionContext(current, activePlayer.id);
      const amount = chooseBotMove(
        context,
        activePlayer.botDifficulty ?? current.settings.botDifficulty,
        createSecureRandomSource(),
      );
      dispatch({ type: "SUBMIT_MOVE", playerId: activePlayer.id, amount });
    }, BOT_MOVE_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [match, activePlayer, isAnimating, turnKey, dispatch]);

  const handleTimeout = useCallback(() => {
    const current = useActiveMatchStore.getState().match;
    if (!current) return;
    const activeId = current.playerOrder[current.activePlayerIndex];
    if (!activeId) return;
    useActiveMatchStore.getState().dispatch({ type: "TURN_TIMEOUT", playerId: activeId });
  }, []);

  if (!match) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <h1 className="font-display text-foreground text-2xl">No match in progress</h1>
        <p className="text-foreground/70">Set up players and match settings to start one.</p>
        <Button onClick={onExit}>Set up a match</Button>
      </div>
    );
  }

  if (match.status === "abandoned") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <h1 className="font-display text-foreground text-2xl">Match abandoned</h1>
        <Button
          onClick={() => {
            abandonAndClear();
            onExit();
          }}
        >
          Back to setup
        </Button>
      </div>
    );
  }

  // Wait for the winning move's tick animation to finish before showing the summary —
  // the engine already resolved round_ended/completed in the same dispatch as the move.
  if (match.status === "completed" && !isAnimating) {
    const winner = match.players.find((player) => player.id === match.winnerId);
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <Badge tone="green">Match complete</Badge>
        <h1 className="font-display text-foreground text-3xl">
          {winner?.name ?? "A player"} wins!
        </h1>
        <p className="text-foreground/60 text-sm">
          The full victory celebration (confetti, rankings, rewards) arrives in Stage 6.
        </p>
        <Button
          onClick={() => {
            abandonAndClear();
            onExit();
          }}
        >
          Back to setup
        </Button>
      </div>
    );
  }

  if (match.status === "paused") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <h1 className="font-display text-foreground text-2xl">Match paused</h1>
        <Button onClick={() => dispatch({ type: "RESUME_MATCH" })}>Resume</Button>
      </div>
    );
  }

  if (match.status === "round_ended" && !isAnimating) {
    const lastRound = match.roundHistory[match.roundHistory.length - 1];
    const loser = match.players.find((player) => player.id === lastRound?.loserPlayerId);
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <Badge tone="red">Round {match.currentRound} over</Badge>
        <h1 className="font-display text-foreground text-2xl">
          {loser?.name ?? "A player"}{" "}
          {lastRound?.eliminatedPlayerId ? "was eliminated!" : "lost a life."}
        </h1>
        <p className="text-foreground/60 text-sm">
          The full elimination sequence arrives in Stage 6 — this confirms the round result and lets
          you continue.
        </p>
        <Button size="lg" onClick={() => dispatch({ type: "CONTINUE_AFTER_LOSS" })}>
          Continue
        </Button>
      </div>
    );
  }

  // in_progress
  if (!activePlayer) {
    return null;
  }

  if (!phoneReady) {
    return (
      <PassThePhoneScreen
        player={activePlayer}
        round={match.currentRound}
        onReady={() => setPhoneReady(true)}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {lastError && (
        <div
          role="alert"
          className="bg-numera-red flex items-center justify-between rounded-xl px-4 py-2 text-sm text-white"
        >
          <span>{lastError}</span>
          <button type="button" onClick={clearError} className="font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Badge tone="neutral">Round {match.currentRound}</Badge>
        <div className="flex items-center gap-2">
          {match.status === "in_progress" && (
            <>
              <TurnTimer
                seconds={match.settings.turnTimerSeconds}
                turnKey={turnKey}
                paused={isAnimating}
                onTimeout={handleTimeout}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => dispatch({ type: "PAUSE_MATCH" })}
                aria-label="Pause match"
              >
                Pause
              </Button>
            </>
          )}
        </div>
      </div>

      <PlayerOrderStrip match={match} />

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <Counter value={displayCounter} dangerLevel={dangerLevel} />
        <p className="text-foreground/70 text-sm">
          {activePlayer.name}
          {activePlayer.isBot ? " is thinking…" : ", choose your move"}
        </p>
        {!activePlayer.isBot && (
          <MoveButtons
            maxMove={match.settings.maxMove}
            disabled={isAnimating}
            onSelect={(amount) =>
              dispatch({ type: "SUBMIT_MOVE", playerId: activePlayer.id, amount })
            }
          />
        )}
      </div>

      <Card padding="sm">
        <MatchLog match={match} />
      </Card>
    </div>
  );
}
