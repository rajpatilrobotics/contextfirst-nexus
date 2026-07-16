# TASK-035: Reconcile canonical Review component tests

## 1. Task metadata

- Task ID: TASK-035
- Stage: quality
- Status: Ready
- Wave: corrective test bridge before TASK-024 continues
- Risk: medium
- Suggested branch: `task/035-reconcile-review-component-tests`
- Depends on: TASK-020, TASK-028
- Graph outcome: Reconcile the source-drawer and timeline component tests with the canonical TASK-028 candidate and timeline definitions without changing production code, fixtures, contracts, or digests.
- Suggested implementation commit message: `test: reconcile canonical review component tests`

## 2. Goal

Repair two legacy TASK-020 component tests so they assert the canonical Review fixture introduced by TASK-028. This task is test-only. It must preserve the existing product behavior, central commands, canonical fixture, replay, contracts, digests, and test strength.

## 3. Root cause

TASK-028 removed legacy candidate aliases and reconciled the canonical timeline, but two tests originally owned by TASK-020 still expect the retired fixture data:

- The source-drawer test uses legacy candidate ID `CAND-PASSPORT-DEBT` for citation `CIT-D02-P2-S05`, whose canonical candidate is now `NEXUS-CONTROL`.
- The timeline test expects a separate alleged-conduct event that no longer exists in the canonical timeline instead of exercising persistence with the canonical control filter and the assigned deceptive-message task.

TASK-024 must remain blocked until these test expectations are corrected and TASK-035 is integrated.

## 4. Dependencies and base requirement

- TASK-020 must be integrated and provide the source drawer, timeline components, central citation-resolution behavior, and the two original test files.
- TASK-028 must be integrated and provide the frozen canonical Review definitions, candidate IDs, citation bindings, timeline chronology, and exact D05 source.
- Start from the exact pushed coordinator baseline on which TASK-035 is Ready and TASK-024 is Blocked only by TASK-035.
- Reproduce the two legacy expectation failures before editing. If the failures differ or require production or fixture changes, stop and report them.

## 5. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-035.md` in full.
3. `PLANS.md` in full.
4. The TASK-020, TASK-024, TASK-028, and TASK-035 entries in `TASK_GRAPH.yaml` in full.
5. `docs/CONTEXT_INDEX.md` in full.
6. `tasks/TASK-020.md` and `tasks/TASK-028.md` in full, focusing on source, timeline, and canonical ownership.
7. `docs/DEMO_AND_FIXTURES.md`: canonical candidate set, timeline, D02, D05, and stable-ID sections.
8. `docs/CONTRACTS.md`: citation resolution, central command, timeline filter, source access, and candidate ID sections.
9. `docs/TESTING_AND_EVALUATION.md`: fixture fidelity, component regression, and no-weakened-test requirements.
10. `docs/ORCHESTRATION_AND_INTEGRATION.md`: ownership transfer, worktree, verification, and integration sections.
11. The canonical fixture and source/timeline production implementations as read-only context.
12. Git status and the complete current contents of both Section 6 files.

## 6. Exclusive write scope

- `tests/components/review/source/source-drawer.test.tsx`
- `tests/components/review/timeline/timeline.test.tsx`

No production, fixture, replay, contract, configuration, package, or other test path may be created, edited, renamed, generated, moved, or deleted.

## 7. Corrective ownership transfer

TASK-020 transfers corrective ownership of exactly the two Section 6 test files to TASK-035. TASK-028 remains the integrated owner of the canonical fixture, Review engine, replay, and digest-preserving reconciliation; those paths are read-only.

Both dependencies are integrated and cannot be active while TASK-035 runs. TASK-024 remains blocked and owns neither test file.

## 8. Required corrections

### 8.1 Source drawer test

- Replace legacy candidate ID `CAND-PASSPORT-DEBT` with canonical candidate ID `NEXUS-CONTROL` for citation `CIT-D02-P2-S05`.
- Update the expected `resolve_citation` command's `candidateId` to `NEXUS-CONTROL`.
- Preserve the ambiguous-citation setup and ambiguity-resolution assertion.
- Preserve the assertion that the exact canonical central command is dispatched.
- Preserve the no-optimistic-access assertion: the test must not imply source access or resolved state before canonical state accepts the command.
- Do not add a compatibility alias or change the citation, segment, range, resolver, command shape, or production component.

