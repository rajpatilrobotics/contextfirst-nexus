# TASK-027: Case state and export contract bridge

## 1. Task metadata

- Task ID: TASK-027
- Stage: integration bridge
- Status: Ready after the coordinator-owned packet and graph update are pushed.
- Wave: bridge before TASK-016, TASK-018, and TASK-022 resume.
- Risk: high.
- Suggested branch: `task-027-case-state-export-bridge`.
- Depends on: TASK-009, TASK-010, TASK-017.
- Graph outcome: Replace the shell-private state boundary with the canonical shared case-state context and dispatcher, correct export-input freshness and selection revision behavior, and build the complete canonical export limitation union.

## 2. Goal

Bridge the integrated shell, case reducer, and export core so every case route consumes one canonical persisted `CaseState`, export freshness follows frozen analysis-input provenance rather than unrelated case revision changes, export-selection changes produce a current gate for the resulting revision, and every required limitation is preserved in the manifest.

## 3. Why this task exists

TASK-022 preflight confirmed four shared integration defects that cannot be repaired inside a feature worktree without violating exclusive ownership. The shell currently owns private state that route children cannot consume, the export gate compares a run's source case revision even when the frozen analysis input is unchanged, export selection can make a newly evaluated gate stale immediately, and the manifest limitation list omits required sources. These are shared contract-bridge fixes and must land before evaluation, Purpose/provider UI, or export UI proceeds.

## 4. Dependencies and base requirement

- TASK-009 must be integrated and provide the canonical export gate and manifest implementation.
- TASK-010 must be integrated and provide `CaseState`, canonical `CaseCommand` handling, revision checks, session persistence, and reset behavior.
- TASK-017 must be integrated and provide the case shell and shell component tests.
- Start from the coordinator branch after TASK-027 is marked Ready and its packet and graph update are pushed.
- TASK-016, TASK-018, and TASK-022 remain blocked until this task is integrated and verified.
- TASK-020 is independent of this bridge and remains unchanged.
- Use only installed dependencies and frozen contracts. Do not install packages or change shared schemas.

## 5. Required context

Read these sources before editing, in this order:

1. `AGENTS.md` in full.
2. `tasks/TASK-027.md` in full.
3. `PLANS.md` in full.
4. The TASK-027 entry and TASK-009, TASK-010, TASK-016, TASK-017, TASK-018, TASK-020, and TASK-022 entries in `TASK_GRAPH.yaml`.
5. `docs/CONTEXT_INDEX.md` in full.
6. `docs/ORCHESTRATION_AND_INTEGRATION.md`: Sections 4, 5, 6, 7, 8, 9, 12, 13, and 16.
7. `docs/ARCHITECTURE.md`: Sections 3, 4, 6, 7, 8.6, 8.7, 11, 13, 14, and 16.
8. `docs/CONTRACTS.md`: Sections covering `RunInputStateProvenance`, `CaseCommand`, `CaseState`, `ExportGate`, `ExportManifest`, reviewed export candidates and gaps, coverage decisions, and guidance cards.
9. `docs/PRODUCT_SPEC.md`: Sections 6, 7.1, 7.5, 7.12 through 7.15, 9, 10, and 12.
10. `docs/SAFETY_AND_DATA.md` in full.
11. `docs/TESTING_AND_EVALUATION.md`: Sections covering case-state transitions, persistence, export gates, manifest parity, regressions, and integration verification.
12. `tasks/TASK-009.md`, `tasks/TASK-010.md`, and `tasks/TASK-017.md`, with special attention to their frozen invariants and original ownership.
13. The current contents and Git status of every path in Section 6.

## 6. Exclusive write scope

- `components/shell/`
- `lib/export/core/`
- `lib/state/`
- `tests/components/shell/`
- `tests/unit/export/core/`
- `tests/unit/state/`

No other path may be created, edited, renamed, generated, moved, or deleted by this task.

## 7. Dependency-ordered ownership transfer

The coordinator explicitly transfers corrective ownership as follows:

- From TASK-017 to TASK-027: `components/shell/` and `tests/components/shell/`.
- From TASK-009 to TASK-027: `lib/export/core/` and `tests/unit/export/core/`.
- From TASK-010 to TASK-027: `lib/state/` and `tests/unit/state/`.

TASK-009, TASK-010, and TASK-017 are integrated and must not be active while TASK-027 runs. This is a dependency-ordered transfer for the four bridge fixes only, not concurrent shared ownership. TASK-027 must preserve every unrelated behavior and public contract established by those tasks.

## 8. Read-only context allowed

