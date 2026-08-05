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
  submission and timer race conditions (§21, §26) — the engine already rejects
  out-of-turn/stale commands (verified in Stage 3 tests); Stage 5 still needs to make
  sure the _UI_ never dispatches a stale timeout after a move already landed (e.g. a
  `setTimeout` firing after the player already tapped a move button).
- **Target secrecy**: must audit that the target value never appears in DOM attributes,
  client logs, or debug panels once gameplay UI exists (§6.5, engineering requirements).
  Stage 4's `/play` confirmation screen deliberately never renders `match.target` or
  `match.counter` — Stage 5 must keep that discipline once the real counter UI exists.
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
