# AGENTS.md — Coding Guidelines for `myagt`

This file is the source of truth for **how** code is written in this repo. Hard
gates (ESLint, JSDoc, secretlint, commitlint, `bun audit`) catch mechanical
violations through staged-file checks or local commands. The rules below cover
the **behavioural** side that no linter can enforce.

---

## Project-specific hard gates

Before reading the general guidelines, know what the staged-file checks and
local commands enforce (see `.husky/pre-commit` and `eslint.config.mjs`):

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

## Codex workflow

- Never read or modify `.env` or `.env.*` files, including through shell,
  scripts, symlinks, or MCP tools. `.env.example` is the allowed template.
  Exclude secret files from recursive searches and diffs. Do not bypass a
  protection hook with another tool or an obfuscated command.
- Use `apply_patch` for source edits. Trusted `.codex/hooks.json` hooks run
  ESLint with autofix and Prettier on edited TypeScript files and return errors
  to the agent. Fix those errors before continuing. If a task requires another
  editing tool, run the same checks explicitly on its changed files.
- Do not hand-edit `bun.lock` or bypass commit gates without an explicit user
  instruction. Use Bun's dependency commands to update the lockfile.
- After implementing or modifying `src/`, invoke the read-only
  `architecture-reviewer` in `.codex/agents/architecture-reviewer.toml` before
  completion or committing. Give it the task scope and changed files, address
  blocking findings, and request a follow-up when fixes alter architecture.
  Review the completed change once, not after every edit. Reviewers must not
  recursively invoke another reviewer.
- If custom agent roles are unavailable but subagents are supported, pass the
  role's instructions and scope to a read-only subagent. If delegation is
  unavailable, report that limitation rather than claiming the review ran.

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

The scaffold uses Clean Architecture layer boundaries and a convention for
future CQRS use-cases. The `src/` tree is sliced by layer; it does not yet
contain a complete DDD domain model.

| Layer             | Responsibility                                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| `domain/`         | Entities, value objects, domain events, domain services. **Pure TypeScript** — no framework, no outward dependencies. |
| `application/`    | Plain use-cases, application services, semantic errors, and use-case input/output shapes.                             |
| `infrastructure/` | Adapters and raw environment parsing, defaults, and coercion.                                                         |
| `presentation/`   | Transport layer sliced by protocol (`rest/`, `graphql/`, `ws/`, …). Controllers, HTTP DTOs, and public error mapping. |
| `composition/`    | Per-context Nest modules that wire controllers, adapters, config, and application services. Wiring only.              |

### Dependency rule

| Layer                                                           | May import from                   | Must NOT import from                                                                    |
| --------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| `domain/**`                                                     | other `domain/**`, node built-ins | `application/**`, `infrastructure/**`, `presentation/**`, `composition/**`, `@nestjs/*` |
| `application/**`                                                | `domain/**`                       | `infrastructure/**`, `presentation/**`, `composition/**`                                |
| `infrastructure/**`                                             | `application/**`, `domain/**`     | `presentation/**`, `composition/**`                                                     |
| `presentation/**`                                               | `application/**`                  | `domain/**`, `infrastructure/**`, `composition/**`                                      |
| `app.module.ts`, `main.ts`, `composition/**` (composition root) | anything                          | — (exempt)                                                                              |

Domain and application code must not import `@nestjs/*`, `nestjs-pino`,
`pino-http`, `express`, or `zod`, including package subpaths and type-only
imports. Both layers stay free of framework setup. Application handlers and
services are plain classes; instantiate them through composition-root providers
when their dependencies require Nest wiring. Extend the explicit dependency
restrictions when new infrastructure libraries are introduced.

These rules are enforced by `import-x/no-restricted-paths`,
`no-restricted-imports`, and `no-restricted-properties` in `eslint.config.mjs`.
They run for staged source files via `lint-staged` and on `bun run check`.

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

