# myagt

A NestJS backend scaffold with strict TypeScript and a comprehensive pre-commit
quality pipeline. The application code is intentionally minimal — the value of
this repo is its surrounding tooling.

> See [`AGENT.md`](./AGENT.md) for the project-wide coding guidelines (clean
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
bun test               # fast TDD loop (no coverage)
bun run test:cov       # full suite with 90% coverage floor
bun run check          # everything CI runs (typecheck + lint + format + audit + secrets + coverage)
curl http://localhost:3000   # -> "Hello World!"
```

## Project structure

```text
src/
├── domain/              # entities, value objects, domain events. Pure TS.
│   └── shared/
├── application/         # use-cases, services, DTOs, mappers, config.
│   └── shared/
│       ├── config/      # application-level configuration
│       ├── dto/         # data transfer objects
│       ├── mapper/      # entity ↔ DTO mapping
│       └── service/
│           └── app.service.ts
├── infrastructure/      # adapters (DB, HTTP clients, message buses, env, fs).
│   └── shared/
├── presentation/        # transport layer — sliced by protocol.
│   └── rest/            # REST/HTTP slice
│       └── shared/
│           ├── shared.module.ts
│           └── app.controller.ts
├── app.module.ts        # composition root
└── main.ts              # bootstrap
```

See [`AGENT.md`](./AGENT.md) for the full dependency rule and per-layer
responsibilities.

## Architecture

Layer-first DDD + Clean Architecture with convention-based CQRS. The
dependency rule (`domain` → nothing outward, `presentation` → only
`application`, etc.) is enforced by `import-x/no-restricted-paths` and runs
on every commit. See [`AGENT.md`](./AGENT.md) for the full matrix and the
"where does new code go?" decision tree.

## First-time git setup

This repo was scaffolded _before_ `git init`. To activate the pre-commit
hooks, the first developer must:

```powershell
git init
bun install                                                # registers Husky hooks
git update-index --add --chmod=+x .husky/pre-commit
git update-index --add --chmod=+x .husky/commit-msg
```

After that, every commit runs the full quality pipeline.

## The quality pipeline

Every commit runs the following gates automatically. All run on **staged files
only** for speed.

| Stage      | Tool                                  | What it enforces                                                   |
| ---------- | ------------------------------------- | ------------------------------------------------------------------ |
| pre-commit | ESLint (`--max-warnings=0 --fix`)     | strict TS rules, JSDoc on public APIs, import order, security SAST |
| pre-commit | Prettier                              | formatting                                                         |
| pre-commit | secretlint                            | secrets in staged files (AWS, GCP, Slack, npm tokens, PEMs)        |
| pre-commit | `bun audit --prod --audit-level=high` | dep CVEs (only when `package.json` is staged)                      |
| commit-msg | commitlint                            | Conventional Commits                                               |

The single command `bun run check` runs all of these against the entire
working tree (typecheck + lint + format-check + audit + secrets-scan). It is
designed to be the same command CI invokes once CI is added. It also runs
`bun run test:cov`, enforcing the **90% coverage floor** documented in `AGENT.md`.

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

| Command                | Description                           |
| ---------------------- | ------------------------------------- |
| `bun run start:dev`    | Run Nest in watch mode                |
| `bun run build`        | Compile to `dist/`                    |
| `bun run start:prod`   | Run the compiled app                  |
| `bun run test`         | Unit tests (Jest)                     |
| `bun run test:e2e`     | End-to-end tests                      |
| `bun run test:cov`     | Unit tests + 90% coverage floor       |
| `bun run lint`         | Lint with `--max-warnings=0`          |
| `bun run lint:fix`     | Lint + autofix                        |
| `bun run format`       | Format with Prettier                  |
| `bun run typecheck`    | `tsc --noEmit`                        |
| `bun run audit`        | `bun audit --prod --audit-level=high` |
| `bun run secrets:scan` | Full-tree secretlint scan             |
| `bun run check`        | All gates against entire tree         |