- `app/case/demo/layout.tsx`
- `app/case/demo/`
- `lib/contracts/`
- `lib/analysis/replay.ts`
- `lib/fixtures/`
- `lib/guidance/`
- `lib/review/`
- `lib/redaction/`
- `lib/citations/`
- `fixtures/cases/`
- `fixtures/guidance/`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vitest.config.ts`
- The authoritative documents and task packets listed in Section 5.

Read-only inspection does not grant permission to repair, reformat, or regenerate these paths.

## 9. Required fixes and frozen behavior

### 9.1 Shared case-state boundary

- Replace the shell's private `useState` boundary with the architecture-required shared React context and a canonical command dispatcher backed by the existing case-state command application logic.
- `CaseShell` and every route child under `/case/demo/*` must observe the same `CaseState` object and dispatch through the same command path. A route child must not create, shadow, or directly mutate a second state store.
- The provider boundary must remain owned by the case shell/layout composition without requiring an edit outside Section 6.
- Restore the approved persisted projection from versioned `sessionStorage`, persist successful state transitions, preserve stale-command rejection, and preserve the existing invalid-payload reset behavior.
- Reset must dispatch exactly one canonical `reset_case` command, clear or replace persisted case state through the approved persistence path, update shell and route consumers together, retain the synthetic-case boundary, and navigate to Purpose as currently specified.
- Preserve test injection seams such as deterministic initial state and navigation/reset observation where they remain useful, without creating a separate production state path.

### 9.2 Frozen-input provenance for export freshness

- Remove `sourceCaseRevision` from the comparison that decides whether the active successful analysis run still matches the current frozen analysis input. Case review and export-selection revisions must not make an otherwise identical analysis input stale.
- Validate the actual provenance required by the frozen contract:
  - Purpose identity and Purpose revision.
  - Masking revision.
  - Ordered selected segment IDs; order is significant and set-equivalence is insufficient.
  - Approved-redacted-input digest.
  - Canonical fixture binding, including the frozen fixture identity/version/digest available to the current state and fixture source.
  - Ruleset/guidance binding required by the run and current case state.
- Remove any tautological or self-comparison that cannot detect stale input.
- A mismatch in any required frozen-input field must produce the existing safe stale-run blocker. A change only to `sourceCaseRevision` must not.

### 9.3 Export-selection revision and gate ordering

- Normalize the requested export selection and determine whether it materially differs from the stored gate selection.
- When the selection materially changes, increment `caseRevision` and invalidate the prior export record/manifest before evaluating the new gate.
- Evaluate the gate against that resulting state and revision, so `exportGate.caseRevision` equals the returned state's `caseRevision`.
- Re-evaluating the same normalized selection must not create an unnecessary revision bump and may reuse a still-current gate only when every existing reuse condition holds.
- Preserve canonical command revision checks, audit behavior, blocker behavior, and export creation requirements.

### 9.4 Complete manifest limitation union

- Build `ExportManifest.limitations` as a sorted, duplicate-free union of non-empty strings from exactly these sources:
  - `limitationTexts` from candidates included in the manifest.
  - Coverage limitation texts included in the manifest.
  - Reviewed context-gap explanations included in the manifest when an explanation exists.
  - `limitation` from guidance cards included in the manifest.
- Excluded candidates and excluded guidance cards must not contribute limitations.
- The union must be deterministic regardless of input insertion order and must not alter the existing structured candidate, coverage, reviewed-gap, or guidance-card projections.

### 9.5 Manual citation-resolution enforcement

- Enforce manual citation resolution in the canonical `resolve_citation` command path, not only in TASK-020 presentation controls.
- Accept manual resolution only for a citation in the active successful run whose current validation state is `ambiguous_match` and whose owning active candidate has the matching source dependency.
- Reject attempts to rewrite an exact, already manually resolved, unknown, unavailable, cross-run, or candidate-unowned citation.
- Validate that the chosen segment and range are an allowed bounded exact occurrence for the unresolved citation; an arbitrary segment or range must not become trusted through the command.
- Preserve the immutable resolution record, audit event, provenance, export invalidation, and case-revision behavior for a valid resolution.

## 10. Out of scope

- Any shared contract or Zod schema change.
- Any edit to `app/`, feature routes, export renderers, provider code, evaluation code, fixture files, guidance files, package files, shared configuration, documentation, or the task graph.
- New state commands, export blocker codes, manifest fields, dependencies, routes, storage mechanisms, or network behavior.
- Refactoring unrelated reducer, shell, review, replay, analysis, citation, masking, or export behavior.
- Weakening review, freshness, minimum-necessity, privacy, provenance, or export gates.
- Production hardening, deployment changes, cloud configuration, provider calls, real data, or credentials.

## 11. Implementation steps

1. Confirm the worktree is clean and based on the pushed TASK-027 documentation baseline.
2. Add the shared typed case-state context and canonical dispatcher inside `components/shell/`, then make shell presentation and route children consume the same provider state.
3. Preserve session restoration, successful-transition persistence, stale-command handling, Reset Case, navigation, and test seams.
4. Correct active-run frozen-input matching in `lib/export/core/` without changing contract schemas or blocker codes.
5. Correct `evaluate_export_gate` ordering in `lib/state/` so material selection changes update revision before gate evaluation.
6. Build the deterministic limitation union from only included manifest data.
7. Enforce the manual citation-resolution preconditions in the central state command path.
8. Add focused regression tests for all five fixes inside the transferred test paths.
9. Run only the exact verification in Section 13, inspect the owned-path diff, and prepare the handoff.

## 12. Acceptance criteria

- A route child and the visible shell read the same `CaseState`; a command dispatched by either is reflected by both without a second store.
- Session restoration hydrates the shared state once, successful commands persist the approved projection, stale or invalid commands do not silently mutate state, and Reset Case preserves the current required behavior.
- Changing only `sourceCaseRevision` does not make a run stale when every frozen input provenance field still matches.
- Changing Purpose identity or revision, masking revision, selected segment order or membership, approved-redacted-input digest, fixture binding, or ruleset binding makes the run stale through the existing safe blocker.
- A materially changed export selection increments `caseRevision` before evaluation, clears prior export output, and stores a gate current for the resulting revision.
- The same normalized selection does not cause an extra revision bump.
- Manifest limitations are sorted and duplicate-free and contain all included candidate limitations, coverage limitations, reviewed gap explanations, and included guidance-card limitations, with excluded content absent.
- Manual resolution succeeds only for a valid active ambiguous citation, matching candidate dependency, and allowed exact occurrence; invalid status, ownership, run, segment, and range attempts are rejected without mutation.
- All pre-existing focused shell, export-core, and state behavior remains passing.
- Only the six paths in Section 6 change.

## 13. Verification commands

```text
npx vitest run tests/components/shell tests/unit/export/core tests/unit/state
npm run typecheck
npm run build
```

All three commands must pass. Do not weaken or skip a regression assertion to obtain a pass.

## 14. Manual checks

1. Confirm the diff contains only Section 6 paths and no generated, package, configuration, fixture, documentation, or task-graph changes.
2. Confirm one test proves a route child and shell update from the same context/dispatcher.
3. Confirm persistence and Reset Case tests exercise the shared production path rather than a test-only store.
4. Confirm provenance tests independently cover each required field and explicitly prove `sourceCaseRevision` is ignored.
5. Confirm selection tests compare first/materially changed and unchanged normalized selections and assert gate/state revision equality.
6. Confirm limitation tests contain duplicates and shuffled input, then assert the exact sorted union and absence of excluded limitations.
7. Confirm manual-resolution tests cover valid ambiguity resolution plus rejection of exact, already resolved, cross-run, candidate-unowned, arbitrary-segment, and invalid-range attempts.
8. Inspect the diff for credentials, private data, raw source text, provider payloads, or real-person data. None may be present.

## 15. Commit permission and message

- Do not commit unless the coordinator explicitly authorizes the implementation commit.
- Exact implementation commit message: `fix: bridge case state and export contracts`

## 16. Handoff requirements

- Report `Task: TASK-027` and outcome as Complete, Partial, or Blocked.
- List every changed file and confirm each is within Section 6.
- Summarize the shared context/dispatcher, persistence and reset preservation, manual citation-resolution enforcement, provenance comparison, revision-before-gate behavior, and limitation union.
- Report every Section 13 command and every Section 14 manual check.
- Identify any unrun check, blocker, assumption, or required coordinator follow-up.
- Include a commit SHA only if the coordinator authorized the exact Section 15 commit; otherwise report `Not committed`.

## 17. Stop conditions

Stop and report to the coordinator if:

- Any dependency is not integrated or the worktree is not based on the pushed documentation baseline.
- A fix requires any write outside Section 6, including `app/case/demo/layout.tsx`, shared contracts, fixtures, guidance data, package files, configuration, documentation, or the task graph.
- The existing contracts cannot express the shared dispatcher, manual citation-resolution enforcement, frozen provenance check, gate revision, or limitation union.
- A new command, blocker code, manifest field, dependency, storage mechanism, or public API appears necessary.
- Existing user changes overlap an owned path and cannot be preserved safely.
- Verification exposes an unrelated failure that cannot be resolved within the exclusive scope without broad cleanup or hardening.
