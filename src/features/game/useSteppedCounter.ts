import { useEffect, useRef, useState } from "react";
import type { ActiveMatch } from "@/game-engine/types";

export interface SteppedCounterResult {
  displayCounter: number;
  isAnimating: boolean;
}

const STEP_MS = 180;

/**
 * Animates the shared counter one click at a time when a move lands (plan §6.3: "Animate
 * the counter increasing one unit at a time"), while instantly snapping on round changes
 * (a fresh round, or the initial mount / a page refresh mid-match) rather than replaying
 * history. `isAnimating` should disable move input until the tick sequence finishes —
 * that's what stops a second tap from landing mid-animation (plan §21, §26). Callers
 * should also keep showing the in-progress layout while `isAnimating` is true even after
 * `match.status` has already flipped to "round_ended"/"completed" (the engine resolves
 * both in the same dispatch as the winning move) so the tick-up is actually visible
 * before a summary screen takes over.
 */
export function useSteppedCounter(
  match: ActiveMatch | null,
  reducedMotion: boolean,
): SteppedCounterResult {
  const [tickValue, setTickValue] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const lastMoveCountRef = useRef<number>(match?.moveHistory.length ?? 0);
  const lastRoundKeyRef = useRef<string | null>(match ? `${match.id}:${match.currentRound}` : null);

  useEffect(() => {
    if (!match) return;

    const roundKey = `${match.id}:${match.currentRound}`;

    if (roundKey !== lastRoundKeyRef.current) {
      lastRoundKeyRef.current = roundKey;
      lastMoveCountRef.current = match.moveHistory.length;
      // A new round pre-empts any animation left running from the previous one (e.g. the
      // round ended and the player already tapped Continue before the tick sequence for
      // the winning move finished).
      setIsAnimating(false);
      setTickValue(null);
      return;
    }

    if (match.moveHistory.length <= lastMoveCountRef.current) {
      return;
    }

    const move = match.moveHistory[match.moveHistory.length - 1];
    lastMoveCountRef.current = match.moveHistory.length;
    if (!move || reducedMotion) return;

    // Marks the start of the interval-driven tick sequence below, seeded at the move's
    // starting value so the very first render shows where the count is ticking *from*,
    // not the final value the underlying match state already jumped to. Deferring this
    // into a callback would open exactly the duplicate-move window this flag exists to
    // close (plan §21, §26), so it's intentionally synchronous here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAnimating(true);
    setTickValue(move.counterBefore);

    let current = move.counterBefore;
    const interval = setInterval(() => {
      current += 1;
      setTickValue(current);
      if (current >= move.counterAfter) {
        clearInterval(interval);
        setIsAnimating(false);
        setTickValue(null);
      }
    }, STEP_MS);

    return () => clearInterval(interval);
  }, [match, reducedMotion]);

  const displayCounter = tickValue ?? match?.counter ?? 0;
  return { displayCounter, isAnimating };
}
