# myagt

A NestJS backend scaffold with strict TypeScript and layer boundaries. The
application code is intentionally minimal; it does not yet demonstrate a
complete DDD model.

> See [`AGENTS.md`](./AGENTS.md) for the project-wide coding guidelines (clean
> code, JSDoc requirements, behavioural rules for AI assistants).

## Prerequisites

| Tool | Version   |
| ---- | --------- |
| Bun  | >= 1.3.13 |

The Node version used to run the compiled app in production is a deployment
concern and is not pinned at the development tier.

**No global binaries required** — every dev tool (including the secrets
scanner, `secretlint`) is installed via `bun add -d` and lives inside
`node_modules/`.

## Quick start

```bash
bun install            # installs deps and (after git init) activates Husky hooks
bun run start:dev      # boots Nest on http://localhost:3000
bun run test                 # Jest unit tests
bun run test:cov             # Unit coverage with the existing 90% thresholds
bun run test:architecture    # ESLint layer-boundary fixture tests
bun run check                # Existing local checks; excludes e2e
curl http://localhost:3000/health/live
```

## Project structure

```text
src/
├── application/
│   └── error/                 # semantic keys and diagnostic messages
│       ├── application-error.ts
│       └── common.error.ts
├── infrastructure/
│   └── config/
│       ├── app.config.ts      # raw environment parsing and defaults
│       └── log-level.ts
├── presentation/
│   └── rest/
│       ├── api/health/
│       │   ├── health.controller.ts
│       │   └── health.module.ts
│       ├── dto/
│       │   ├── api-response.dto.ts
│       │   ├── error-response.dto.ts
│       │   └── paging-api-response.dto.ts
│       ├── error/
│       │   └── http-error-mapping.ts
│       └── filters/
│           └── global-exception.filter.ts
├── app.module.ts             # composition root
└── main.ts                   # bootstrap
scripts/
└── architecture-boundaries.test.mjs
```

See [`AGENTS.md`](./AGENTS.md) for the full dependency rule and per-layer
responsibilities.

## Architecture

The scaffold uses Clean Architecture layer boundaries and a convention for
future CQRS use-cases. Layer and framework import restrictions are enforced by
ESLint, with fixture tests in `scripts/architecture-boundaries.test.mjs`.
`application/error/` owns semantic error keys and diagnostic messages;
`presentation/rest/error/` maps them to public codes, statuses, and messages.
Plain use-case DTOs belong in `application/dto/`; HTTP response envelopes and
Swagger DTOs belong in `presentation/rest/dto/`. See [`AGENTS.md`](./AGENTS.md)
for the dependency rule and file placement guidance.

All response-envelope timestamps are Unix epoch milliseconds. Error timestamps
previously used seconds; consumers in the separate e2e repository must expect
milliseconds. Public error codes, names, messages, and statuses are otherwise
preserved by this cleanup.

The health endpoints currently have empty indicator arrays. Add readiness
checks when required external dependencies are introduced.

## First-time git setup

This repo was scaffolded _before_ `git init`. To activate the pre-commit
hooks, the first developer must:

```powershell
git init
bun install                                                # registers Husky hooks
git update-index --add --chmod=+x .husky/pre-commit
git update-index --add --chmod=+x .husky/commit-msg
```

After that, commits run the configured staged-file checks.

## The quality pipeline

Pre-commit runs the staged-file checks configured by lint-staged. It does not
run the complete typecheck/test suite. CI is not configured by this change;
e2e is managed in a separate repository.

| Stage      | Tool                                  | What it enforces                                                   |
| ---------- | ------------------------------------- | ------------------------------------------------------------------ |
| pre-commit | ESLint (`--max-warnings=0 --fix`)     | strict TS rules, JSDoc on public APIs, import order, security SAST |
| pre-commit | Prettier                              | formatting                                                         |
| pre-commit | secretlint                            | secrets in staged files (AWS, GCP, Slack, npm tokens, PEMs)        |
| pre-commit | `bun audit --prod --audit-level=high` | dep CVEs (only when `package.json` is staged)                      |
| commit-msg | commitlint                            | Conventional Commits                                               |

The local `bun run check` command runs typecheck, lint, architecture-boundary
tests, source/test TypeScript format checks, audit, secrets scan, and
`bun run test:cov`. It excludes e2e.
The 90% coverage thresholds are documented in `AGENTS.md`.

## Adding a function

Strict JSDoc is enforced on all functions, classes, and methods in `src/`.
Every public symbol must have a JSDoc block with a description, `@param`
descriptions for every parameter, and `@returns` description (unless the
return type is `void`). TypeScript provides the _types_; JSDoc provides the
_intent_.

Test files (`*.spec.ts`, `*.e2e-spec.ts`) are exempt.

## Escape hatches

| Need                                    | How                                                                                                            |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Bypass hooks for one commit             | `git commit --no-verify` (use sparingly)                                                                       |
| Disable an ESLint rule on a line        | `// eslint-disable-next-line <rule> -- <reason>` (the `-- <reason>` is enforced by the eslint-comments plugin) |
| Allowlist a known false-positive secret | Add an `allows` entry to the rule in `.secretlintrc.json` with a `# reason` comment in the surrounding file    |
| Tolerate a `bun audit` finding          | Document the decision; raise `--audit-level` for that one commit only                                          |

## Scripts

| Command                     | Description                                                      |
| --------------------------- | ---------------------------------------------------------------- |
| `bun run start:dev`         | Run Nest in watch mode                                           |
| `bun run build`             | Compile to `dist/`                                               |
| `bun run start:prod`        | Run the compiled app                                             |
| `bun run test`              | Unit tests (Jest)                                                |
| `bun run test:e2e`          | Legacy local e2e command; the separate repository owns e2e tests |
| `bun run test:cov`          | Unit tests + 90% coverage floor                                  |
| `bun run test:architecture` | ESLint layer-boundary fixture tests                              |
| `bun run lint`              | Lint with `--max-warnings=0`                                     |
| `bun run lint:fix`          | Lint + autofix                                                   |
| `bun run format`            | Format with Prettier                                             |
| `bun run typecheck`         | `tsc --noEmit`                                                   |
| `bun run audit`             | `bun audit --prod --audit-level=high`                            |
| `bun run secrets:scan`      | Full-tree secretlint scan                                        |
| `bun run check`             | Existing local checks; excludes e2e                              |
