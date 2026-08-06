# Numera — Task Tracker

Source of truth for stage status. Derived from `docs/plan.md` §31. Updated after every
completed unit of work. A task is only marked **Done** when implemented _and_ verified
(lint + type-check + relevant tests + build passing, where applicable).

Legend: ✅ Done · 🔄 In progress · ⛔ Blocked · ⬜ Pending

---

## ➤ CURRENT STAGE: Stage 8 — Additional game modes

## Stage 1 — Repository and foundation

Status: ✅ Done — all tasks complete, acceptance criteria verified locally
(`npm run verify` and `npm run e2e` both pass). CI workflow added; first run happens on
push to `main`.

| Task                                        | Status | Notes                                                                 |
| ------------------------------------------- | ------ | --------------------------------------------------------------------- |
| Create Next.js TypeScript project           | ✅     | Next.js 16 App Router, `src/` layout                                  |
| Configure strict TypeScript                 | ✅     | `strict: true` + noUncheckedIndexedAccess etc., no `any`              |
| Configure Tailwind CSS                      | ✅     | Numera palette tokens from plan §13.4 in `globals.css`                |
| Configure ESLint and Prettier               | ✅     | flat config, Next + TS rules, prettier-plugin-tailwindcss             |
| Configure testing (Vitest, RTL, Playwright) | ✅     | unit/integration/e2e separated, smoke tests passing                   |
| Establish directory structure               | ✅     | per plan §19, documented in `docs/architecture.md`                    |
| Add environment example file                | ✅     | `.env.example`                                                        |
| Add initial README                          | ✅     | run/build/test instructions                                           |
| Add contribution rules                      | ✅     | `CONTRIBUTING.md`                                                     |
| Add coding standards                        | ✅     | `docs/architecture.md`                                                |
| Add CI workflow                             | ✅     | `.github/workflows/ci.yml`: lint, typecheck, format, test, build, e2e |

**Dependencies:** none (first stage).

**Acceptance criteria (from plan):**

- Application runs (`npm run dev` serves a page)
- Lint passes
- Type checking passes
- Test command passes
- Build passes

**Testing requirements:** No feature tests yet — verify tooling itself runs cleanly (lint/typecheck/test/build all exit 0).

---

## Stage 2 — Design system

Status: ✅ Done — all tasks complete, acceptance criteria verified (local + screenshot
check at desktop and mobile viewports, plus real click/Escape interaction on the modal)

| Task                         | Status | Notes                                                           |
| ---------------------------- | ------ | --------------------------------------------------------------- |
| Color tokens                 | ✅     | Extended `globals.css` (dark variant shades, surface color)     |
| Typography scale             | ✅     | Tailwind defaults + `font-display`/`font-sans` from Stage 1     |
| Spacing tokens               | ✅     | Tailwind's default spacing scale, documented as the standard    |
| Shadows and borders          | ✅     | `shadow-chunky*` / `radius-chunky*` tokens (offset drop shadow) |
| Buttons                      | ✅     | `Button` — 5 variants, 3 sizes, press-squash, keyboard-tested   |
| Cards                        | ✅     | `Card`                                                          |
| Modals                       | ✅     | `Modal` — focus trap, Escape, backdrop click, focus restore     |
| Progress bars                | ✅     | `ProgressBar` — ARIA `progressbar`, animated fill               |
| Badges                       | ✅     | `Badge` — always text-labeled, never color-only                 |
| Player chips                 | ✅     | `PlayerChip` — active/eliminated states via text, not color     |
| Animation utilities          | ✅     | `AnimatedNumber`, `src/lib/motion.ts`, reduced-motion aware     |
| Responsive layout primitives | ✅     | `Container`, `Stack`                                            |

**Acceptance criteria:** component showcase page exists (`/showcase`); components work on
mobile and desktop (verified via Playwright screenshots at 1280px and 390px); keyboard
navigation works (Button tab/Enter tested, Modal focus trap tested); no copied
third-party game assets (all original CSS/SVG-based, no external art).

