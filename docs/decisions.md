# Numera — Architecture Decisions

Lightweight decision log (ADR-style). One entry per meaningful decision, newest first.

---

## ADR-0001 — Adopt the plan's recommended stack as-is

**Date:** 2026-08-05
**Status:** Accepted

**Context:** `docs/plan.md` §3 recommends Next.js, TypeScript, React, Tailwind CSS,
Framer Motion, Zustand, React Hook Form, Zod, Lucide React, Howler.js, with
Vitest/RTL/Playwright/ESLint/Prettier for quality, and Vercel for deployment. The
repository was empty at project start, so there is no existing/competing stack to
reconcile against.

**Decision:** Use the plan's stack verbatim for Stage 1 scaffolding.

**Why:** No existing code to preserve or conflict with; the recommended stack directly
supports the plan's hard requirements (deterministic, React-independent game engine;
strict TypeScript; mobile-first responsive UI; local persistence now, server-authoritative
groundwork later).

**Consequences:** Future stages build on Next.js App Router conventions and Zustand
store separation described in plan §18.

---

## ADR-0002 — Sequential, stage-gated implementation

**Date:** 2026-08-05
**Status:** Accepted

**Context:** The user's instructions and plan §35 require completing each stage's
acceptance criteria before starting the next, with small commits and verification
(lint/typecheck/test/build) at each step.

**Decision:** Track stages in `docs/tasks.md`; do not begin a later stage's tasks until
the current stage's completion checklist is met and verified.

**Why:** Prevents partially-implemented, unverifiable features from accumulating;
keeps the app runnable after every commit as required.

**Consequences:** Slower wall-clock progress per response, but each increment is safe to
stop at and safe to build on.

---

## ADR-0003 — Two-phase round resolution in the game engine

**Date:** 2026-08-05
**Status:** Accepted

**Context:** Plan §19.1 defines a `CONTINUE_AFTER_LOSS` command but doesn't specify
exactly when the engine should generate the next round's target — immediately on a
target hit, or only once the UI is ready to move on.

**Decision:** When a player hits the target, the engine moves the match to a
`round_ended` status (life already deducted, elimination/placement already resolved,
round already recorded) rather than immediately starting the next round. `SUBMIT_MOVE`
is rejected while `round_ended`. The next round (new target, counter reset, turn
advanced past the loser) is only generated when `CONTINUE_AFTER_LOSS` is dispatched.

**Why:** Gives Stage 6's elimination/victory UI a clean, engine-enforced place to play
its animation sequence before gameplay resumes, and closes a duplicate-submission
window during that animation — both called out explicitly in plan §21/§26/§27.

**Consequences:** UI code (Stage 5+) must dispatch `CONTINUE_AFTER_LOSS` after showing
the elimination sequence; forgetting to do so leaves the match stuck in `round_ended`.

---

## ADR-0004 — Classic and Multi-Life share one life-based engine core

**Date:** 2026-08-05
**Status:** Accepted

**Context:** Plan §7.1/§7.2 describe Classic Survival (1 life) and Multi-Life Survival
(2-5 lives) as separate game modes, but their rules are mechanically identical except
for `startingLives`. Score Rush, Reverse Countdown, Team Battle, and Chaos Mode (§7.3,
§7.5, §7.4, §7.7) are structurally different (scoring instead of lives, subtraction
instead of addition, team pooling, random events) and are explicitly Stage 8 work.

**Decision:** The Stage 3 engine implements one shared life-based core, driven entirely
by `MatchSettings.startingLives`, covering `"classic"`, `"multiLife"`, and
`"suddenDeath"` (a Classic variant with tighter settings, not a different mechanic).
Modes requiring different core mechanics are rejected by `createMatch` via an explicit
`IMPLEMENTED_GAME_MODES` allow-list until Stage 8 implements them, rather than silently
misbehaving under an unsupported mode.

