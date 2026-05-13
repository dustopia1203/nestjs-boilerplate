# AGENT.md — Coding Guidelines for `myagt`

This file is the source of truth for **how** code is written in this repo. Hard
gates (ESLint, JSDoc, secretlint, commitlint, `bun audit`) catch mechanical
violations on every commit. The rules below cover the **behavioural** side
that no linter can enforce.

---

## Project-specific hard gates

Before reading the general guidelines, know what is enforced _automatically_ on
every `git commit` (see `.husky/pre-commit` and `eslint.config.mjs`):

- **JSDoc is mandatory** on every function, class, method, getter, setter,
  interface, type alias, and enum in `src/`. Missing JSDoc fails the commit.
  - Description: one short sentence — what it does, nothing more.
  - `@param <name> - <description>`: required for each parameter, one phrase.
  - `@returns <description>`: required unless the return type is `void`, one phrase.
  - Test files (`*.spec.ts`, `*.e2e-spec.ts`) are exempt.
- **OpenAPI decorators are mandatory** on every route method in
  `src/presentation/rest/**`. A method decorated with `@Get`, `@Post`,
  `@Put`, `@Patch`, or `@Delete` that lacks `@ApiOperation` or at least one
  `@ApiResponse` fails the pre-commit hook.
  - Enforced by `@darraghor/nestjs-typed` in `eslint.config.mjs`.
  - Also add `@ApiTags('<name>')` at the class level (convention, not linted).
  - Test files (`*.spec.ts`, `*.e2e-spec.ts`) are exempt.
- **Strict TypeScript:** `strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns`,
  `noFallthroughCasesInSwitch`. No `any`. No non-null assertions without
  comment justification.
- **Explicit return types** on all exported functions / class methods.
- **Import order** enforced (`builtin` → `external` → `internal` → `parent` →
  `sibling` → `index`, alphabetised, blank-line separated).
- **No floating promises**, no misused promises, type-only imports for types.
- **Secrets scanner** (`secretlint`) blocks any commit that contains AWS keys,
  GCP service-account JSON, npm tokens, private keys, etc.
