# Numera — Known Issues

Tracks open defects, risks, and gaps. Update at the end of every stage. Remove an entry
only once it's verified fixed (not just believed fixed).

## Open

_None yet — project has no code. This log will be populated as implementation begins._

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

_None yet._
