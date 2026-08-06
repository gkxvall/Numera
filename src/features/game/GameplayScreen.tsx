"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { startNewMatch, useActiveMatchStore } from "@/stores/activeMatchStore";
import { buildBotDecisionContext, chooseBotMove } from "@/game-engine/bot-strategy";
import { createSecureRandomSource } from "@/game-engine/random";
import { getEffectiveMaxMove } from "@/game-engine/rules";
import { Counter } from "./Counter";
import { MoveButtons } from "./MoveButtons";
import { PassThePhoneScreen } from "./PassThePhoneScreen";
import { PlayerOrderStrip } from "./PlayerOrderStrip";
import { TurnTimer } from "./TurnTimer";
import { MatchLog } from "./MatchLog";
import { EliminationScreen } from "./EliminationScreen";
import { WinnerScreen } from "./WinnerScreen";
import { PowerUpInventory, type PowerUpActivation } from "./PowerUpInventory";
import { useSteppedCounter } from "./useSteppedCounter";
import { buildMatchFromCurrentSetup } from "./createMatchFromSetup";

const BOT_MOVE_DELAY_MS = 900;

export interface GameplayScreenProps {
  onReturnHome: () => void;
  onChangeSettings: () => void;
}

export function GameplayScreen({ onReturnHome, onChangeSettings }: GameplayScreenProps) {
  const match = useActiveMatchStore((state) => state.match);
  const dangerLevel = useActiveMatchStore((state) => state.dangerLevel);
  const lastError = useActiveMatchStore((state) => state.lastError);
  const lastEvents = useActiveMatchStore((state) => state.lastEvents);
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
  const [peekMessage, setPeekMessage] = useState<string | null>(null);
  const turnKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (turnKeyRef.current !== turnKey) {
      turnKeyRef.current = turnKey;
      setPhoneReady(activePlayer?.isBot ?? false);
      setPeekMessage(null);
    }
  }, [turnKey, activePlayer?.isBot]);

  useEffect(() => {
    // Subscribing to a new batch of events from the store, not deriving from current
    // props/state — lastEvents is a transient queue, so this can't be computed at render
    // time the way the lint rule's default heuristic expects.
    const peekEvent = lastEvents.find((event) => event.type === "PEEK_REVEALED");
    if (peekEvent?.type === "PEEK_REVEALED") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPeekMessage(`The number is between ${peekEvent.rangeMin} and ${peekEvent.rangeMax}.`);
    }
  }, [lastEvents]);

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

  function handleActivatePowerUp(playerId: string, activation: PowerUpActivation) {
    dispatch({ type: "USE_POWER_UP", playerId, ...activation });
  }

  function handlePlayAgain() {
    const newMatch = buildMatchFromCurrentSetup();
    startNewMatch(newMatch);
  }

  if (!match) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <h1 className="font-display text-foreground text-2xl">No match in progress</h1>
        <p className="text-foreground/70">Set up players and match settings to start one.</p>
        <Button onClick={onReturnHome}>Return home</Button>
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
            onReturnHome();
          }}
        >
          Return home
        </Button>
      </div>
    );
  }

  // Wait for the winning move's tick animation to finish before showing the summary —
  // the engine already resolved round_ended/completed in the same dispatch as the move.
  if (match.status === "completed" && !isAnimating) {
    return (
      <WinnerScreen
        match={match}
        onPlayAgain={handlePlayAgain}
        onChangeSettings={() => {
          abandonAndClear();
          onChangeSettings();
        }}
        onReturnHome={() => {
          abandonAndClear();
          onReturnHome();
        }}
      />
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
    return (
      <EliminationScreen
        match={match}
        onContinue={() => dispatch({ type: "CONTINUE_AFTER_LOSS" })}
      />
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
        {peekMessage && <Badge tone="purple">{peekMessage}</Badge>}
        {!activePlayer.isBot && (
          <MoveButtons
            maxMove={getEffectiveMaxMove(match, activePlayer.id).maxMove}
            disabled={isAnimating}
            onSelect={(amount) =>
              dispatch({ type: "SUBMIT_MOVE", playerId: activePlayer.id, amount })
            }
          />
        )}
        {!activePlayer.isBot && match.settings.powerUpsEnabled && (
          <PowerUpInventory
            player={activePlayer}
            otherActivePlayers={match.players.filter(
              (player) => player.id !== activePlayer.id && !player.isEliminated,
            )}
            disabled={isAnimating}
            onActivate={(activation) => handleActivatePowerUp(activePlayer.id, activation)}
          />
        )}
      </div>

      <Card padding="sm">
        <MatchLog match={match} />
      </Card>
    </div>
  );
}