**Testing requirements:** 24 RTL/Vitest unit tests across 7 component files, covering
click/keyboard/disabled behavior, ARIA semantics, focus trap and restoration, and
color-independent state communication. Visual check performed via headless Chromium
screenshots at desktop and mobile widths; caught and fixed a real flex-stretch layout bug
in the showcase page before merging.

---

## Stage 3 — Game engine

Status: ✅ Done — all tasks complete, acceptance criteria verified

| Task                       | Status | Notes                                                                  |
| -------------------------- | ------ | ---------------------------------------------------------------------- |
| Game types                 | ✅     | `types.ts` — Player, MatchSettings, ActiveMatch, GameCommand/Event     |
| Target generator           | ✅     | `target-generator.ts` — range, adaptive table, no-3-in-a-row rule      |
| Match initializer          | ✅     | `createMatch` in `engine.ts`                                           |
| Turn rotation              | ✅     | `findNextActivePlayerIndex` in `rules.ts` — skips eliminated players   |
| Move processor             | ✅     | `applyMoveToCounter` in `rules.ts` — one click at a time, no overshoot |
| Life and elimination logic | ✅     | `resolveLifeLoss` in `engine.ts`                                       |
| Winner detection           | ✅     | within `resolveLifeLoss` — completes match when 1 active player left   |
| Round reset                | ✅     | `CONTINUE_AFTER_LOSS` command handler                                  |
| Seeded randomness          | ✅     | `random.ts` — seeded (tests) + secure/crypto (production) sources      |
| Unit tests                 | ✅     | 88 tests across 6 files, all passing                                   |

**Acceptance criteria:** full matches run through tests without UI (verified: 2-player,
4-player, 6-player, and 10-player simulations complete via the public command API only);
all core engine tests pass (88/88); engine contains no React/Next dependencies (verified
via import grep — zero matches).

**Testing requirements:** unit tests for target generation, move validation, turn
rotation, life deduction, elimination, match completion, danger calculation, and seeded
determinism are all present — including a dedicated test that runs the same seed twice
and asserts an identical match trajectory, and a test reproducing the plan's exact §6.4
"counter must not overshoot the target" example.

**Design note — two-phase round resolution:** hitting the target moves the match to a
`round_ended` status (not immediately into the next round) so that Stage 6's elimination
UI has a clean place to play its animation before the engine advances via
`CONTINUE_AFTER_LOSS`. This also closes a duplicate-submission window: `SUBMIT_MOVE` is
rejected outright while `round_ended`.

---

## Stage 4 — Player and match setup

Status: ✅ Done — all tasks complete, acceptance criteria verified

| Task                           | Status | Notes                                                                                  |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------- |
| Player creation                | ✅     | `PlayerSetupScreen` + `matchSetupStore` — add/remove up to 2-10                        |
| Avatar selector                | ✅     | 10 original SVG avatars (`Avatar`, `AvatarPicker`) — no third-party art                |
| Color selector                 | ✅     | `ColorPicker`, 5 Numera palette colors                                                 |
| Player reordering              | ✅     | Up/down buttons (accessible alternative to drag — see design note)                     |
| Bot creation                   | ✅     | "Add bot" + per-bot personality select, backed by a real `bot-strategy.ts`             |
| Match presets                  | ✅     | Quick / Party / Strategic / Sudden Death / Custom (`matchPresets.ts`)                  |
| Advanced settings              | ✅     | `MatchSettingsForm` (React Hook Form + Zod) — mode, lives, range, move, timer, toggles |
| Configuration validation (Zod) | ✅     | `features/players/schemas.ts`, `features/game/schemas.ts`                              |
| Persist recent setup           | ✅     | `matchSetupStore` uses Zustand `persist` to localStorage                               |

**Acceptance criteria:** host can configure and start a valid match — verified with a
real headless-Chromium run through the entire flow (home → add/rename players → add a
bot → customize avatar/color → continue → apply a preset → start match → confirmation
screen showing a genuinely-created, engine-backed match with the target correctly never
rendered). Invalid configurations cannot start: the Continue and Start Match buttons are
`disabled` whenever Zod validation fails (blank name, target range with max ≤ min,
fewer than 2 / more than 10 players), verified by both unit and integration tests.