| Folder     | Purpose                                                |
| ---------- | ------------------------------------------------------ |
| `service/` | Plain application services that orchestrate use-cases. |
| `dto/`     | Plain use-case input/output shapes.                    |
| `mapper/`  | Transform domain objects to/from use-case DTOs.        |

Two files sit at the root of `application/<context>/`:

- `<context>-policy.ts` — plain interface `<Context>Policy` describing the
  context's business settings (limits, quotas, TTLs) in domain language.
  Infrastructure supplies the values; see "Env single source of truth".
- `<context>.repository.ts` — persistence port interface plus its DI token,
  `export const <CONTEXT>_REPOSITORY = Symbol('<Context>Repository')`.

HTTP response envelopes, Swagger-decorated DTOs, and Swagger schema helpers
belong in `presentation/rest/dto/`. Application errors expose a semantic key
and diagnostic message. REST maps those keys to public codes, HTTP statuses,
and client-facing messages.

### Env single source of truth

All raw environment parsing, defaults, and type coercion are declared only in
`src/infrastructure/config/*.config.ts`. Other production source files must
consume validated values instead of reading `process.env`. Colocated config
tests may temporarily control `process.env` and must restore them.

Two kinds of settings live there:

| Kind                                                 | File                                    | Shape owned by                                    |
| ---------------------------------------------------- | --------------------------------------- | ------------------------------------------------- |
| Technical (`PORT`, `NODE_ENV`, `LOG_LEVEL`, DB URLs) | `app.config.ts` → `appConfigSchema`     | infrastructure (`AppConfig`)                      |
| Business policy (limits, quotas, TTLs, flags)        | `<context>.config.ts`, one `registerAs` | application (`<Context>Policy` in `application/`) |

A `<context>.config.ts` parse function returns the application's
`<Context>Policy` type, so a change to the policy shape fails to compile until
infrastructure follows. Cross-field checks (e.g. default page size ≤ max page
size) belong in its zod schema so bad values fail at startup.

A rule that never varies between deployments (e.g. a maximum name length) is
not configuration: keep it as a named constant in `domain/`.

### CQRS convention

By default each bounded context exposes its use-cases through two application
services in `application/<context>/service/`:

- `<context>-command.service.ts` — `<Context>CommandService`, one method per
  state-changing use-case (`create`, `update`, `delete`, …).
- `<context>-query.service.ts` — `<Context>QueryService`, one method per
  read-only use-case (`get`, `list`, …).

Rules:

- Services are plain classes without `@Injectable()`. The context's
  composition module builds them with `useFactory` (see "Composition root").
- A constructor takes only what its service's methods use. Narrow shared
  policies with `Pick<<Context>Policy, …>` so writes never receive read limits
  and vice versa.
- Use-case inputs and outputs are plain types in `application/<context>/dto/`.
- No bus library. No `@nestjs/cqrs`. No custom CommandBus / QueryBus interface.

Extract a use-case into a standalone handler — `application/<context>/<action>.command.ts`
or `<action>.query.ts`, exporting `<Action>Handler` with an `execute()` method —
when it meets **any** of these:

- It needs a dependency that no other method in its service uses.
- Its logic exceeds ~30 lines, or keeping it would push the service file past
  300 lines.
- It needs its own transaction boundary, audit trail, or authorization check.

For example, `checkout.command.ts` stands alone rather than living in
`OrderCommandService`.

If the project later needs sagas, event sourcing, or a centralised dispatcher,
`@nestjs/cqrs` can be adopted incrementally; extracted handlers map onto its
handlers directly.

### Presentation layer sub-folders

`presentation/` is sliced by **transport protocol**, not by feature:

| Folder     | Purpose                                                                      |
| ---------- | ---------------------------------------------------------------------------- |
| `rest/`    | NestJS REST controllers, guards, pipes, HTTP DTOs, and public error mapping. |
| `graphql/` | GraphQL resolvers, input types (future).                                     |
| `ws/`      | WebSocket gateways (future).                                                 |

Each protocol folder is further divided by bounded context when contexts exist:
`presentation/rest/<context>/`.

### Where does new code go?

