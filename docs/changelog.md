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

---

_No releases yet. Entries above reflect pre-Stage-1 planning artifacts only._
