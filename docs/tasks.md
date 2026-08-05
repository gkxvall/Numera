# Numera — Task Tracker

Source of truth for stage status. Derived from `docs/plan.md` §31. Updated after every
completed unit of work. A task is only marked **Done** when implemented _and_ verified
(lint + type-check + relevant tests + build passing, where applicable).

Legend: ✅ Done · 🔄 In progress · ⛔ Blocked · ⬜ Pending

---

## ➤ CURRENT STAGE: Stage 3 — Game engine

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

Status: ⬜ Pending — dependency satisfied, not yet started

Tasks: game types, target generator, match initializer, turn rotation, move processor,
life/elimination logic, winner detection, round reset, seeded randomness, unit tests.

**Acceptance criteria:** full matches run through tests without UI; all core engine tests
pass; engine contains no React dependencies.

**Testing requirements:** unit tests for target generation, move validation, turn
rotation, life deduction, elimination, match completion, danger calculation, seeded
determinism.

---

## Stage 4 — Player and match setup

Status: ⬜ Pending — depends on Stages 2, 3

Tasks: player creation, avatar selector, color selector, player reordering, bot creation,
match presets, advanced settings, configuration validation (Zod), persist recent setup.

**Acceptance criteria:** host can configure and start a valid match; invalid
configurations cannot start.

**Testing requirements:** Zod schema validation tests; component tests for setup flow.

---

## Stage 5 — Core gameplay UI

Status: ⬜ Pending — depends on Stages 2, 3, 4

Tasks: pass-the-phone screen, active player display, counter, move buttons, player order,
life indicators, timer, round state, match log, connect UI to engine.

**Acceptance criteria:** a complete Classic match is playable; refresh recovery works; no
duplicate moves can occur.

**Testing requirements:** integration test for full Classic match flow; race-condition
tests for duplicate submission and timer/animation overlap.

---

## Stage 6 — Elimination and victory experience

Status: ⬜ Pending — depends on Stage 5

Tasks: target-hit sequence, life-loss sequence, elimination animation, round summary,
winner screen, final ranking, rematch flow, return-home flow.

**Acceptance criteria:** match ending feels complete; rewards not required yet but result
data is accurate.

**Testing requirements:** integration tests verifying final ranking/result data matches
match history.

---

## Stage 7 — Power-ups

Status: ⬜ Pending — depends on Stages 3, 5

Tasks: power-up models, inventory UI, initial power-ups (Shield, Peek, Reverse, Freeze,
Boost, Skip, Swap, Counter Pushback, Scramble, Double Trouble, Lucky Dice), animations,
balance restrictions, tests, match logs.

**Acceptance criteria:** every power-up has working behavior; no power-up can corrupt turn
order or match state.

**Testing requirements:** unit tests per power-up resolver; combination/edge-case tests
(e.g., repeated Reverse, Scramble with 2 players, pushback at zero).

---

## Stage 8 — Additional game modes

Status: ⬜ Pending — depends on Stages 3, 5, 7

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
