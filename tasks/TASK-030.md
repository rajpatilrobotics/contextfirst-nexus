# TASK-030: Withdrawal dependency reconciliation bridge

## 1. Task metadata

- Task ID: TASK-030
- Stage: integration bridge
- Status: Ready
- Wave: bridge before TASK-016, TASK-021, and TASK-022 resume
- Risk: high
- Suggested branch: `task-030-withdrawal-dependency-reconciliation`
- Depends on: TASK-008, TASK-009, TASK-010, TASK-027, TASK-028
- Graph outcome: Reconcile historical non-source dependency edges during renewed review so the canonical withdrawal flow can clear unresolved dependency blockers without losing provenance or weakening export gates.

## 2. Goal

Preserve the existing evidence-withdrawal invalidation flow, then reconcile only the directly affected candidate's no-longer-valid non-source dependency edges when a practitioner performs the required renewed human review. Persist the reconciled canonical candidates, bind the new review decision to the resulting active dependencies, and restore the frozen Step 3 export result without deleting history or bypassing any gate.

## 3. Why this task exists

The integrated withdrawal engine correctly invalidates downstream candidates and revokes export readiness, but renewed review currently leaves active candidate or Nexus edges pointing at withdrawn or still-invalidated targets. The export gate therefore continues to return `DEPENDENCY_UNRESOLVED` after the practitioner completes the frozen recovery sequence. This defect crosses the review engine, central state reducer, and existing export-core regression boundary, so it requires one explicit dependency-ordered bridge rather than a UI or renderer workaround.

## 4. Dependencies and base requirement

- TASK-008 must be integrated and provide the deterministic review engine, dependency traversal, withdrawal invalidation, review policy, and hero transition.
- TASK-009 must be integrated and provide the canonical export gate, dependency-closure checks, and manifest behavior.
- TASK-010 must be integrated and provide the central `CaseState` reducer, canonical review and withdrawal commands, revision handling, audit history, persistence projection, and replay behavior.
- TASK-027 must be integrated and provide the latest state and export contract bridge, export-gate staleness behavior, and canonical manifest limitation union.
- TASK-028 must be integrated and provide the frozen 14-candidate review fixture, stable dependency graph, checkpoint, replay, and exact hero sequence.
- Start from the pushed coordinator baseline on which TASK-030 is Ready and TASK-016, TASK-021, and TASK-022 are blocked by it.
- Use only existing contracts and installed dependencies. Do not change schemas, fixture definitions, UI, package files, or export-core production code.

## 5. Required context

Read these sources before editing, in this order:

1. `AGENTS.md` in full.
2. `tasks/TASK-030.md` in full.
3. `PLANS.md` in full.
4. The TASK-030 entry and TASK-008, TASK-009, TASK-010, TASK-016, TASK-021, TASK-022, TASK-027, and TASK-028 entries in `TASK_GRAPH.yaml`.
5. `docs/CONTEXT_INDEX.md` in full.
6. `docs/CONTRACTS.md`: the complete `EvidenceDependency`, `CaseCandidate`, `ReviewIntent`, `ReviewDecision`, `DependencyChange`, `CaseCommand`, `CaseState`, `ExportGate`, `ExportManifest`, review-completion, dependency-closure, withdrawal, and export-provenance sections.
7. `docs/DEMO_AND_FIXTURES.md`: the canonical candidate set, dependency definitions, Step 0 through Step 3 withdrawal transition, exact limitation, expected export, and audit-history sections.
8. `docs/ARCHITECTURE.md`: review, dependency recalculation, canonical state, audit, and export sections.
9. `docs/PRODUCT_SPEC.md`: review, evidence withdrawal, dependency feedback, export, and product-invariant sections.
10. `docs/SAFETY_AND_DATA.md`: evidence withdrawal, human review, provenance, and minimum-necessary export requirements.
11. `docs/TESTING_AND_EVALUATION.md`: review-policy, central-state, withdrawal-flow, export-gate, and regression requirements.
12. `docs/ORCHESTRATION_AND_INTEGRATION.md`: Sections 4 through 9, 12, 13, and 16.
13. `tasks/TASK-008.md`, `tasks/TASK-009.md`, `tasks/TASK-010.md`, `tasks/TASK-027.md`, and `tasks/TASK-028.md`, with attention to their frozen behavior and original ownership.
14. The current contents and Git status of every path in Section 6.