**Testing requirements:** 51 new tests across schemas (player + match settings), the
bot-strategy module (including a structural/runtime check that the secret target is
never exposed to bot decision logic), the two Zustand stores, the `Avatar` component,
and integration tests driving `PlayerSetupScreen`/`MatchSettingsForm` end to end. Also
manually verified via headless-Chromium screenshots at a 390px mobile viewport with zero
console errors through the full flow.

**Design notes:**

- **Reordering uses up/down buttons, not drag-and-drop.** This satisfies the "player
  reordering" task while staying keyboard- and touch-accessible without a drag library —
  consistent with plan §23's "no gameplay action requires precise small tapping" and
  avoiding an unnecessary dependency.
- **Bots are functional now, not just data.** `src/game-engine/bot-strategy.ts` (from
  plan's engine file list) was pulled forward from its unassigned stage so "Add bot" is a
  genuinely working control end-to-end — a bot in the roster can actually choose a valid
  move once Stage 5 wires gameplay, rather than being a dead configuration flag. Its
  `BotDecisionContext` type structurally excludes the secret target (plan §10.2).
- **`powerUpsEnabled` and `specialEventsEnabled` are intentionally not exposed in the
  settings UI yet** — those systems don't exist until Stage 7, and plan §9 (special
  events) has no assigned stage at all (see `docs/known-issues.md`). Surfacing a toggle
  with no effect would violate "no fake or placeholder controls."
- **A minimal `activeMatchStore` was added** (holds the created `ActiveMatch`, persisted
  to localStorage) so "Start match" genuinely creates and starts a real match via the
  Stage 3 engine. `/play` is an honest confirmation screen, not a gameplay UI — it says
  so explicitly and is replaced by Stage 5.

---

## Stage 5 — Core gameplay UI

Status: ✅ Done — all tasks complete, acceptance criteria verified

| Task                  | Status | Notes                                                                                  |
| --------------------- | ------ | -------------------------------------------------------------------------------------- |
| Pass-the-phone screen | ✅     | `PassThePhoneScreen` — hides controls until "Tap when ready"; skipped for bots         |
| Active player display | ✅     | `PlayerOrderStrip` (active ring) + in-turn prompt text                                 |
| Counter               | ✅     | `Counter` + `useSteppedCounter` — ticks one click at a time, never overshoots          |
| Move buttons          | ✅     | `MoveButtons` — disabled during the tick animation                                     |
| Player order          | ✅     | `PlayerOrderStrip`                                                                     |
| Life indicators       | ✅     | via `PlayerChip` (Stage 2), fed live match data                                        |
| Timer                 | ✅     | `TurnTimer` — pauses during animation, fires exactly once per turn                     |
| Round state           | ✅     | `GameplayScreen` status branching (in_progress/round_ended/paused/completed)           |
| Match log             | ✅     | `MatchLog` — last 5 moves                                                              |
| Connect UI to engine  | ✅     | `activeMatchStore.dispatch` wraps `applyCommand`; bots auto-play via `bot-strategy.ts` |

**Acceptance criteria:** a complete Classic match is playable — verified via a permanent
Playwright e2e test (`full-match.spec.ts`, runs in CI on both desktop and mobile
viewports) that plays a real match through the actual UI to a winner screen with zero
console errors, plus multi-life mode manually verified through a full round transition.
Refresh recovery works — verified by simulating a true module reload (not just clearing
state) and confirming `activeMatchStore`'s Zustand `persist` middleware restores an
in-progress match exactly. No duplicate moves can occur — `MoveButtons` disables during
the tick animation, the engine independently rejects out-of-turn/stale commands (Stage
3), and a dedicated test asserts a rapid double-tap never double-applies a move.

**Testing requirements:** integration test for the full Classic match flow, a race-guard
test for duplicate submission, `useSteppedCounter`/`TurnTimer` unit tests covering the
animation-pause and single-fire-per-turn guarantees, and the e2e regression test above.

