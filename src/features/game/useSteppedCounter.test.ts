import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSteppedCounter } from "./useSteppedCounter";
import { applyCommand, createMatch } from "@/game-engine/engine";
import { createSeededRandomSource } from "@/game-engine/random";
import { makeTestPlayers, makeTestSettings } from "@/game-engine/test-helpers";
import type { ActiveMatch } from "@/game-engine/types";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function started(overrides: Parameters<typeof makeTestSettings>[0] = {}): ActiveMatch {
  const match = createMatch("m1", makeTestSettings(overrides), makeTestPlayers(2));
  const random = createSeededRandomSource(1);
  return applyCommand(match, { type: "START_MATCH" }, random).state;
}

describe("useSteppedCounter", () => {
  it("snaps to the match's counter on initial mount without animating", () => {
    const match = started({ targetRange: { min: 90, max: 100 } });
    const { result } = renderHook(({ m }) => useSteppedCounter(m, false), {
      initialProps: { m: match },
    });

    expect(result.current.displayCounter).toBe(match.counter);
    expect(result.current.isAnimating).toBe(false);
  });

  it("animates one tick at a time when a move lands, then settles on the final value", () => {
    const match = started({ targetRange: { min: 90, max: 100 } });
    const random = createSeededRandomSource(1);
    const afterMove = applyCommand(
      match,
      { type: "SUBMIT_MOVE", playerId: match.playerOrder[0]!, amount: 3 },
      random,
    ).state;

    const { result, rerender } = renderHook(({ m }) => useSteppedCounter(m, false), {
      initialProps: { m: match },
    });

    rerender({ m: afterMove });
    expect(result.current.isAnimating).toBe(true);
    expect(result.current.displayCounter).toBe(match.counter); // not yet ticked

    act(() => {
      vi.advanceTimersByTime(180);
    });
    expect(result.current.displayCounter).toBe(match.counter + 1);
    expect(result.current.isAnimating).toBe(true);

    act(() => {
      vi.advanceTimersByTime(180 * 2);
    });
    expect(result.current.displayCounter).toBe(afterMove.counter);
    expect(result.current.isAnimating).toBe(false);
  });

  it("jumps straight to the final value when reduced motion is preferred", () => {
    const match = started({ targetRange: { min: 90, max: 100 } });
    const random = createSeededRandomSource(1);
    const afterMove = applyCommand(
      match,
      { type: "SUBMIT_MOVE", playerId: match.playerOrder[0]!, amount: 3 },
      random,
    ).state;

    const { result, rerender } = renderHook(({ m }) => useSteppedCounter(m, true), {
      initialProps: { m: match },
    });

    rerender({ m: afterMove });
    expect(result.current.displayCounter).toBe(afterMove.counter);
    expect(result.current.isAnimating).toBe(false);
  });

  it("snaps instantly on a new round instead of animating from the previous round's counter", () => {
    // Tiny range so a single move guarantees a target hit and, in multi-life mode, a
    // round_ended -> CONTINUE_AFTER_LOSS transition to a fresh round.
    const match = started({
      mode: "multiLife",
      startingLives: 2,
      targetRange: { min: 2, max: 2 },
    });
    const random = createSeededRandomSource(1);
    const afterHit = applyCommand(
      match,
      { type: "SUBMIT_MOVE", playerId: match.playerOrder[0]!, amount: 2 },
      random,
    ).state;
    expect(afterHit.status).toBe("round_ended");
    const nextRound = applyCommand(afterHit, { type: "CONTINUE_AFTER_LOSS" }, random).state;
    expect(nextRound.currentRound).toBe(2);
    expect(nextRound.counter).toBe(0);

    const { result, rerender } = renderHook(({ m }) => useSteppedCounter(m, false), {
      initialProps: { m: match },
    });

    rerender({ m: afterHit });
    rerender({ m: nextRound });

    // No pending timers, and the value is the new round's counter (0), not an animation
    // artifact from the previous round.
    expect(result.current.displayCounter).toBe(0);
    expect(result.current.isAnimating).toBe(false);
  });

  it("does not throw when the match becomes null", () => {
    const match = started();
    const { rerender } = renderHook(({ m }) => useSteppedCounter(m, false), {
      initialProps: { m: match as ActiveMatch | null },
    });
    expect(() => rerender({ m: null })).not.toThrow();
  });
});
