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
  - Required tags: description, `@param <name> - <description>` for each
    parameter, `@returns <description>` (unless return type is `void`).
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
9. **JSDoc captures _intent_, not types.** TypeScript provides types; JSDoc
   tells the reader what a symbol is _for_ and how it should be used. (See
   the hard gate above.)

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

## Signs these guidelines are working

- Fewer unnecessary changes in diffs.
- Fewer rewrites due to overcomplication.
- Clarifying questions come **before** implementation, not after mistakes.
