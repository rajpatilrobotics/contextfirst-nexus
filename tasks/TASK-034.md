# TASK-034: Repository lint baseline repair

## 1. Task metadata

- Task ID: TASK-034
- Stage: quality
- Status: Ready
- Wave: corrective quality bridge before TASK-024 continues
- Risk: high
- Suggested branch: `task/034-repository-lint-baseline`
- Depends on: TASK-022, TASK-023
- Graph outcome: Resolve the 32 integrated lint errors through behavior-preserving type, unused-code, navigation, and prefer-const corrections without weakening lint or changing TASK-024-owned files.
- Exact implementation commit message: `fix: repair integrated lint baseline`

## 2. Goal

Resolve all 32 repository lint errors reported during TASK-024 verification. Make only accurate, behavior-preserving corrections in the 18 exclusively owned files. Do not weaken ESLint, suppress a finding, change packages, alter generated contracts or digests, or edit any TASK-024-owned path.

## 3. Root cause and boundary

TASK-024 ran the integrated repository lint command and found 32 pre-existing errors across files outside its ownership. Those errors block TASK-024 verification but do not authorize TASK-024 to repair upstream implementation paths. TASK-034 receives narrow corrective ownership of the exact reported files so the lint baseline can be restored independently.

The dirty TASK-024 worktree and its generated evidence are not inputs to this task and must remain untouched. TASK-024 stays blocked until TASK-034 is integrated and reverified on the coordinator branch.

## 4. Dependencies and base requirement

- TASK-022 and TASK-023 must be integrated. Together their dependency closure contains every prior owner of the files transferred to TASK-034.
- Start from the exact pushed coordinator baseline on which TASK-034 is Ready and TASK-024 is Blocked.
- Reproduce the 32 reported lint errors from the clean TASK-034 worktree before editing.
- Use the existing TypeScript contracts, provider SDK types, Next.js navigation component, ESLint rules, and test infrastructure. Do not add a package, configuration rule, or alternate lint command.

## 5. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-034.md` in full.
3. `PLANS.md` in full.
4. The TASK-022, TASK-023, TASK-024, and TASK-034 entries in `TASK_GRAPH.yaml` in full.
5. `docs/CONTEXT_INDEX.md` in full.
6. `docs/ORCHESTRATION_AND_INTEGRATION.md`: ownership transfer, worktree, verification, and integration sections.
7. `docs/CONTRACTS.md`: the contracts used by each owned implementation and test file.
8. `docs/ARCHITECTURE.md`: provider boundary, state, replay, evaluation, Review, Export, and route boundaries.
9. `docs/SAFETY_AND_DATA.md`: provider, fixture, output, logging, and private-data invariants.
10. `docs/TESTING_AND_EVALUATION.md`: deterministic evaluation, fixture digest, regression, and test-meaning requirements.
11. `package.json`, `eslint.config.mjs`, `tsconfig.json`, and the installed SDK type declarations as read-only context.
12. Git status and the complete current contents of all paths in Section 6.

## 6. Exclusive write scope

- `app/api/analyze/route.ts`
- `app/trust/page.tsx`
- `features/documents/documents-workspace.tsx`
- `features/review/dependency/dependency-change-panel.tsx`
- `lib/ai/server/adapters/openai.ts`
- `lib/ai/server/evaluation-entry.ts`
- `lib/ai/server/orchestrator.ts`
- `lib/ai/server/recovery.ts`
- `lib/analysis/replay.ts`
- `lib/evaluation/harness.ts`
- `lib/review/index.ts`
- `lib/state/index.ts`
- `scripts/generate-synthetic-fixtures.mjs`
- `tests/components/export/export-workspace.test.tsx`
- `tests/components/provider/run-controller.test.ts`
- `tests/components/purpose/purpose-form.test.tsx`
- `tests/unit/ai/orchestration/orchestrator.test.ts`
- `tests/unit/evaluation/runner.test.ts`

No other path may be created, edited, renamed, generated, moved, or deleted.

## 7. Corrective ownership transfer

The coordinator transfers narrow lint-repair ownership from these integrated tasks:

- TASK-012 and TASK-015 for the OpenAI adapter, analysis route, orchestration, evaluation-entry, recovery, and orchestration test paths.
- TASK-016 for the evaluation harness and runner test.
- TASK-019 and TASK-029 for the Documents workspace and the provider and Purpose test paths.
- TASK-021 for the dependency-change panel.
- TASK-022 for the Export workspace test.
- TASK-023 for the Trust page.
- TASK-028, TASK-030, and TASK-031 for replay, review, state, and fixture-generator paths.

All transferring tasks are integrated through TASK-022 and TASK-023. The transfer is only for resolving the reported lint errors without behavior changes. TASK-024 remains blocked and owns none of the Section 6 paths.

## 8. Required corrections

### 8.1 Accurate types

- Replace every reported explicit `any` with an accurate existing contract or SDK type when one exists.
- When the value is genuinely untrusted or not yet narrowed, use `unknown` and perform safe runtime or structural narrowing before use.
- Preserve request validation, provider boundaries, response normalization, recovery behavior, evaluation behavior, reducer behavior, replay behavior, and test assertions.
- Do not use broad casts, double assertions, erased generics, or invented local types solely to silence lint.

### 8.2 Genuinely unused code

- Remove only genuinely unused imports, variables, helpers, parameters where permitted by the existing interface, and destructured properties.
- Preserve side effects, evaluation order, output ordering, object projections, discriminated-union narrowing, provider calls, and test setup or cleanup behavior.
- Do not remove an assertion, branch, fixture check, audit step, or test arrangement merely because its result is unused.

