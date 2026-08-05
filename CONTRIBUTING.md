# Contributing to Numera

Numera is built stage-by-stage against [docs/plan.md](docs/plan.md), tracked in
[docs/tasks.md](docs/tasks.md). Read both before starting work.

## Workflow

1. Work one stage at a time; don't start a later stage before the current one meets its
   acceptance criteria in `docs/tasks.md`.
2. Keep changes small and focused — one logical change per commit.
3. Before committing, run:
   ```bash
   npm run verify
   ```
   This runs lint, typecheck, tests, and the production build in sequence. All four must
   pass.
4. Update the relevant docs (`docs/tasks.md`, `docs/changelog.md`, and
   `docs/known-issues.md` or `docs/decisions.md` if applicable) alongside the code change,
   not as an afterthought.

## Commit messages

Use conventional prefixes, matching plan §33:

```
chore: initialize Numera project foundation
feat: add deterministic game engine
test: cover target hit behavior
fix: prevent duplicate turn submission
docs: update stage 3 implementation status
```

Do not combine unrelated changes into one commit.

## Code standards

See [docs/architecture.md](docs/architecture.md) for directory layout, TypeScript rules,
and the engine/UI separation principle. In short:

- Strict TypeScript; no `any` (lint-enforced).
- `src/game-engine/` has zero React/Next.js dependencies and is fully unit-testable.
- Validate all external or persisted data with Zod at the boundary.
- No placeholder buttons or inactive UI — every visible control must work.
- No copyrighted third-party game assets (see plan §1, §12.4, §35).

## Testing

- Unit tests live next to the source file (`Thing.ts` + `Thing.test.ts`).
- Integration tests live in `src/tests/integration/`.
- End-to-end tests (Playwright) live in `src/tests/e2e/`; run `npx playwright install`
  once before `npm run e2e`.

## Accessibility and responsiveness

Every stage that touches UI must be checked for keyboard navigation, screen-reader
labels, reduced motion, and mobile layout before it's marked done — see plan §23 and
§14.
