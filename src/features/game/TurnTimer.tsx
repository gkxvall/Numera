"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/Badge";

export interface TurnTimerProps {
  /** Seconds configured for the turn, or `null` when the timer is disabled (plan §21). */
  seconds: number | null;
  /** A value that changes exactly once per turn — resets the clock when it changes. */
  turnKey: string;
  /** True while the counter is animating, the match is paused, etc. — freezes the clock. */
  paused: boolean;
  /** Must be a stable reference (e.g. wrapped in useCallback) — see effect dependency note. */
  onTimeout: () => void;
}

/**
 * A single, self-contained countdown per turn. Resets on `turnKey` change, freezes while
 * `paused`, and fires `onTimeout` exactly once per turn via `firedRef` — this is what
 * prevents the duplicate-timeout race condition called out in plan §21/§26.
 */
export function TurnTimer({ seconds, turnKey, paused, onTimeout }: TurnTimerProps) {
  const [remaining, setRemaining] = useState(seconds ?? 0);
  const firedRef = useRef(false);
  const turnKeyRef = useRef(turnKey);

  useEffect(() => {
    if (turnKeyRef.current !== turnKey) {
      turnKeyRef.current = turnKey;
      firedRef.current = false;
      setRemaining(seconds ?? 0);
      return;
    }

    if (seconds === null || paused || firedRef.current) return;

    if (remaining <= 0) {
      firedRef.current = true;
      onTimeout();
      return;
    }

    const timeout = setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => clearTimeout(timeout);
  }, [turnKey, seconds, paused, remaining, onTimeout]);

  if (seconds === null) return null;

  const isWarning = remaining <= 3;

  return (
    <Badge
      tone={isWarning ? "red" : "neutral"}
      className={isWarning ? "animate-pulse" : undefined}
      aria-live="polite"
    >
      {remaining}s
    </Badge>
  );
}