- **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`,
  `test:`, `style:`, `perf:`, `build:`, `ci:`) enforced by commitlint.
- **`bun audit --prod --audit-level=high`** runs whenever `package.json` is
  staged.

To bypass for a single commit (discouraged): `git commit --no-verify`.

---

## Clean Code Principles

These are non-negotiable for new code. When editing existing code, raise
violations rather than silently rewriting (see "Surgical Changes" below).

1. **Names reveal intent.** A reader should know what a symbol does without
   chasing definitions. Prefer `unpaidInvoiceCount` over `cnt`, `loadedAt`
   over `ts`.
2. **Functions do one thing.** If a function description needs the word "and",
   it's two functions. Extract.
3. **Small functions, small files.** Aim for functions ≤ 30 lines and files
   ≤ 300 lines. These are guidelines, not gates — but if you're past them,
   pause and justify.
4. **No magic numbers / strings.** Lift them to `const` with a name that
   explains the value's _meaning_, not just its content.
5. **Fail loudly, recover deliberately.** Never swallow errors. Either handle
   them with a documented strategy or let them propagate.
6. **DRY, but not WET-phobic.** Three occurrences of similar logic is a
   refactor candidate. Two is usually fine — premature abstraction is worse
   than duplication.
7. **Pure where possible.** Push side effects to the edges of the system.
   Domain logic should be testable without mocks.
8. **Comments explain _why_, never _what_.** The code already shows what.
   Comments earn their keep by capturing trade-offs, links to issues, or
   non-obvious constraints.
9. **JSDoc is one short sentence.** Say what the symbol does — nothing the
   type signature already tells. No paragraphs, no rephrasing of param types.

---

## Behavioural guidelines to reduce common LLM coding mistakes

Merge with project-specific instructions as needed.

> **Trade-off:** These guidelines bias toward caution over speed. For trivial
> tasks, use judgment.

### 1. Think Before Coding

Don't assume. Don't hide confusion. Surface trade-offs.

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: _"Would a senior engineer say this is overcomplicated?"_ If
yes, simplify.

### 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that _your_ changes made unused.
- Don't remove pre-existing dead code unless asked.

**The test:** every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass."
- "Fix the bug" → "Write a test that reproduces it, then make it pass."
- "Refactor X" → "Ensure tests pass before and after."

For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]

Strong success criteria let you loop independently. Weak criteria
("make it work") require constant clarification.

---

## Project Architecture

Layer-first DDD + Clean Architecture with convention-based CQRS. The `src/`
tree is sliced by Clean Architecture layer.

| Layer             | Responsibility                                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| `domain/`         | Entities, value objects, domain events, domain services. **Pure TypeScript** — no framework, no outward dependencies. |
| `application/`    | Use-cases (commands + queries), application services, DTOs, mappers, config. Orchestrates the domain.                 |
| `infrastructure/` | Adapters (DB, HTTP clients, message buses, env, fs).                                                                  |
| `presentation/`   | Transport layer sliced by protocol (`rest/`, `graphql/`, `ws/`, …). Controllers, request/response mapping.            |

### Dependency rule

| Layer                                         | May import from                   | Must NOT import from                                                  |
| --------------------------------------------- | --------------------------------- | --------------------------------------------------------------------- |
| `domain/**`                                   | other `domain/**`, node built-ins | `application/**`, `infrastructure/**`, `presentation/**`, `@nestjs/*` |
| `application/**`                              | `domain/**`                       | `infrastructure/**`, `presentation/**`                                |
| `infrastructure/**`                           | `application/**`, `domain/**`     | `presentation/**`                                                     |
| `presentation/**`                             | `application/**`                  | `domain/**`, `infrastructure/**`                                      |
| `app.module.ts`, `main.ts` (composition root) | anything                          | — (exempt)                                                            |

The "no NestJS in `domain/`" rule is intentional and strict. Domain code stays
pure TypeScript so it is testable without `Test.createTestingModule`, mocks,
or any framework setup. If a domain service needs `@Injectable()`, the
service belongs in `application/`, not `domain/`.

The rule is enforced by `import-x/no-restricted-paths` in `eslint.config.mjs`
and runs on every commit via `lint-staged` and on `bun run check`.

### Path aliases

```text
@domain/*         → src/domain/*
@application/*    → src/application/*
@infrastructure/* → src/infrastructure/*
@presentation/*   → src/presentation/*
```

**Convention.** Use the alias for **cross-layer** imports. Use a relative
path (`./foo`) for **same-folder siblings**.

### Application layer sub-folders

Sub-folders live directly under `application/` (or under a bounded-context
sub-folder `application/<context>/` once real contexts are introduced):

| Folder     | Purpose                                                       |
| ---------- | ------------------------------------------------------------- |
| `service/` | Application services — orchestrate domain + infrastructure.   |
| `dto/`     | Input / output data shapes crossing the application boundary. |
| `mapper/`  | Transform domain objects to/from DTOs.                        |
| `config/`  | Application-level feature flags, settings, constants.         |

### Env single source of truth

All environment variables — validation, defaults, and type coercion — are declared in
`src/application/config/app.config.ts` **only**. No other file in `src/` may:

- reference `process.env` directly, or
- define a Zod (or any other) schema over raw env vars.

Config modules outside `app.config.ts` must accept already-validated `AppConfig` as
input. New env vars go into `appConfigSchema` first; only then may other config files
consume them via `AppConfig`.

### CQRS convention

Use-cases are plain classes, **one file per use-case**, placed directly inside
`application/` (or `application/<context>/` once bounded contexts are introduced):

- `<action>.command.ts` — state-changing operation. Handler in the same file
  or a sibling `<action>.command-handler.ts`.
- `<action>.query.ts` — read-only operation.

Rules:

- Handlers are plain classes invoked directly from controllers via Nest DI.
- No bus library. No `@nestjs/cqrs`. No custom CommandBus / QueryBus interface.

If the project later needs sagas, event sourcing, or many handlers benefiting
from a centralised dispatcher, `@nestjs/cqrs` can be adopted incrementally
without moving files.

### Presentation layer sub-folders

`presentation/` is sliced by **transport protocol**, not by feature:

| Folder     | Purpose                                  |
| ---------- | ---------------------------------------- |
| `rest/`    | NestJS REST controllers, guards, pipes.  |
| `graphql/` | GraphQL resolvers, input types (future). |
| `ws/`      | WebSocket gateways (future).             |

Each protocol folder is further divided by bounded context when contexts exist:
`presentation/rest/<context>/`.

### Where does new code go?

| What                                     | Where                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| New REST endpoint                        | `presentation/rest/<context>/`                                                              |
| New use-case                             | `application/` (or `application/<context>/`) — `<action>.command.ts` or `<action>.query.ts` |
| New application service                  | `application/service/` (or `application/<context>/service/`)                                |
| New DTO                                  | `application/dto/` (or `application/<context>/dto/`)                                        |
| New mapper                               | `application/mapper/` (or `application/<context>/mapper/`)                                  |
| New entity / value object / domain event | `domain/<context>/`                                                                         |
| New DB or HTTP-client adapter            | `infrastructure/<context>/`                                                                 |

### Composition root exception

`src/main.ts` and `src/app.module.ts` may import from any layer. Do not
bypass `AppModule` to wire feature modules — every feature module is
imported into `AppModule` (directly or transitively).

### Health endpoints

The application exposes three Kubernetes-style probes under `presentation/rest/health/`:

| Route                 | K8s probe | Meaning                        |
| --------------------- | --------- | ------------------------------ |
| `GET /health/live`    | Liveness  | Process is alive.              |
| `GET /health/ready`   | Readiness | App is ready to serve traffic. |
| `GET /health/startup` | Startup   | App has finished starting up.  |

Each probe calls `HealthCheckService.check([indicatorArray])` from
`@nestjs/terminus`. The arrays are intentionally empty today — new indicators
(disk usage, memory heap, DB ping, external HTTP) are added directly inside
the relevant probe method's array, with no controller-shape change.

OpenAPI documentation for all routes (including these) is served at
`GET /api-docs` (Swagger UI) and `GET /api-docs-json` (raw spec). The setup
lives in `src/main.ts`.

## Test-Driven Development

Mandatory red → green → refactor for every change that introduces or alters
behaviour:

1. **Write the test first.** Run it. Confirm it fails _for the right reason_
   — i.e., the missing behaviour, not a typo or compile error. If it does
   not compile, fix the compile error first, then observe the meaningful
   failure.
2. **Write the minimum production code** to make the test pass.
3. **Refactor without changing behaviour.** All tests stay green.

For bug fixes: start by writing a test that reproduces the bug. The test
must fail. Then fix.

### Exemptions (no new test required)

- Pure formatting, comment, or JSDoc-only changes.
- Dependency version bumps with no API surface change.
- Type-only changes that the type-checker already proves.
- Composition-root wiring in `main.ts` and `app.module.ts` (covered by the
  e2e suite, not unit tests).

### Test placement

- **Unit tests** live next to the code they test, named `<file>.spec.ts`.
- **E2E tests** live in `test/`.
- Tests for `domain/**` and `application/**` must be **pure**: no
  `Test.createTestingModule`, no DB, no HTTP, no Nest DI container. This is
  the direct payoff of the layer-dependency rule.

### Coverage

Global threshold of **90%** for `lines`, `statements`, `functions`, and
`branches`, enforced by Jest's `coverageThreshold`. Runs only when coverage
is collected — i.e., via `bun run test:cov`. Default `bun test` stays
uninstrumented so the local TDD loop is fast. CI is expected to invoke
`bun run test:cov`. The `bun run check` composite includes it.

Path-ignored from coverage:

- `node_modules/`
- `src/main.ts` (composition root)
- `src/app.module.ts` (composition root)
- `**/*.module.ts` (Nest modules are wiring, not behaviour)

Cross-link: this section is the operational form of "Goal-Driven Execution"
above — the failing test _is_ the verifiable goal.

## Signs these guidelines are working

- Fewer unnecessary changes in diffs.
- Fewer rewrites due to overcomplication.
- Clarifying questions come **before** implementation, not after mistakes.
