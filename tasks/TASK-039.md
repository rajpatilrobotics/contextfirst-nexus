# TASK-039: Simplify replay-only analysis UX

## 1. Task metadata

- Task ID: TASK-039
- Stage: product UX
- Status: Ready
- Wave: 14
- Risk: high
- Suggested branch: `task/039-simplified-analysis-ux`
- Depends on: TASK-018, TASK-025, TASK-038
- Graph outcome: Remove practitioner-facing provider and model controls, auto-bind only the sole selectable bundled replay release, and provide one fail-closed plain-language Start analysis experience while preserving truthful replay provenance.
- Suggested implementation commit message: `feat: simplify replay-only analysis start`

## 2. Goal

Make the Purpose flow feel like a practitioner case-preparation product rather than a developer console. The current public deployment is replay-only: the practitioner completes the purpose and safety attestations and uses one Start analysis action without choosing OpenAI, Gemini, Mistral, a model, or a release.

This task does not implement live provider routing, change shared contracts, enable live analysis, call a provider, or change deployment.

## 3. Dependencies and base requirement

- TASK-018 supplies the Purpose form, provider-selection/recovery presentation, and run controller.
- TASK-025 supplies the verified replay-only release baseline.
- TASK-038 supplies truthful fail-closed server availability with local replay selectable and every live provider non-selectable.
- Start from the exact pushed coordinator baseline on which TASK-039 is Ready.
- TASK-040 remains blocked and receives no worktree until this task is integrated.

## 4. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-039.md` in full.
3. `PLANS.md` in full.
4. The TASK-018, TASK-025, TASK-038, TASK-039, and TASK-040 entries in `TASK_GRAPH.yaml`.
5. `docs/CONTEXT_INDEX.md` in full.
6. `decision-log.md`: DEC-024, DEC-028, DEC-029, and DEC-045.
7. `PROJECT_BRIEF.md`: Approved analysis-entry direction and end-to-end flow.
8. `docs/PRODUCT_SPEC.md`: Sections 1.1 and 7.1 through 7.5.
9. `docs/DESIGN_SYSTEM.md`: Sections 1.1, 5, 9.1 through 9.3, and 10.1.
10. `docs/CONTRACTS.md`: Sections 1.1, 4.7, 5, 16, 18, and replay commands.
11. `docs/SAFETY_AND_DATA.md`: Sections 1.1 and 8.
12. `docs/MODEL_ROUTING.md`: Sections 1, 2, 6, and 7.1.
13. `docs/TESTING_AND_EVALUATION.md`: Sections 1.1, 9, and release rehearsal requirements.
14. `docs/ORCHESTRATION_AND_INTEGRATION.md`: DEC-045 continuation sequence and ownership rules.
15. Git status and the complete current contents of every Section 5 path.

## 5. Exclusive write scope

- `features/purpose/case-purpose-brief-form.tsx`
- `features/purpose/purpose-workspace.tsx`
- `features/analysis/provider-selection/`
- `features/analysis/provider-recovery/`
- `features/analysis/run-controller/index.ts`
- `components/shell/case-shell.tsx`
- `tests/components/purpose/`
- `tests/components/provider/`
- `tests/components/shell/shell.test.tsx`
- `tests/e2e/task-039-simplified-analysis.spec.ts`
- `tests/a11y/task-039-purpose-a11y.spec.ts`

No other path may be created, edited, moved, renamed, generated, or deleted.

## 6. Ownership transfer

- TASK-018 transfers the Purpose, provider-selection, provider-recovery, run-controller, and focused Purpose/provider test paths only for this approved simplification.
- TASK-027 transfers `components/shell/case-shell.tsx` and `tests/components/shell/shell.test.tsx` only for removal of persistent developer-facing Provider and Model fields or their replacement with one plain-language Analysis status.
- TASK-038 availability policy, API route, Trust data, and tests remain read-only.
- TASK-025 release artifacts and evidence remain read-only.
- TASK-040 receives later corrective ownership of the run controller and Purpose orchestration only after TASK-039 is integrated; the two tasks are never active together.

## 7. Required behavior

### 7.1 One practitioner-facing action

- Remove provider cards, provider radio/select controls, model names, release IDs, service-tier choices, and provider-switch controls from the Purpose experience.
- Replace technical selection copy with one clear Start analysis experience.
- Remove the visible provider-selection validation error.
- Preserve purpose, authority, synthetic-data, cooperation-neutrality, excluded-decision, and unverified-authority attestations.
- Preserve a concise replay/data-flow explanation without presenting it as a developer choice.
- Saving the Purpose Brief and starting analysis remain distinct actions when the existing flow requires both; neither action may become an implicit provider call.

### 7.2 Exact-one replay binding

