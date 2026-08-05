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
