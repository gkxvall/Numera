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