### 8.3 Trust navigation

- Replace the landing navigation anchor in `app/trust/page.tsx` with the existing Next.js `Link` component.
- Preserve the exact destination, visible text, styling, focus behavior, accessibility behavior, and navigation semantics.
- Do not change other Trust content, evidence, admission status, layout, or links.

### 8.4 Prefer const

- Apply the reported `prefer-const` correction only where the binding is never reassigned.
- Do not change mutation behavior, object identity, ordering, or control flow.

## 9. Frozen invariants

- All fixture digests, canonical inputs, evaluation-definition digests, guidance digest, generated artifact bytes, and output ordering remain unchanged.
- Provider admission, provider request minimization, provider selection, recovery ordering, live-provider boundaries, and no-automatic-run behavior remain unchanged.
- Analysis orchestration, evaluation records, aggregate-score rules, replay, review dependency behavior, case reducer behavior, export behavior, audit events, and test meaning remain unchanged.
- The Trust page remains truthful: live providers stay not evaluated and non-selectable, simulated Failed evidence remains test-only, and no aggregate score or effectiveness claim is added.
- The existing dirty TASK-024 worktree and its generated evidence remain untouched, and no TASK-024-owned file is modified by TASK-034.
- The repository lint configuration and rule severity remain unchanged.

## 10. Forbidden changes

- `eslint-disable` comments or directives of any form.
- `@ts-ignore`, `@ts-expect-error`, assertion removal, skipped tests, weakened expectations, or hidden failures.
- Editing ESLint, TypeScript, Vitest, Playwright, Next.js, or package configuration.
- Weakening a lint rule, changing a lint command, excluding a path, adding a suppression, or changing a reporter.
- Broad casts, double casts, placeholder interfaces, or unnecessary type assertions used only to silence lint.
- Changing `package.json`, a lockfile, installed dependencies, scripts, environment files, or deployment files.
- Changing fixtures, generated artifacts, digests, prompts, provider admission, cloud settings, credentials, or live-provider behavior.
- Editing any TASK-024-owned file, including its application surfaces, configuration, tests, scripts, or generated evidence.
- Broad refactoring, formatting unrelated code, optional cleanup, production hardening, or changing application behavior.

## 11. Implementation steps

1. Confirm the TASK-034 worktree is clean and based on the exact pushed documentation baseline.
2. Run `npm run lint` and inventory all 32 errors by rule, file, and line. Stop if a reported error requires an unowned path or a forbidden change.
3. Repair one lint category at a time using existing contracts and SDK types, safe `unknown` narrowing, genuine unused-code removal, the scoped Next `Link` replacement, and the exact `prefer-const` correction.
4. After each category, rerun the narrowest useful lint or type check without changing the required final commands.
5. Run every command in Section 13 in order.
6. Inspect generated-file status and the full diff. Confirm only Section 6 paths changed and no fixture, digest, package, configuration, TASK-024, environment, or deployment file changed.

## 12. Acceptance criteria

- `npm run lint` reports zero errors without suppressions, exclusions, configuration changes, or weakened rules.
- Every explicit `any` finding is replaced by an accurate existing type or `unknown` with safe narrowing.
- Only genuinely unused code is removed, with runtime behavior and test meaning preserved.
- The Trust landing navigation uses Next `Link` with the same destination, text, styling, focus behavior, and navigation behavior.
- The reported `prefer-const` correction is applied without control-flow or mutation changes.
- Fixture generation check passes and every digest and generated artifact remains unchanged.
- Provider boundaries, orchestration, evaluation, replay, review, state, export, and audit behavior remain unchanged.
- All focused contract, unit, component, typecheck, build, and diff checks pass.
- Only the 18 exact Section 6 files change.
- No TASK-024-owned path or diagnostic artifact changes.

## 13. Verification commands

Run from the repository root in this exact order:

```text
npm run lint
npm run typecheck
node scripts/generate-synthetic-fixtures.mjs --check
npx vitest run tests/contracts/api tests/unit/ai/orchestration tests/unit/evaluation tests/unit/review tests/unit/state
npx vitest run tests/components/export tests/components/provider tests/components/purpose
npm run build
git diff --check
```

All seven commands must pass. Do not substitute a narrower command for the final lint run.

## 14. Commit and handoff

- Commit only when the worker prompt explicitly authorizes it.
- Exact implementation commit message: `fix: repair integrated lint baseline`
- Report all 18 owned paths and identify which actually changed.
- Report the original and final lint counts, every required command result, fixture-generation result, and confirmation that packages, configuration, fixtures, digests, provider admission, cloud settings, TASK-024 files, and TASK-024 evidence remained unchanged.
- Report whether TASK-024 can resume. Only coordinator integration and verification of TASK-034 satisfies the dependency.

## 15. Stop conditions

Stop and notify the coordinator if:

- TASK-022 or TASK-023 is not integrated; TASK-024 is not blocked; the graph and packet disagree; or the TASK-034 worktree is not clean at launch.
- The baseline does not reproduce the reported lint failures, an error appears outside Section 6, or a correction requires an unowned file.
- A correction would change runtime behavior, test meaning, fixture or output ordering, a digest, prompt, provider boundary, admission state, reducer, replay, evaluation, export, or audit behavior.
- A suppression, lint-rule change, configuration edit, package change, broad cast, assertion weakening, fixture change, generated-artifact change, or TASK-024 edit appears necessary.
- Any credential, private data, live-provider call, cloud change, deployment change, or unsupported claim appears.