**Why:** Avoids duplicating the same turn/life/elimination logic across two mode
implementations; keeps the engine honest about what's actually implemented versus what's
merely typed (`GameMode` includes all plan-defined modes for forward compatibility, but
only three are wired up).

**Consequences:** Stage 8 must extend the engine (new resolvers, not new copies of the
life-based core) rather than bolt on parallel logic for Score Rush/Reverse
Countdown/Team Battle/Chaos.

---

## ADR-0005 — Player reordering uses buttons, not drag-and-drop

**Date:** 2026-08-05
**Status:** Accepted

**Context:** Plan §15.4 lists "Drag-and-drop ordering" as one way to satisfy the Stage 4
"player reordering" task. True pointer-based drag-and-drop is hard to make keyboard- and
screen-reader-accessible without significant extra work (focus management, live-region
announcements of the new order, a non-pointer fallback anyway), and would add a
dependency.

**Decision:** `PlayerCard` exposes explicit "move up" / "move down" buttons instead of a
drag handle.

**Why:** Satisfies the actual task (players can be reordered) while being inherently
keyboard- and touch-accessible with zero extra dependencies, consistent with plan §23
("no gameplay action requires precise small tapping") and the "avoid unnecessary
dependencies" development principle. A future stage can add drag-and-drop as a
progressive enhancement on top of the same `reorderPlayers` store action without changing
its contract.

**Consequences:** None functionally; reordering is one extra tap per step versus a single
drag gesture.

---

## ADR-0006 — `bot-strategy.ts` built in Stage 4, ahead of its listed stage

**Date:** 2026-08-05
**Status:** Accepted

**Context:** Plan §19 lists `bot-strategy.ts` among the engine's files, but no
Development Stage (§31) explicitly schedules bot decision-making logic. Stage 4's task
list includes "Build bot creation," which is UI for adding a bot to the roster — but a
bot player with no way to actually choose a move would leave any match containing one
permanently stuck once gameplay UI (Stage 5) tries to advance to that bot's turn.

**Decision:** Implement `src/game-engine/bot-strategy.ts` now, in Stage 4, rather than
deferring it to whichever later stage might have implied it.

**Why:** "Add bot" must be a genuinely working control per the project's engineering
requirements ("no fake buttons or placeholder interactions," "every visible control must
work") — not just a data flag that silently breaks gameplay two stages later.
`BotDecisionContext` is deliberately typed without a `target` field so bots structurally
cannot see the secret target (plan §10.2), verified by a runtime test.

**Consequences:** Stage 5/7 can call `chooseBotMove` directly when it's a bot's turn
instead of needing to design and test bot logic under gameplay-UI time pressure.

---

## ADR-0007 — Gate round_ended/completed screens on the counter animation, not just match.status

**Date:** 2026-08-05
**Status:** Accepted

**Context:** The Stage 3 engine resolves a target hit synchronously: the same
`SUBMIT_MOVE` dispatch that lands on the target also flips `match.status` to
`round_ended` or `completed` (ADR-0003). The Stage 5 UI additionally animates the counter
ticking up to that final value client-side, after the fact, over a few hundred
milliseconds (`useSteppedCounter`). Gating the round-summary/winner screens purely on
`match.status` would swap them in _before_ the tick animation has a chance to play,
since the engine has already "finished" by the time the first tick fires.

**Decision:** `GameplayScreen` keeps rendering the in-progress gameplay layout whenever
`useSteppedCounter`'s `isAnimating` is still true, even if `match.status` has already
moved past `in_progress` — the round-summary and winner screens only appear once
`!isAnimating`.

**Why:** Otherwise the counter's climb to the target — the single most important visual
moment in the game (plan §15.7: "the shared counter must be the strongest visual
element") — would never actually be seen.

**Consequences:** Every screen that branches on `match.status` (this one, and future
Stage 6 elimination/victory screens) must remember to also check `isAnimating`, not
`status` alone. `TurnTimer` and the Pause button are additionally gated on
`status === "in_progress"` specifically, since they must stop operating the instant a
round ends even while the counter is still visually finishing its animation.
