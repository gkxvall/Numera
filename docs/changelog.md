# Numera — Changelog

All notable changes to this project are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- `docs/tasks.md` — full stage-by-stage task tracker derived from `docs/plan.md`.
- `docs/known-issues.md` — open issues and risk watch list.
- `docs/decisions.md` — architecture decision log (ADR-0001, ADR-0002).
- `docs/changelog.md` — this file.
- Stage 1 foundation: Next.js 16 App Router + TypeScript strict mode, Tailwind v4 with
  Numera design tokens, ESLint + Prettier, Vitest/RTL + Playwright test tooling.
- `src/` directory structure per plan §19 (`game-engine/`, `features/`, `stores/`, etc.),
  documented in `docs/architecture.md`.
- `.env.example`, `CONTRIBUTING.md`, and a real project `README.md`.
- `.github/workflows/ci.yml` — CI running lint, typecheck, format check, unit tests, and
  build on every push/PR to `main`, plus a Playwright e2e job.

### Stage 1 — Repository and foundation: complete

All Stage 1 tasks and acceptance criteria are met: the app runs, lint/typecheck/tests/
build all pass locally via `npm run verify`, and the Playwright smoke test passes via
`npm run e2e`.

### Stage 2 — Design system: complete

Added the original Numera component library under `src/components/`: `Button` (5
variants, chunky offset-shadow press effect), `Card`, `Modal` (accessible: focus trap,
Escape-to-close, backdrop click, focus restore), `ProgressBar`, `Badge`, `PlayerChip`,
`AnimatedNumber` (reduced-motion aware, screen-reader announced), plus `Container`/`Stack`
layout primitives. Extended `globals.css` with chunky shadow/radius tokens and darker
color variants. Added `/showcase`, a live component gallery. 24 unit tests added; visually
verified at desktop and mobile viewports via headless Chromium, which caught and fixed a
flex-stretch layout bug before it shipped.

### Stage 3 — Game engine: complete

Added the deterministic, React-free game engine under `src/game-engine/`: types, seeded
and secure random sources, target generation (adaptive ranges, no-3-consecutive-repeats
rule), move validation and one-click-at-a-time processing (never overshoots the target),
turn rotation, life loss/elimination/placement assignment, and the `applyCommand`
reducer covering the full `GameCommand` set from plan §19.1. 88 unit tests, including
full 2/4/6/10-player match simulations run purely through the public command API, and a
determinism test that replays the same seed twice and asserts an identical trajectory.

### Stage 4 — Player and match setup: complete

Added `src/game-engine/bot-strategy.ts` (real move-selection logic per bot personality,
with a `BotDecisionContext` type that structurally excludes the secret target), 10
original SVG avatars (`Avatar`, `AvatarPicker`), `ColorPicker`, match presets
(Quick/Party/Strategic/Sudden Death/Custom), Zod schemas for players and match settings,
and two Zustand stores (`matchSetupStore` with localStorage persistence,
`activeMatchStore` wrapping the engine's `applyCommand`). Built `PlayerSetupScreen`
(add/remove/reorder/duplicate players, avatar/color pickers, add bot, randomize all) and
`MatchSettingsForm` (React Hook Form + Zod, live preset switching). Wired into
`/setup/players` → `/setup/match` → `/play`, where "Start match" genuinely creates and
starts a match through the Stage 3 engine. 51 new tests; the full flow was also driven
through a real headless-Chromium browser at a mobile viewport with zero console errors,
which caught and fixed a locator issue in the verification script itself (not app code).

### Stage 5 — Core gameplay UI: complete

Built the real Classic-match gameplay screen under `src/features/game/`:
`PassThePhoneScreen`, `Counter` (with `useSteppedCounter`, a tested hook that ticks the
shared counter one click at a time and never overshoots), `MoveButtons`,
`PlayerOrderStrip`, `TurnTimer` (pauses during animation, fires exactly once per turn),
`MatchLog`, and `GameplayScreen` tying it together with `activeMatchStore`. Bots now play
automatically via `bot-strategy.ts`. Wired into `/play`, replacing the Stage 4
confirmation stub. Added a permanent Playwright e2e test (`full-match.spec.ts`) that
plays a real match through the actual UI to a winner screen.

Real-browser testing (not just unit tests) caught and fixed two genuine bugs: a
hydration mismatch from `crypto.randomUUID()` running at store-module-eval time, and
match settings edits being silently discarded before match creation (a stale-closure bug
compounded by an over-eager form-reset effect). Both have regression tests now.

### Stage 6 — Elimination and victory experience: complete

Added `ShakeOnMount` (screen shake), avatar knockback, `EliminationScreen` (revealed
target, remaining lives, grayscale on full elimination), `ConfettiBurst` (original
Numera-palette confetti, no third-party library), and `WinnerScreen` (victory entrance
animation, final ranking via `rankPlayers`, match statistics via `computeMatchStats`,
and Play again/Change settings/Return home actions). `buildMatchFromCurrentSetup()` is
now shared between `/setup/match` and the rematch button. 22 new tests, plus a permanent
Playwright e2e test (`elimination-and-rematch.spec.ts`) driving a real multi-life match
through an elimination screen, to completion, and through a rematch. Verified visually
via real-browser screenshots — shake, knockback, confetti, and the full winner screen all
render correctly with zero console errors.

---

_No production releases yet._