### 8.2 Timeline test

- Remove the expectation that the canonical fixture contains a separate alleged-conduct timeline event.
- Exercise filter persistence using the canonical control filter.
- Expect the canonical `2025-04-02` assigned deceptive-message task.
- Open that event's exact D05 source through the existing user interaction.
- Confirm the canonical control filter remains selected after opening the source.
- Confirm an unrelated movement event is excluded while the control filter is active.
- Preserve the existing source-opening command, accessible interaction, and filter-persistence meaning.

## 9. Frozen invariants

- Production source-drawer and timeline behavior remains unchanged.
- The canonical fixture, 14-candidate set, timeline chronology, citation bindings, exact source ranges, replay, contracts, stable IDs, and every digest remain unchanged.
- Citation ambiguity is resolved only through the existing central command and canonical state; there is no optimistic source access.
- Timeline filtering remains user-driven and persists across exact-source opening.
- Tests continue to assert meaningful behavior and do not merely snapshot implementation details.

## 10. Forbidden changes

- Any production-code change.
- Any fixture, generator, replay, contract, stable-ID, source binding, candidate definition, timeline definition, or canonical digest change.
- Reintroducing `CAND-PASSPORT-DEBT`, any other legacy alias, or a compatibility mapping.
- Skipping, deleting, weakening, narrowing away, or suppressing a failing test or assertion.
- Adding `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, broad casts, fake fixture data, or test-only production branches.
- Changing packages, lockfiles, scripts, test configuration, environment files, cloud settings, or deployment files.
- Broad cleanup, refactoring, formatting unrelated code, or production hardening.

## 11. Implementation steps

1. Confirm the TASK-035 worktree is clean and based on the exact pushed documentation baseline.
2. Run the focused two-file command and confirm the failures are the legacy candidate and timeline expectations described in Section 3.
3. Make the smallest assertion and test-arrangement changes in the source-drawer test while preserving ambiguity, exact dispatch, and no-optimistic-access coverage.
4. Make the smallest canonical filter, event, D05 source, persistence, and exclusion changes in the timeline test.
5. Run every Section 13 command in order.
6. Inspect the full diff and status. Confirm exactly the two Section 6 files changed and no legacy alias, production path, fixture, replay, contract, digest, package, configuration, or TASK-024 file changed.

## 12. Acceptance criteria

- The source-drawer test uses `NEXUS-CONTROL` with `CIT-D02-P2-S05` and expects the exact central `resolve_citation` command with that candidate ID.
- Ambiguity-resolution and no-optimistic-access assertions remain present and meaningful.
- The timeline test uses the canonical control filter and finds the `2025-04-02` assigned deceptive-message task.
- The timeline test opens the task's exact D05 source, proves the control filter remains selected, and excludes an unrelated movement event.
- No legacy candidate alias is reintroduced.
- Only the two owned test files change.
- Every required verification command passes without skipped or weakened coverage.

## 13. Verification commands

Run from the repository root in this exact order:

```text
npx vitest run tests/components/review/source/source-drawer.test.tsx tests/components/review/timeline/timeline.test.tsx
npm run test:components
npm run verify
git diff --check
```

All four commands must pass.

## 14. Commit and handoff

- Commit only when the worker prompt explicitly authorizes it.
- Suggested implementation commit message: `test: reconcile canonical review component tests`
- Report both changed files, the original failing expectations, the corrected canonical assertions, every command result, and confirmation that no production, fixture, replay, contract, digest, package, configuration, TASK-024, or legacy-alias change occurred.
- Report whether TASK-024 can resume. Only coordinator integration and verification of TASK-035 satisfies the dependency.

## 15. Stop conditions

Stop and notify the coordinator if:

- TASK-020 or TASK-028 is not integrated; TASK-024 is not blocked only by TASK-035; the graph and packet disagree; or the worktree is not clean at launch.
- The failures do not match the retired candidate alias and canonical timeline mismatch described in this packet.
- A passing correction requires production, fixture, generator, replay, contract, digest, package, configuration, or another test file.
- The change would weaken ambiguity resolution, central command, no-optimistic-access, filter persistence, source opening, or unrelated-event exclusion coverage.
- A legacy alias, suppression, skipped test, weakened expectation, real/private data, credential, live provider call, cloud change, or deployment change appears necessary.