- Derive the selectable service set from the trusted availability projection.
- Proceed only when exactly one selectable option exists and it is the local `prepared-replay-v1` release with `providerTransmission: false`.
- Auto-bind that replay release through the existing shared contracts so internal case state, acknowledgement, disclosure, audit, system card, Trust, and export provenance remain valid.
- If no option is selectable, more than one option is selectable, or the sole selectable option is live, fail closed with a simple analysis-service-unavailable message and no Start analysis activation.
- Never silently enable, select, acknowledge, or call OpenAI, Gemini, Mistral, or another live provider.

### 7.3 Start, checkpoint, and status

- Start analysis dispatches the existing trusted local replay path exactly once and performs no network provider request.
- Keep the prepared-checkpoint action separate and visibly labelled as prepared synthetic state.
- Prevent duplicate launch while the canonical command is pending or already being applied.
- Preserve existing checkpoint state, replay state, session persistence, Reset Case, route navigation, source review, export, and trust behavior.
- Remove Provider and Model from the persistent shell or replace them with one plain-language Analysis status. Do not remove detailed provenance from Trust, audit, or export records.

## 8. Required regression tests

- Exactly one selectable local replay option is auto-bound without a visible provider/model control.
- Zero selectable options fail closed with a plain service-unavailable message.
- Multiple selectable options fail closed and start nothing.
- A sole selectable live option fails closed and is never silently selected.
- The old provider-selection validation error is absent.
- Start analysis dispatches local replay once, records `providerTransmission: false`, and makes no fetch/provider call.
- The prepared checkpoint remains a distinct action.
- Purpose attestations, error-summary focus, shell navigation, Reset Case, session behavior, and accessible names remain intact.
- The shell exposes no persistent provider/model developer fields and retains truthful plain-language analysis status.
- Focused E2E and accessibility tests exercise the real replay-only Purpose flow without credentials or external calls.

## 9. Frozen invariants and forbidden changes

- Do not edit `lib/contracts/`, `lib/ai/server/`, `app/api/`, Trust implementation, export implementation, state, fixtures, packages, lockfiles, environment files, deployment configuration, Vercel settings, evaluation artifacts, admission records, provider adapters, or shared authority documents.
- Do not add or update dependencies, call a provider, use credentials, enable live analysis, promote admission, deploy, access or change production, or alter billing/quota settings.
- Do not make replay look like live AI, a fallback provider result, or a measured model run.
- Do not weaken purpose attestations, masking, leak scan, review, citation, export, audit, same-origin, or session boundaries.
- Do not add a second case-state owner or feature-local audit/provenance mechanism.

## 10. Implementation steps

1. Confirm the exact baseline, clean worktree, dependencies, and exclusive scope.
2. Capture current Purpose, run-controller, shell, replay, checkpoint, and error behavior.
3. Add focused failing tests for exact-one replay binding and every fail-closed branch.
4. Simplify the Purpose form and workspace using the existing contracts and central dispatcher.
5. Remove or retire visible provider/recovery controls and simplify the shell status within scope.
6. Add focused component, E2E, and accessibility regressions.
7. Run Section 12 in order and inspect the entire diff.
8. Stop before committing unless the worker prompt explicitly authorizes the commit.

## 11. Acceptance criteria

- Practitioners see no provider, model, release, or provider-switch control.
- The replay-only deployment presents one understandable Start analysis path.
- Exactly one selectable local replay is bound automatically; zero, multiple, or live-only availability fails closed.
- Start analysis causes zero provider transmission and preserves truthful replay, audit, Trust, and export provenance.
- Prepared checkpoint remains separate.
- Existing safety, accessibility, navigation, persistence, Reset Case, and review/export behavior remains intact.
- Only Section 5 paths change and every verification command passes.

## 12. Verification commands

Run from the repository root in this order:

```text
npx vitest run tests/components/purpose tests/components/provider tests/components/shell
npm run typecheck
npm run lint
npm run build
npx playwright test tests/e2e/task-039-simplified-analysis.spec.ts
npx playwright test tests/a11y/task-039-purpose-a11y.spec.ts
git diff --check
```

No command may require credentials, call a provider, access the stable production URL, or change deployment state.

## 13. Commit and handoff

- Commit only when the worker prompt explicitly authorizes it.
- Suggested implementation commit message: `feat: simplify replay-only analysis start`
- Report changed files, exact auto-binding and fail-closed evidence, component/E2E/accessibility results, `providerTransmission: false`, zero provider calls, and clean status.
- The coordinator integrates and verifies TASK-039 before marking TASK-040 Ready or creating its worktree.

## 14. Stop conditions

Stop and report if shared contract changes, server changes, package changes, a live-provider path, a credential, a provider call, deployment access, unowned files, or a second selectable service is required. Stop if exact-one replay binding cannot be expressed truthfully through the current contracts.
