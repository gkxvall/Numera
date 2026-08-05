# Numera — Known Issues

Tracks open defects, risks, and gaps. Update at the end of every stage. Remove an entry
only once it's verified fixed (not just believed fixed).

## Open

_None currently open._

## Watch list (risks, not yet issues)

- **Scope size**: the full plan spans 17 development stages; without disciplined
  incremental commits, changes risk becoming unreviewable. Mitigation: one stage at a
  time, small commits, verify before proceeding.
- **Timer/animation race conditions**: plan explicitly calls out duplicate turn
  submission and timer race conditions (§21, §26). Addressed in Stage 5: `TurnTimer`
  resets per-turn via a `turnKey` and fires at most once (`firedRef`), freezes while the
  counter is animating, and `MoveButtons` disables during that same animation window;
  covered by tests. Revisit if Stage 7 (power-ups) or Stage 8 (chaos events) introduce
  new ways a turn can end mid-animation.
- **Target secrecy**: must audit that the target value never appears in DOM attributes,
  client logs, or debug panels (§6.5, engineering requirements). Verified through Stage 5:
  `GameplayScreen` and its subcomponents never render `match.target`; `MatchLog` only
  shows `reachedTarget` (a boolean, already-public once revealed) and `counterAfter`, not
  the target itself. Re-check whenever a new screen reads from `ActiveMatch`.
- **Plan §9 "Special Number Events" has no assigned development stage.** It's described
  as optional in the plan text but never appears in any of the 17 stage task lists
  (checked all of §31 stage-by-stage). `MatchSettings.specialEventsEnabled` exists in the
  type (defaults to `false`) but is not yet surfaced in the settings UI, since there's
  nothing behind it to enable. Decision needed: implement opportunistically alongside a
  later stage (Stage 8 additional modes is the most natural fit) or explicitly mark
  out-of-scope for v1.

## Resolved

- **CI typecheck failure: `LayoutProps<"/">` not found.** `src/app/layout.tsx` used
  Next.js's generated `LayoutProps<"/">` ambient type, which only exists in `.next/types`
  after `next dev`/`next build` has run once. Locally this was already generated, masking
  the problem; a fresh CI checkout ran `tsc --noEmit` before any build step and failed.
  Fixed by typing the layout's props explicitly (`Readonly<{ children: ReactNode }>`)
  instead of depending on generated types. Lesson: verify `npm run verify` against a
  clean checkout (or at least `rm -rf .next`), not just a warm local one, before trusting
  a "typecheck passes" claim.

- **Hydration mismatch on every fresh page load (Stage 5).** `matchSetupStore`'s two
  default seed players called `crypto.randomUUID()` inside the store's initial state,
  which is evaluated during both SSR and client hydration — producing different ids each
  pass and breaking hydration on every load of `/setup/players`. Fixed with fixed ids for
  the two seed players only (`createDefaultPlayer` now accepts an explicit id, defaulting
  to a fresh UUID for players added afterward via user interaction, which is safely
  client-only). Lesson: unit/RTL tests never render through Next's actual SSR pipeline,
  so this class of bug is invisible to them — only caught by driving a real browser
  against `next dev`/`next build` output.

- **Match settings edits were silently discarded before match creation (Stage 5).** Two
  compounding bugs, both invisible to existing unit/integration tests: (a)
  `MatchSettingsForm` re-synced its React Hook Form state from the store's `settings`
  object on _any_ reference change — including the persist middleware's passive
  rehydration on mount — silently wiping whatever the player had just typed; (b)
  `/setup/match/page.tsx`'s `handleStartMatch` read `settings` from a render-time hook
  snapshot, but fires synchronously right after `updateSettings()` and before React
  re-renders the parent with the fresh value, so it always used the pre-edit settings.
  Fixed by keying the form's sync effect on `selectedPresetId` (only changes on a
  deliberate preset click) instead of `settings`, and by reading
  `useMatchSetupStore.getState()` fresh inside the handler instead of closing over the
  hook value. Caught only by playing a full match through a real headless-Chromium
  browser and checking the _actual_ generated target landed in the edited range — every
  RTL-level test of the form in isolation passed throughout. Lesson: an integration test
  of a form component alone can't catch a bug in how its _caller_ reads the result;
  cross-component data flow needs an end-to-end check.
