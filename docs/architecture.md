# Numera — Architecture and Coding Standards

## Directory structure

```
src/
├── app/                 Next.js App Router routes, layouts, and pages
├── components/          Shared, reusable UI primitives (design system — Stage 2)
├── features/            Feature-scoped UI and hooks, one folder per domain
│   ├── game/            Match setup, gameplay, elimination/victory screens
│   ├── players/         Player creation, avatars, bots
│   ├── power-ups/        Power-up inventory and activation UI
│   ├── progression/      Profile, XP, levels, coins, trophies
│   ├── cosmetics/        Cosmetic shop, inventory, equip flows
│   ├── challenges/       Daily/weekly challenges, achievements
│   └── statistics/       Match history and statistics screens
├── game-engine/          Pure game logic — see "Engine independence" below
├── stores/               Zustand stores (profile, match setup, active match, UI)
├── hooks/                Shared React hooks not tied to one feature
├── lib/                  Cross-cutting utilities (storage, validation helpers, ids)
├── config/               Constants and configuration (defaults, presets, palettes)
├── styles/               Non-Tailwind stylesheets (keyframes, print styles, etc.)
├── assets/               Original vector art, icons, sound files
└── tests/
    ├── setup.ts           Vitest/RTL global setup
    ├── integration/        Multi-module integration tests
    └── e2e/                Playwright end-to-end specs
```

Each currently-empty directory holds a `.gitkeep` placeholder until its stage populates
it — this documents intended structure without inventing unfinished code.

## Engine independence

`src/game-engine/` must not import React, Next.js, or any UI library. It is a plain
TypeScript module: pure functions and types that take a state and a command and return a
new state plus events (see plan §19.1–19.3). This is what makes the engine:

- **Deterministic** — same inputs always produce the same outputs, given the same random
  seed.
- **Independently testable** — full matches can run in Vitest with no DOM, no React
  Testing Library, no browser.
- **Reusable later** — the same rules can run server-side for online multiplayer without
  a rewrite.

UI code (`app/`, `components/`, `features/`) calls into the engine and renders its state;
it never re-implements game rules itself.

## State management

Following plan §18, state is split into four Zustand stores under `src/stores/`, each
with a single responsibility:

- **Profile store** — user profile, progression, currencies, cosmetics, achievements,
  challenges, settings.
- **Match setup store** — players, mode, match settings, presets (pre-match only).
- **Active match store** — match id, round, counter, target, turn order, move/round
  history, status, timers (in-match only).
- **UI store** — active modal, toasts, reduced motion, theme, navigation, sound state.

Persistence (localStorage/IndexedDB via Zustand middleware) applies to profile,
cosmetics, settings, challenges, statistics, match history, and the incomplete active
match — never to transient animation state.

## TypeScript standards

- `strict: true` plus `noUncheckedIndexedAccess`, `noUnusedLocals`,
  `noUnusedParameters`, `noFallthroughCasesInSwitch`.
- `any` is disallowed by lint (`@typescript-eslint/no-explicit-any: error`). If it is ever
  truly unavoidable, it must be `// eslint-disable-next-line` with a comment explaining
  why no narrower type is possible.
- Prefer discriminated unions for engine commands/events over loosely-typed objects.
- Validate all external or persisted data with Zod at the boundary (storage read,
  imported settings) — never trust `JSON.parse` output directly.

## Component standards

- Keep components small and single-purpose; presentational components stay free of game
  rules.
- Co-locate a component's test next to it (`Thing.tsx` + `Thing.test.tsx`).
- Feature folders own their screens; `components/` only holds primitives reused across
  multiple features (buttons, cards, modals, etc.).

## Testing standards

- **Unit** (Vitest): engine logic, stores, pure utilities — `*.test.ts(x)` next to source.
- **Integration** (Vitest + RTL): multi-module flows under `src/tests/integration/`.
- **End-to-end** (Playwright): full user journeys under `src/tests/e2e/`.
- A stage is not "done" if its acceptance criteria include tests that don't exist yet.

## Security and fairness baseline

- The secret target must never appear in DOM attributes, client logs, or debug UI.
- All game commands are validated inside the engine — the UI is not trusted as the source
  of truth for legality of a move.
- Player names and any persisted/imported data are sanitized and validated before use.
