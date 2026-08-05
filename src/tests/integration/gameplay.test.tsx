import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameplayScreen } from "@/features/game/GameplayScreen";
import { startNewMatch, useActiveMatchStore } from "@/stores/activeMatchStore";
import { createMatch, createPlayer } from "@/game-engine/engine";
import { makeTestSettings } from "@/game-engine/test-helpers";

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  // Reduced motion makes the counter snap instantly instead of ticking on a real
  // interval, keeping these flow-level tests fast and deterministic. The tick
  // animation itself is covered by useSteppedCounter.test.ts.
  return { ...actual, useReducedMotion: () => true };
});

function twoHumans() {
  return [
    createPlayer({ id: "p1", name: "Maya", avatarId: "spike", colorId: "blue" }),
    createPlayer({ id: "p2", name: "Theo", avatarId: "grin", colorId: "red" }),
  ];
}

beforeEach(() => {
  localStorage.clear();
  useActiveMatchStore.setState({ match: null, lastEvents: [], lastError: null, dangerLevel: null });
});

describe("GameplayScreen — full match flow", () => {
  it("plays a complete 2-player Classic match from setup through to a winner", async () => {
    const user = userEvent.setup();
    const match = createMatch(
      "m1",
      makeTestSettings({ targetRange: { min: 2, max: 2 }, turnTimerSeconds: null }),
      twoHumans(),
    );
    startNewMatch(match);

    render(<GameplayScreen onExit={vi.fn()} />);

    // Pass-the-phone gate for the first player.
    const firstActiveId = useActiveMatchStore.getState().match!.playerOrder[0]!;
    const firstName = useActiveMatchStore
      .getState()
      .match!.players.find((p) => p.id === firstActiveId)!.name;
    expect(screen.getByText(firstName)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tap when ready" }));

    // First player moves +2 and hits the target — Classic mode eliminates them
    // immediately, ending the match right away (no round-summary step needed).
    await user.click(screen.getByRole("button", { name: "+2" }));

    await waitFor(() => {
      expect(useActiveMatchStore.getState().match!.status).toBe("completed");
    });

    expect(await screen.findByText("Match complete")).toBeInTheDocument();
    const winnerId = useActiveMatchStore.getState().match!.winnerId;
    expect(winnerId).toBeDefined();
    expect(winnerId).not.toBe(firstActiveId);
  });

  it("plays through a round_ended transition in multi-life mode via the Continue button", async () => {
    const user = userEvent.setup();
    const match = createMatch(
      "m1",
      makeTestSettings({
        mode: "multiLife",
        startingLives: 2,
        targetRange: { min: 2, max: 2 },
        turnTimerSeconds: null,
      }),
      twoHumans(),
    );
    startNewMatch(match);

    render(<GameplayScreen onExit={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Tap when ready" }));
    await user.click(screen.getByRole("button", { name: "+2" }));

    expect(await screen.findByText(/lost a life\.|was eliminated!/)).toBeInTheDocument();
    expect(useActiveMatchStore.getState().match!.status).toBe("round_ended");

    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      const current = useActiveMatchStore.getState().match!;
      expect(current.status).toBe("in_progress");
      expect(current.currentRound).toBe(2);
    });
  });

  it("never lets a rapid double-tap submit two moves (no duplicate moves)", async () => {
    const user = userEvent.setup();
    const match = createMatch(
      "m1",
      makeTestSettings({ targetRange: { min: 90, max: 100 }, turnTimerSeconds: null }),
      twoHumans(),
    );
    startNewMatch(match);

    render(<GameplayScreen onExit={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Tap when ready" }));

    const moveButton = screen.getByRole("button", { name: "+1" });
    await user.click(moveButton);

    // Turn passes to the other player immediately (reduced motion => no visible
    // animation window), so the same +1 button now belongs to a different turn and a
    // second rapid click must not double-apply the first player's move.
    expect(useActiveMatchStore.getState().match!.counter).toBe(1);
    expect(useActiveMatchStore.getState().match!.moveHistory).toHaveLength(1);
  });

  it("recovers an in-progress match after a simulated page refresh", async () => {
    const match = createMatch(
      "m1",
      makeTestSettings({ targetRange: { min: 90, max: 100 } }),
      twoHumans(),
    );
    startNewMatch(match);
    const activeId = useActiveMatchStore.getState().match!.playerOrder[0]!;
    useActiveMatchStore.getState().dispatch({ type: "SUBMIT_MOVE", playerId: activeId, amount: 3 });
    expect(useActiveMatchStore.getState().match!.counter).toBe(3);

    // A real refresh re-executes every module from scratch. Re-importing the store
    // module (without touching localStorage) is the faithful way to simulate that —
    // simply calling setState(null) would also re-persist the cleared value, since
    // the persist middleware writes on every change.
    vi.resetModules();
    const fresh = await import("@/stores/activeMatchStore");

    await waitFor(() => {
      expect(fresh.useActiveMatchStore.getState().match).not.toBeNull();
    });
    expect(fresh.useActiveMatchStore.getState().match!.counter).toBe(3);
    expect(fresh.useActiveMatchStore.getState().match!.id).toBe("m1");
  });
});

describe("GameplayScreen — bots", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("skips the pass-the-phone gate for a bot's turn and lets it move on its own", async () => {
    const players = [
      createPlayer({ id: "p1", name: "Maya", avatarId: "spike", colorId: "blue" }),
      createPlayer({
        id: "p2",
        name: "Bot Bot",
        avatarId: "grin",
        colorId: "red",
        isBot: true,
        botDifficulty: "random",
      }),
    ];
    const match = createMatch(
      "m1",
      makeTestSettings({ targetRange: { min: 90, max: 100 }, turnTimerSeconds: null }),
      players,
    );
    startNewMatch(match);

    // Force Maya to be first so the bot's automatic move is what we're observing.
    if (useActiveMatchStore.getState().match!.playerOrder[0] !== "p1") {
      useActiveMatchStore.setState((state) => ({
        match: state.match
          ? { ...state.match, playerOrder: ["p1", "p2"], activePlayerIndex: 0 }
          : state.match,
      }));
    }

    render(<GameplayScreen onExit={vi.fn()} />);
    await act(async () => {
      await userEvent
        .setup({ delay: null })
        .click(screen.getByRole("button", { name: "Tap when ready" }));
    });
    await act(async () => {
      await userEvent.setup({ delay: null }).click(screen.getByRole("button", { name: "+1" }));
    });

    // It's now the bot's turn — no pass-the-phone gate, no move buttons for the human.
    expect(screen.queryByRole("button", { name: "Tap when ready" })).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    await waitFor(() => {
      expect(useActiveMatchStore.getState().match!.moveHistory.length).toBeGreaterThanOrEqual(2);
    });
  });
});