## 6. Exclusive write scope

- `lib/review/index.ts`
- `lib/state/index.ts`
- `tests/unit/review/review.test.ts`
- `tests/unit/state/case-state.test.ts`
- `tests/unit/export/core/export-core.test.ts`

No other path may be created, edited, renamed, generated, moved, or deleted by this task.

## 7. Dependency-ordered ownership transfer

The coordinator explicitly transfers corrective ownership as follows:

- From TASK-008 and its later reconciler TASK-028 to TASK-030: `lib/review/index.ts` and `tests/unit/review/review.test.ts` for renewed-review dependency reconciliation only.
- From TASK-010 and its later bridge TASK-027 to TASK-030: `lib/state/index.ts` and `tests/unit/state/case-state.test.ts` for persistence of the reconciled canonical candidates only.
- From TASK-009 and its later bridge TASK-027 to TASK-030: `tests/unit/export/core/export-core.test.ts` for the focused gate and manifest regression only. `lib/export/core/` remains read-only.

All five dependencies are integrated and must not be active while TASK-030 runs. This is a bounded transfer for the withdrawal reconciliation defect, not concurrent shared ownership. Preserve every unrelated behavior established by those tasks.

## 8. Read-only context allowed

- `lib/contracts/`
- `lib/export/core/`
- `lib/analysis/replay.ts`
- `lib/fixtures/`
- `fixtures/cases/cfn-demo-001.json`
- `docs/`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vitest.config.ts`
- The dependency packets listed in Section 5

Read-only inspection does not grant permission to repair, regenerate, reformat, or modify these paths.

## 9. Required behavior

### 9.1 Preserve withdrawal invalidation

- Preserve the existing dedicated `withdraw_candidate` and `withdrawCandidate` behavior.
- Withdrawal must still mark the target withdrawn and invalidated, traverse only reachable active non-source dependency edges, invalidate only affected downstream candidates, leave unrelated candidates and decisions intact, append the withdrawal decision and `DependencyChange`, stale export readiness, and advance the canonical revision and audit history.
- Do not change the withdrawal command shape, review-intent boundary, dependency-change schema, blocker codes, or frozen hero outcomes.

### 9.2 Reconcile dependencies during renewed human review

- Reconciliation occurs when a directly affected candidate receives its renewed human review after dependency invalidation. It must not rewrite unrelated candidates or perform a bulk repair.
- Before deriving the renewed `ReviewDecision`, inspect that candidate's current dependencies against the canonical candidate collection.
- For each active non-source dependency, resolve its candidate or Nexus target generically. If the target is withdrawn or currently invalidated, preserve the dependency record but set `active: false`.
- Never delete a dependency edge, change its ID, discriminator, target, relationship, or historical meaning.
- Keep every source dependency active.
- Keep every active candidate or Nexus dependency whose target remains included and valid active.
- Preserve dependencies that were already historical with `active: false`; do not reactivate them implicitly.
- Apply this behavior through generic dependency logic. Runtime code must not name or branch on `CAND-TASK-0402`, `NEXUS-COMPELLED-TASKS`, `NEXUS-OFFENCE-TIMING`, or any other fixture-specific candidate ID.

### 9.3 Bind the renewed decision to reconciled active dependencies

- Reconcile the candidate before deriving the renewed immutable `ReviewDecision`.
- The renewed decision's `dependencySnapshot` must contain exactly the sorted IDs of dependencies that are active after reconciliation.
- The snapshot must exclude newly historical edges and retain source plus surviving valid candidate or Nexus edges.
- Preserve all existing decision derivation rules, including action validation, candidate revision, previous and resulting status, actor, reviewer role, time, prompt/ruleset versions, reason, edited or limitation text, and supersession.

### 9.4 Persist the canonical reconciled candidates

- `reviewCandidate` must return the complete candidate collection containing the reconciled directly reviewed candidate and all existing derived-summary recalculations.
- The central `review_candidate` reducer path must persist that returned collection as `CaseState.candidates`; it must not reconstruct candidates from the pre-review state or keep a parallel dependency collection.
- Preserve canonical case-revision increment, export staleness, review append, audit event, active-run checks, idempotency, and session persistence behavior.

### 9.5 Restore the frozen Step 3 export result

- Exercise the real canonical withdrawal sequence: withdraw the task evidence, renew review of `NEXUS-COMPELLED-TASKS`, then renew review of `NEXUS-OFFENCE-TIMING` as the required limitation.
- The exact limitation text is: `Insufficient evidence to support a link between the 2025-04-02 alleged communication and an assigned task.`
- After those reviews, canonical export-gate evaluation must no longer return `DEPENDENCY_UNRESOLVED` for historical edges to the withdrawn or invalidated target.
- The resulting manifest must exclude the positive withdrawn-task relationship, retain the exact limitation, and preserve the withdrawal, dependency-change, and renewed-review provenance.
- Use the existing export gate and manifest implementation without weakening closure, review-completion, freshness, minimum-necessity, purpose, citation, privacy, or provenance checks. A historical inactive edge is not permission to omit any still-active dependency.

## 10. Required regression tests

Add focused tests proving:

- Existing withdrawal invalidation still reaches only the expected active downstream closure and preserves unrelated candidates.
- Renewed review deactivates only active candidate or Nexus edges whose canonical targets are withdrawn or invalidated.
- Deactivated edges remain present with `active: false`, while source edges and valid surviving candidate or Nexus edges remain active.
- Already inactive historical edges remain inactive and are not deleted or duplicated.
- A generic constructed dependency graph with non-fixture IDs receives the same reconciliation behavior, proving runtime logic is not ID-specific.
- The renewed `ReviewDecision.dependencySnapshot` exactly matches the sorted post-reconciliation active edge IDs.
- The central reducer stores the reconciled candidates and preserves revision, audit, review, persistence, and export-staleness behavior.
- The full frozen withdrawal and renewed-review sequence clears `DEPENDENCY_UNRESOLVED` without bypassing any other blocker.
- The resulting manifest excludes the positive withdrawn-task relationship, includes the exact limitation, and retains withdrawal plus renewed-review provenance.
- Existing focused review, state, and export-core tests remain passing.

## 11. Out of scope

- Editing shared contracts, fixture definitions, fixture generation, replay, checkpoints, export-core production code, routes, components, renderers, providers, evaluation code, package files, configuration, documentation, or the task graph.
- Adding a command, decision field, dependency type, blocker code, manifest field, schema, package, persistence store, or alternate state collection.
- Deleting historical dependencies, automatically reactivating inactive dependencies, weakening export closure, treating an invalidated target as valid, or suppressing `DEPENDENCY_UNRESOLVED` unconditionally.
- Hardcoding fixture candidate IDs in runtime code.
- Broad refactoring, optional cleanup, production hardening, deployment, provider calls, credentials, or real data.

## 12. Implementation steps

1. Confirm the worktree is clean, based on the pushed TASK-030 documentation baseline, and limited to Section 6 ownership.
2. Record the existing withdrawal, renewed-review, reducer, gate, and manifest behavior with focused failing regressions.
3. Add the smallest generic review-layer reconciliation that preserves dependency records and deactivates only invalid active non-source edges before decision derivation.
4. Derive the dependency snapshot from the reconciled candidate and return the reconciled candidate collection through the existing review result.
5. Ensure the central reducer persists that returned collection without changing unrelated command behavior.
6. Add the state and export regressions for the complete frozen Step 3 flow and provenance.
7. Run only Section 14 verification, inspect the full diff for exclusive ownership and fixture-ID-free runtime logic, and prepare the handoff.

## 13. Acceptance criteria

- Withdrawal invalidation behavior and provenance remain unchanged.
- Renewed human review preserves every dependency record and changes only qualifying active non-source edges to `active: false`.
- Source dependencies and surviving valid candidate or Nexus dependencies remain active.
- Runtime reconciliation is generic and contains no fixture candidate IDs.
- The renewed decision snapshot is the exact sorted active dependency set after reconciliation.
- `CaseState.candidates` contains the reconciled candidates after the central command succeeds.
- After the frozen renewed reviews, the export gate has no `DEPENDENCY_UNRESOLVED` blocker caused by the historical withdrawn relationship.
- The manifest excludes the positive withdrawn-task relationship, includes the exact required limitation, and preserves withdrawal and renewed-review provenance.
- No export gate, review gate, or provenance requirement is bypassed or weakened.
- Only the five paths in Section 6 change and every Section 14 command passes.

## 14. Verification commands

Run from the repository root in this exact order:

```text
npx vitest run tests/unit/review tests/unit/state tests/unit/export/core
npm run typecheck
```

Both commands must pass. Do not replace them with narrower tests or use a pass-through option.

## 15. Manual checks

1. Confirm the diff contains only the five Section 6 paths and no fixture, contract, export-core production, package, configuration, documentation, or task-graph change.
2. Search runtime changes for fixture candidate IDs and confirm none are present.
3. Inspect the post-withdrawal candidates and verify the original downstream invalidation and unrelated-candidate preservation are unchanged.
4. Inspect each renewed-review candidate and verify only invalid active non-source edges became historical records with `active: false`.
5. Compare each renewed decision snapshot with the candidate's active dependency IDs after reconciliation.
6. Confirm the reducer's returned state owns the reconciled candidates and retains canonical review, revision, audit, persistence, and export-staleness effects.
7. Evaluate the real gate and manifest after the frozen Step 3 sequence; confirm no historical-edge `DEPENDENCY_UNRESOLVED`, no positive withdrawn-task relationship, the exact limitation, and complete withdrawal plus renewed-review provenance.
8. Confirm no gate, dependency closure, review requirement, citation requirement, or minimum-necessity check was weakened.

## 16. Commit permission and message

- Do not commit unless the coordinator explicitly authorizes the implementation commit.
- Exact implementation commit message: `fix: reconcile withdrawal dependencies`

## 17. Handoff requirements

- Report `Task: TASK-030` and outcome as Complete, Partial, or Blocked.
- List every changed path and confirm each is within Section 6.
- Summarize preserved withdrawal invalidation, generic renewed-review reconciliation, historical edge preservation, decision snapshot derivation, reducer persistence, and export behavior.
- Report every Section 14 command and Section 15 manual check.
- Report the exact gate blocker set and manifest provenance after the frozen Step 3 sequence.
- Identify any unrun check, blocker, assumption, or coordinator follow-up.
- Include a commit SHA only if the coordinator authorized the exact Section 16 commit; otherwise report `Not committed`.

## 18. Stop conditions

Stop and report to the coordinator if:

- Any dependency is not integrated or the worktree is not based on the pushed TASK-030 documentation baseline.
- A correct reconciliation requires a schema, fixture, replay, checkpoint, command, export-core production, package, configuration, UI, documentation, or task-graph change.
- Existing user changes overlap a Section 6 path and cannot be preserved safely.
- Preserving the frozen withdrawal flow requires fixture-specific runtime branching or deletion of historical dependency records.
- The export can clear `DEPENDENCY_UNRESOLVED` only by weakening or bypassing a gate rather than reconciling canonical active dependencies.
- Verification exposes an unrelated defect that cannot be fixed inside Section 6 without broad cleanup or hardening.