**Real bugs found and fixed via real-browser testing (neither caught by unit/RTL tests):**

1. **Hydration mismatch on every fresh page load.** `matchSetupStore`'s two default seed
   players called `crypto.randomUUID()` at module-evaluation time, which runs during both
   SSR and client hydration — producing different ids each time and breaking hydration.
   Fixed with fixed ids (`"default-player-1"/"2"`) for the seed players only; ids for
   players added afterward still use `crypto.randomUUID()` (client-interaction-only, no
   SSR risk).
2. **Match settings edits were silently discarded.** Two compounding bugs: (a)
   `MatchSettingsForm` re-synced its form from the store's `settings` object on _any_
   reference change (including the persist middleware's passive rehydration), wiping
   in-progress edits — fixed by keying the sync effect on `selectedPresetId` instead,
   which only changes on a deliberate preset click; (b) `/setup/match/page.tsx` read
   `settings` from a render-time hook snapshot inside `handleStartMatch`, which runs
   synchronously right after `updateSettings()` but before React re-renders with the new
   value — fixed by reading `useMatchSetupStore.getState()` fresh at call time. Both are
   covered by regression tests now (`matchSettingsForm.test.tsx`,
   `matchSettingsPage.test.tsx`) and the e2e test asserts the actual generated target
   stayed within the edited (not default) range.

**Design note:** hitting the target flips `match.status` to `round_ended`/`completed` in
the very same engine dispatch as the winning move (Stage 3's design). `GameplayScreen`
deliberately keeps showing the in-progress layout while `useSteppedCounter`'s
`isAnimating` is still true, even after status has changed, so the counter's tick-up to
the target is actually visible before the round-summary/winner screen takes over.

**Known limitation carried forward to Stage 6:** the round-summary and winner screens are
intentionally minimal placeholders that say so explicitly ("The full elimination
sequence/victory celebration arrives in Stage 6") — no confetti, screen shake, or
rankings yet.

---

## Stage 6 — Elimination and victory experience

Status: ✅ Done — all tasks complete, acceptance criteria verified

| Task                  | Status | Notes                                                                   |
| --------------------- | ------ | ----------------------------------------------------------------------- |
| Target-hit sequence   | ✅     | `ShakeOnMount` screen shake plays on entering the elimination screen    |
| Life-loss sequence    | ✅     | Avatar knockback (spring scale/rotate-in) in `EliminationScreen`        |
| Elimination animation | ✅     | Same screen, grayscale avatar + "was eliminated!" when lives reach 0    |
| Round summary         | ✅     | `EliminationScreen` — loser, revealed target, remaining lives, Continue |
| Winner screen         | ✅     | `WinnerScreen` — champion entrance animation, confetti                  |
| Final ranking         | ✅     | `rankPlayers()` (placement-sorted) rendered in `WinnerScreen`           |
| Rematch flow          | ✅     | "Play again — same players" via shared `buildMatchFromCurrentSetup()`   |
| Return-home flow      | ✅     | `onReturnHome`/`onChangeSettings` props wired from `/play`              |

**Acceptance criteria:** match ending feels complete — verified via real-browser
screenshots (screen shake + avatar knockback on the elimination screen; confetti +
entrance animation + final ranking + match statistics on the winner screen) and a
permanent Playwright e2e test (`elimination-and-rematch.spec.ts`) that drives a real
multi-life match through an elimination screen, to completion, and through "Play again"
to a fresh match. Result data is accurate: `computeMatchStats`/`rankPlayers` are pure
functions over the real `ActiveMatch`, unit-tested, and rewards (XP/coins/trophies) are
correctly omitted since Stage 9 doesn't exist yet — the winner screen says so explicitly
rather than showing fake numbers.

**Testing requirements:** unit tests for `computeMatchStats`/`rankPlayers`, component
tests for `EliminationScreen`/`WinnerScreen`/`ConfettiBurst`/`ShakeOnMount` (including the
reduced-motion no-op cases), and the e2e test above. 22 new tests.

**Design note:** `buildMatchFromCurrentSetup()` (shared by `/setup/match` and
`WinnerScreen`'s rematch button) reads `matchSetupStore.getState()` fresh at call time —
the same stale-closure lesson from Stage 5's known-issues entry applied proactively here.

---

## Stage 7 — Power-ups

Status: ✅ Done — all tasks complete, acceptance criteria verified

| Task                 | Status | Notes                                                                                                                             |
| -------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Power-up models      | ✅     | `PowerUpId`, `PendingEffect`, `PowerUpUsageRecord` in `types.ts`                                                                  |
| Inventory UI         | ✅     | `PowerUpInventory` — buttons + confirmation modal with description                                                                |
| All 11 power-ups     | ✅     | Shield, Peek, Reverse, Freeze, Boost, Skip, Swap, Counter Pushback, Scramble, Double Trouble, Lucky Dice — `power-up-resolver.ts` |
| Animations           | ✅     | Reuses the existing chunky Button/Modal system; power-up feedback via Badge                                                       |
| Balance restrictions | ✅     | Powered-up-once-per-turn (`turnOrdinal`), finite inventory, `powerUpsEnabled` gate, active-player-only                            |
| Tests                | ✅     | 21 engine tests + 6 UI tests + 3 MatchLog tests + e2e                                                                             |
| Match logs           | ✅     | `MatchLog` now interleaves `powerUpHistory` with moves chronologically                                                            |

**Acceptance criteria:** every power-up has working, tested behavior (all 11 covered
individually in `power-up-resolver.test.ts`, including Shield blocking a hit without a
life loss, Freeze/Boost changing the effective move cap for exactly one turn, Double
Trouble granting a real second turn, and Lucky Dice performing an actual move). No
power-up can corrupt turn order or match state — a dedicated test activates all 11
power-ups in sequence within one running match and asserts `playerOrder` stays a valid
permutation and `activePlayerIndex` stays valid after every single use. Verified visually
in a real browser: inventory renders, the explanation modal shows before activation,
Boost genuinely added a `+4` move option, and a full match completed cleanly with
power-ups enabled (the plan §6.2 default) and zero console errors.

**Testing requirements:** unit tests per power-up (all 11), balance-rule tests
(one-per-turn, inventory exhaustion, disabled-mode rejection, active-player-only), the
turn-order-integrity combination test above, `PowerUpInventory` component tests
(including the Swap target-picker and Pushback amount-picker requiring a selection before
confirming), and a permanent Playwright e2e test.

**Design notes:**

- **Shared helpers extracted to `rules.ts`** (`activePlayerId`, `requirePlayer`,
  `replacePlayer`, `advanceTurn`, `getEffectiveMaxMove`, `consumePendingEffect`) so
  `engine.ts` and the new `power-up-resolver.ts` could both use them without a circular
  import.
- **Lucky Dice is orchestrated by `engine.ts`, not `power-up-resolver.ts`**, since it both
  consumes a power-up and performs a real move (needs `submitMove`); every other
  power-up is resolved entirely within `power-up-resolver.ts`. Keeps the module graph
  acyclic.
- **`pendingEffects` and `turnOrdinal`** (both anticipated by plan §18.3's "pending
  effects" and the "one power-up per turn" balance rule) are the mechanism behind
  Shield/Freeze/Boost/Double Trouble — a small, shared, well-tested primitive rather than
  bespoke state per power-up.
- **The `powerUpsEnabled` toggle**, held back in Stage 4 with a note explaining it had no
  effect yet, is now exposed in `MatchSettingsForm` — the reasoning behind that Stage 4
  omission (documented at the time) directly informed this stage's scope check.

---

## Stage 8 — Additional game modes

Status: ⬜ Pending — dependencies satisfied (Stages 3, 5, 7 done), not yet started

Tasks: Multi-Life, Score Rush, Reverse Countdown, Sudden Death, Team Battle, Chaos Mode.

**Acceptance criteria:** each mode has rules, UI explanation, tests, and winner
calculation.

**Testing requirements:** unit + integration tests per mode's win condition and scoring.

---

## Stage 9 — Profile and progression

Status: ⬜ Pending — depends on Stage 6

Tasks: local profile, XP, levels, coins, trophies, leagues, profile screen, persist
progress, migration system.

**Acceptance criteria:** completing a match updates progression correctly; refresh does
not lose progress.

**Testing requirements:** XP/level curve unit tests; persistence migration tests.

---

## Stage 10 — Challenges and achievements

Status: ⬜ Pending — depends on Stage 9

Tasks: daily challenge generation, weekly challenges, achievement definitions, progress
tracking, reward claiming, challenge screen, achievement notifications.

**Acceptance criteria:** challenges update from real gameplay events; rewards cannot be
claimed twice.

**Testing requirements:** challenge progress unit tests; double-claim prevention test.

---

## Stage 11 — Cosmetics

Status: ⬜ Pending — depends on Stage 9

Tasks: cosmetic data model, inventory, shop, unlock requirements, equip behavior, initial
content (12 avatars, 8 frames, 8 titles, 6 counter skins, 6 button skins, 5 arenas, 5
elimination effects, 5 victory effects, 12 emotes, 3 sound packs), preview system, apply
during gameplay.

**Acceptance criteria:** cosmetics change presentation; cosmetics do not change gameplay
power.

**Testing requirements:** unlock-requirement tests; test asserting cosmetics never affect
engine outcomes.

---

## Stage 12 — Statistics and history

Status: ⬜ Pending — depends on Stages 9, 6

Tasks: match history, lifetime stats, player comparisons, statistics screen, data export,
history deletion.

**Acceptance criteria:** statistics are derived from real match data; history supports at
least 50 matches.

**Testing requirements:** stats aggregation unit tests; history capacity/rotation test.

---

## Stage 13 — Sound, music, and haptics

Status: ⬜ Pending — depends on Stage 5

Tasks: sound manager, sound effects, background music, volume controls, vibration,
browser audio unlock handling, reduced sensory mode.

**Acceptance criteria:** sound settings persist; game works fully without audio.

**Testing requirements:** sound manager unit tests (mocked Howler); manual test with audio
disabled.

---

## Stage 14 — PWA and offline support

Status: ⬜ Pending — depends on Stage 1 (structural), practically after Stage 12

Tasks: manifest, icons, service worker, offline shell, cache required assets, update
flow, test installation.

**Acceptance criteria:** app can be installed; local multiplayer works offline after
initial load.

**Testing requirements:** Playwright test for offline reload; manual install test.

---

## Stage 15 — Accessibility and responsiveness

Status: ⬜ Pending — depends on all UI stages (2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13)

Tasks: keyboard navigation, screen-reader labels, announcements, focus management, high
contrast, reduced motion, device size testing, portrait/landscape testing.

**Acceptance criteria:** core flows are accessible; no gameplay action requires precise
small tapping.

**Testing requirements:** axe/RTL a11y checks; manual keyboard-only and screen-reader
pass.

---

## Stage 16 — Quality assurance

Status: ⬜ Pending — depends on all prior stages

Tasks: run all unit/integration/e2e tests, fix visual bugs, fix mobile overflow, fix race
conditions, test refresh recovery, test corrupted storage, cross-browser testing, remove
debug logs, remove dead code, audit dependencies.

**Acceptance criteria:** lint passes; type check passes; tests pass; production build
passes; no known critical bugs.

---

## Stage 17 — Deployment and launch

Status: ⬜ Pending — depends on Stage 16

Tasks: configure Vercel, production environment, privacy-conscious analytics, error
monitoring, metadata, legal pages, deploy preview, test production build, deploy
production, verify PWA, release notes.

**Acceptance criteria:** production URL works; game is playable on real mobile devices; no
console errors during standard play.

---

## Notes

- Stages are worked sequentially; a stage does not start until its dependencies show ✅
  and the current stage's acceptance criteria are met.
- See `docs/known-issues.md` for open defects/risks and `docs/decisions.md` for
  architecture decisions made along the way.