| What                                      | Where                                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| New REST endpoint                         | `presentation/rest/<context>/`                                                                          |
| New use-case                              | Method on `<Context>CommandService` / `<Context>QueryService` (standalone handler: see CQRS convention) |
| New application service                   | `application/<context>/service/` — `<context>-command.service.ts`, `<context>-query.service.ts`         |
| New use-case DTO                          | `application/dto/` (or `application/<context>/dto/`)                                                    |
| New business config shape                 | `application/<context>/<context>-policy.ts`                                                             |
| New repository port                       | `application/<context>/<context>.repository.ts`                                                         |
| New HTTP response envelope or Swagger DTO | `presentation/rest/dto/`                                                                                |
| New semantic application error            | `application/error/`                                                                                    |
| New public HTTP error mapping             | `presentation/rest/error/`                                                                              |
| New technical environment variable        | `infrastructure/config/app.config.ts`                                                                   |
| New business environment variable         | `infrastructure/config/<context>.config.ts`                                                             |
| New mapper                                | `application/mapper/` (or `application/<context>/mapper/`)                                              |
| New entity / value object / domain event  | `domain/<context>/`                                                                                     |
| New DB or HTTP-client adapter             | `infrastructure/<context>/`                                                                             |
| New context wiring                        | `composition/<context>.module.ts`                                                                       |

### Composition root

`src/main.ts`, `src/app.module.ts`, and `src/composition/**` may import from
any layer. No layer may import from `composition/**`, and composition files
must not read `process.env`; they receive config through `ConfigModule` keys.

Each context that needs infrastructure gets one `src/composition/<context>.module.ts`.
Presentation modules cannot do this job because they may not import
infrastructure. The composition module:

- declares the context's controllers;
- binds repository tokens to infrastructure adapters with `useClass`;
- builds application services with `useFactory`, injecting config keys and
  repository tokens;
- holds wiring only, no behaviour.

```ts
@Module({
  controllers: [ProductController],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
    {
      provide: ProductQueryService,
      useFactory: (policy: ProductPolicy, repo: ProductRepository): ProductQueryService =>
        new ProductQueryService(policy, repo),
      inject: [productConfig.KEY, PRODUCT_REPOSITORY],
    },
  ],
})
export class ProductModule {}
```

Modules that need no infrastructure wiring (e.g. `HealthModule`) may stay in
`presentation/`. Do not bypass `AppModule` to wire feature modules — every
feature module is imported into `AppModule` (directly or transitively).

### Health endpoints

The application exposes three Kubernetes-style probes under
`presentation/rest/api/health/`:

| Route                 | K8s probe | Meaning                        |
| --------------------- | --------- | ------------------------------ |
| `GET /health/live`    | Liveness  | Process is alive.              |
| `GET /health/ready`   | Readiness | App is ready to serve traffic. |
| `GET /health/startup` | Startup   | App has finished starting up.  |

Each probe calls `HealthCheckService.check([])` from `@nestjs/terminus`.
The indicator arrays are empty today. Add readiness checks when required
external dependencies are introduced.

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
- Composition-root wiring in `main.ts`, `app.module.ts`, and
  `composition/**` (covered by the separately maintained e2e suite, not unit
  tests).

### Test placement

- **Unit tests** live next to the code they test, named `<file>.spec.ts`.
- **E2E tests** are maintained in a separate repository. Local legacy files in
  `test/` remain only until a separately scoped cleanup.
- Tests for `domain/**` and `application/**` must be **pure**: no
  `Test.createTestingModule`, no DB, no HTTP, no Nest DI container. This is
  the direct payoff of the layer-dependency rule.

### Coverage

Global threshold of **90%** for `lines`, `statements`, `functions`, and
`branches`, enforced by Jest's `coverageThreshold`. Runs only when coverage
is collected — i.e., via `bun run test:cov`. Default `bun run test` stays
uninstrumented so the local TDD loop is fast. The `bun run check` composite
includes coverage; CI is not configured by this change.

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
