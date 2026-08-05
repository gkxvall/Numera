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
  submission and timer race conditions (§21, §26) — needs deliberate handling in the
  engine/reducer, not just UI-level debouncing.
- **Target secrecy**: must audit that the target value never appears in DOM attributes,
  client logs, or debug panels once gameplay UI exists (§6.5, engineering requirements).

## Resolved

- **CI typecheck failure: `LayoutProps<"/">` not found.** `src/app/layout.tsx` used
  Next.js's generated `LayoutProps<"/">` ambient type, which only exists in `.next/types`
  after `next dev`/`next build` has run once. Locally this was already generated, masking
  the problem; a fresh CI checkout ran `tsc --noEmit` before any build step and failed.
  Fixed by typing the layout's props explicitly (`Readonly<{ children: ReactNode }>`)
  instead of depending on generated types. Lesson: verify `npm run verify` against a
  clean checkout (or at least `rm -rf .next`), not just a warm local one, before trusting
  a "typecheck passes" claim.
