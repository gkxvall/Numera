# Numera

**Count smart. Tap carefully. Survive.**

Numera is a mobile-first multiplayer number survival game for local party play, built
with an original energetic cartoon-battle visual identity. Players take turns adding 1–3
to a shared counter — whoever hits the secret target loses a life. Last player standing
wins.

The full product and implementation specification lives in [docs/plan.md](docs/plan.md).
Current build status is tracked in [docs/tasks.md](docs/tasks.md).

## Status

Early foundation stage — see [docs/tasks.md](docs/tasks.md) for exactly what's built and
what's next. Gameplay is not implemented yet.

## Stack

- [Next.js](https://nextjs.org) (App Router) + [React](https://react.dev) + TypeScript
  (strict mode)
- [Tailwind CSS](https://tailwindcss.com) v4
- [Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com) for
  unit/integration tests
- [Playwright](https://playwright.dev) for end-to-end tests
- ESLint + Prettier

See [docs/architecture.md](docs/architecture.md) for the directory layout and coding
standards.

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command                 | Purpose                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `npm run dev`           | Start the development server                                          |
| `npm run build`         | Production build                                                      |
| `npm run start`         | Serve the production build                                            |
| `npm run lint`          | ESLint                                                                |
| `npm run lint:fix`      | ESLint with autofix                                                   |
| `npm run format`        | Prettier — write                                                      |
| `npm run format:check`  | Prettier — check only                                                 |
| `npm run typecheck`     | TypeScript, no emit                                                   |
| `npm run test`          | Unit/integration tests (Vitest), single run                           |
| `npm run test:watch`    | Vitest in watch mode                                                  |
| `npm run test:coverage` | Vitest with coverage report                                           |
| `npm run e2e`           | Playwright end-to-end tests (run `npx playwright install` once first) |
| `npm run verify`        | lint + typecheck + test + build, in sequence                          |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Documentation

- [docs/plan.md](docs/plan.md) — full product and implementation spec (authoritative)
- [docs/tasks.md](docs/tasks.md) — stage-by-stage task tracker
- [docs/architecture.md](docs/architecture.md) — directory layout, coding standards
- [docs/decisions.md](docs/decisions.md) — architecture decision log
- [docs/known-issues.md](docs/known-issues.md) — open issues and risks
- [docs/changelog.md](docs/changelog.md) — change history

## License

Not yet decided. All game assets are original — no third-party or copyrighted game
assets are used.
