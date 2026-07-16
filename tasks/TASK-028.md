# TASK-028: Canonical review fixture reconciliation

## 1. Task metadata

- Task ID: TASK-028
- Stage: integration reconciliation
- Status: Ready after the coordinator-owned packet and graph update are pushed.
- Wave: bridge before TASK-016, TASK-021, and TASK-022 resume.
- Risk: high.
- Suggested branch: `task-028-canonical-review-fixture-reconciliation`.
- Depends on: TASK-003, TASK-008, TASK-010, TASK-020.
- Graph outcome: Reconcile the synthetic review definitions, review engine, checkpoint, and replay with the frozen 14-candidate set and distinct D03/D04 arrival chronology without changing canonical fixture, redacted-input, evaluation, or provider bindings.

## 2. Goal

Make the generated `CFN-DEMO-001` review fixture, deterministic review assembly, and replay/checkpoint projections agree exactly with the frozen stable candidate set and chronology in `docs/DEMO_AND_FIXTURES.md`, while preserving every canonical content and provider-binding digest.

## 3. Why this task exists

TASK-020 preflight confirmed that the current generated review definitions use non-canonical candidate identities and omit the distinct documented D03 arrival and reported D04 worksite-arrival records required by TASK-021. Because the fixture generator, review engine, and replay/checkpoint projections are owned by earlier integrated tasks, the correction must be one explicit dependency-ordered reconciliation task rather than a local review-UI patch.

## 4. Dependencies and base requirement

- TASK-003 must be integrated and provide the deterministic generator, canonical fixture, review definitions, and stable synthetic source records.
- TASK-008 must be integrated and provide deterministic candidate assembly, review policy, dependency behavior, and hero withdrawal transition.
- TASK-010 must be integrated and provide trusted replay and prepared-checkpoint construction and validation.
- TASK-020 must be integrated and provide timeline/source consumers that exposed the missing canonical chronology.
- Start from the coordinator branch after TASK-028 is marked Ready and its packet and graph update are pushed.
- TASK-016, TASK-021, and TASK-022 remain blocked until this task is integrated and verified. TASK-020 remains integrated and must not be modified.
- Use only installed dependencies and frozen shared contracts. No live provider call, package change, or real data is required.

## 5. Required context

Read these sources before editing, in this order:

1. `AGENTS.md` in full.
2. `tasks/TASK-028.md` in full.
3. `PLANS.md` in full.
4. The TASK-028 entry and TASK-003, TASK-008, TASK-010, TASK-016, TASK-020, TASK-021, and TASK-022 entries in `TASK_GRAPH.yaml`.
5. `docs/CONTEXT_INDEX.md` in full.
6. `docs/DEMO_AND_FIXTURES.md` in full, especially the expected chronology, stable candidate IDs, six Nexus rows, three review lanes, early blockers, hero interaction, replay, and prepared checkpoint.
7. `docs/CONTRACTS.md`: Sections covering source segments, citations, `CaseCandidate`, timeline records, Nexus dependencies, context gaps, review decisions, replay bundles, checkpoint bundles, fixture digest projections, and evaluation fixture binding.
8. `docs/ARCHITECTURE.md`: Sections 7, 8.5, 8.6, 10, 11, 13, and 14.
9. `docs/SAFETY_AND_DATA.md` in full.
10. `docs/TESTING_AND_EVALUATION.md`: Sections covering deterministic fixtures, citation/review behavior, replay/checkpoint validation, evaluation binding, and regression verification.
11. `docs/ORCHESTRATION_AND_INTEGRATION.md`: Sections 4 through 9, 12, 13, and 16.
12. `tasks/TASK-003.md`, `tasks/TASK-008.md`, `tasks/TASK-010.md`, and `tasks/TASK-020.md`, with special attention to their frozen invariants and original ownership.
13. The current contents and Git status of every path in Section 6.

## 6. Exclusive write scope

- `scripts/generate-synthetic-fixtures.mjs`
- `fixtures/cases/cfn-demo-001.json`
- `lib/fixtures/`
- `lib/review/`
- `lib/analysis/replay.ts`
- `tests/unit/fixtures/`
- `tests/unit/review/`
- `tests/unit/replay/`

No other path may be created, edited, renamed, generated, moved, or deleted by this task.

## 7. Dependency-ordered ownership transfer

The coordinator explicitly transfers corrective ownership as follows:

- From TASK-003 to TASK-028: `scripts/generate-synthetic-fixtures.mjs`, `fixtures/cases/cfn-demo-001.json`, and `lib/fixtures/`.
- From TASK-008 to TASK-028: `lib/review/` and `tests/unit/review/`.
- From TASK-010 to TASK-028: `lib/analysis/replay.ts` and `tests/unit/replay/`.
- TASK-028 exclusively owns new focused fixture regression tests under `tests/unit/fixtures/`.

TASK-003, TASK-008, and TASK-010 are integrated and must not be active while TASK-028 runs. This transfer is limited to canonical review-fixture reconciliation. TASK-020 is an integrated read-only dependency and none of its files transfer to TASK-028.

## 8. Read-only context allowed

- `lib/contracts/`
- `lib/citations/`
- `lib/state/`
- `lib/export/`
- `lib/guidance/`
- `fixtures/evals/definitions/`
- `fixtures/replay/`
- `fixtures/guidance/`
- `features/review/timeline/`
- `features/review/source/`
- `tests/components/review/timeline/`
- `tests/components/review/source/`
- `lib/ai/server/types.ts`
- `lib/ai/server/admission.ts`
- `lib/ai/server/canonical-input.ts`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vitest.config.ts`
- The authoritative documents and packets listed in Section 5.

Read-only inspection does not grant permission to repair, reformat, or regenerate these paths.

## 9. Frozen canonical candidate set

`reviewDefinitions.candidateDefinitions` must contain exactly 14 unique candidates and no aliases, replacements, legacy IDs, or extras. Membership is exactly:

1. `CAND-TL-ARRIVAL`
2. `CAND-CTRL-PASSPORT`
3. `CAND-CTRL-CONFINEMENT`
4. `CAND-PROV-TASKLOG`
5. `CAND-TASK-0402`
6. `CAND-SENDER-0402`
7. `CAND-URG-INTERPRETER`
8. `CAND-META-COOPERATION`
9. `NEXUS-RECRUITMENT`
10. `NEXUS-MOVEMENT`
11. `NEXUS-CONTROL`
12. `NEXUS-COMPELLED-TASKS`
13. `NEXUS-OFFENCE-TIMING`
14. `NEXUS-URGENCY`

The eight non-Nexus candidates must retain the exact intent, stable wording rules, item origin, assertion mode, support state, required human action, evidence nature, and dependencies specified in `docs/DEMO_AND_FIXTURES.md`. The six Nexus candidates must retain their canonical categories, review requirements, dependencies, support semantics, and one stable ID per row.

## 10. Required reconciliation and invariants

### 10.1 Distinct arrival chronology

- The canonical timeline must separately represent the D03 ticket arrival in J-02 on `2025-03-12` and the D04 reported worksite arrival around `2025-03-15`.
- The D03 arrival is documented evidence grounded in `D03-P1-S02`, with day precision and no upgrade beyond what the travel record documents.
- The D04 worksite arrival is reported evidence grounded in the canonical D04 source segment containing that recollection, with approximate qualification preserved.
- The two events must remain distinct. They create a clarification question and must not be merged, treated as automatically contradictory, or rewritten as one arrival fact.

### 10.2 Stable review behavior

- Preserve evidence nature on every source dependency and keep item origin, support status, review status, and assertion mode separate.
- Preserve stable source, candidate, and Nexus dependencies with no orphan, duplicate, cycle, cross-run, or renamed target.
- Preserve exactly three review lanes and their frozen labels and membership semantics.
- Preserve both early blocker IDs: `CAND-SENDER-0402` and `CAND-URG-INTERPRETER`.
- Preserve the hero withdrawal transition for `CAND-TASK-0402`, including reachable invalidation of `NEXUS-COMPELLED-TASKS` and `NEXUS-OFFENCE-TIMING`, preserved unrelated decisions, changed support, export revocation, and the exact insufficient-evidence limitation behavior.
- Never infer sender identity, authenticate D05, upgrade D04 reported evidence, convert unknown cooperation into evidence, or create a legal, victim-status, guilt, credibility, eligibility, or score conclusion.

### 10.3 Replay and checkpoint consistency

- Ordinary deterministic replay and `DEMO-CHECKPOINT-REVIEW` must instantiate the reconciled 14-candidate set with one internally owned run ID and no mixed-run references.
- Candidate counts, citation counts, dependency targets, fixture-reviewer seeded decisions, review statuses, active run, selected segment order, Purpose, masking, and checkpoint provenance must remain internally consistent.
- Replay remains `Bundled deterministic replay, not live AI`; the prepared checkpoint remains `Prepared synthetic review checkpoint`; seeded decisions remain attributed to Fixture reviewer.
- The checkpoint must preserve the expected pre-hero reviewed state and remain able to execute the canonical withdrawal transition without substituting another candidate.

### 10.4 Frozen digest and provider bindings

The review-definition correction must not change any content/provider binding. Preserve:

- `canonicalFixtureDigest`: `ede4457873700cc4bce1bb5fad29c89a4e25d2e6ca7ccd33c323a2ce8ac5809c`.
- `approvedRedactedInputDigest`: `430b6bd635d101340c52c41e65d66b55c8d443fbff4a252748dab504845e18ee`.
- Every evaluation definition file, packet digest, control-fixture digest, and evaluation-definition-set digest.
- Provider fixture binding for case `CFN-DEMO-001`, fixture version `1.0.0`, bundled synthetic origin, and the canonical fixture digest above.

`reviewDefinitions` must remain outside the canonical source-content and approved-redacted-input digest projections. Generator `--check` must pass without rewriting any unowned fixture, evaluation, provider, PDF, guidance, manifest, or public asset.

## 11. Out of scope

- Shared contract, Zod schema, provider, adapter, admission, evaluation-definition, prompt, package, lockfile, configuration, UI, TASK-020, export, or documentation changes.
- Any source text, PDF, document/page/segment ID, selected-segment order, redaction map, approved mask, guidance card, evaluation expectation, split, or provider release change.
- New candidates beyond the exact 14, replacement aliases for frozen IDs, a fourth review lane, a new early blocker, or a substituted hero candidate.
- Reinterpreting D03 and D04 as proof of contradiction, causation, trafficking status, guilt, credibility, eligibility, or any legal outcome.
- Broad fixture-system refactoring, optional cleanup, production hardening, deployment, cloud configuration, live provider calls, credentials, or real data.

## 12. Implementation steps

1. Confirm the worktree is clean and based on the pushed TASK-028 documentation baseline; record the frozen digest and provider-binding values before editing.
2. Reconcile the generator's review-definition source with the exact 14-candidate membership and frozen stable semantics.
3. Generate the single owned fixture JSON and keep review definitions excluded from canonical content and redacted-input digest projections.
4. Update fixture accessors and review assembly only as needed to consume the reconciled definitions without legacy-ID aliases or hard-coded UI behavior.
5. Represent D03 documented arrival and D04 reported worksite arrival as separate qualified timeline records while preserving their distinct evidence nature and date precision.
6. Reconcile ordinary replay and prepared-checkpoint construction, counts, seeded decisions, dependency targets, provenance, and expected hero transition with the exact candidate set.
7. Add focused unit regressions for membership, chronology, evidence nature, dependencies, lanes, blockers, hero transition, replay/checkpoint consistency, and digest/binding immutability.
8. Run only the exact Section 14 verification, inspect the owned-path diff, and prepare the handoff.

## 13. Acceptance criteria

- `candidateDefinitions` has length 14, exact set equality with Section 9, unique IDs, and no legacy candidate IDs.
- Review assembly and replay/checkpoint outputs contain the same exact candidate identities and valid single-run dependency ownership.
- The timeline exposes a documented D03 arrival on 2025-03-12 and a separate reported D04 worksite arrival around 2025-03-15 with correct source grounding and qualification.
- Every stable candidate preserves the specified evidence nature, item origin, support status, assertion mode, dependencies, and individual-review behavior.
- All six Nexus candidates, three review lanes, two early blockers, and the `CAND-TASK-0402` hero transition remain exact and deterministic.
- Ordinary replay and `DEMO-CHECKPOINT-REVIEW` validate with correct counts, fixture-reviewer attribution, labels, Purpose/masking state, selected-segment order, and no mixed-run references.
- Canonical fixture, approved-redacted-input, evaluation, and provider-binding digests remain unchanged.
- Generator check and all focused tests pass without changing an unowned path.

## 14. Verification commands

```text
node scripts/generate-synthetic-fixtures.mjs --check
npx vitest run tests/unit/fixtures tests/unit/review tests/unit/replay
npm run typecheck
```

All three commands must pass. Do not run live evaluation or weaken a frozen assertion to obtain a pass.

## 15. Manual checks

1. Confirm the diff contains only Section 6 paths and the generator did not modify an unowned artifact.
2. Compare candidate membership against Section 9 and confirm length 14, uniqueness, exact IDs, and no legacy aliases.
3. Inspect the two arrival records side by side and confirm distinct dates, evidence nature, source segments, and qualification.
4. Inspect all dependency targets, three lane definitions, both early blocker IDs, and the hero transition for exact frozen membership.
5. Load ordinary replay and `DEMO-CHECKPOINT-REVIEW`; confirm counts, one-run ownership, labels, fixture-reviewer attribution, pre-hero state, and withdrawal behavior.
6. Compare before/after canonical fixture, approved-redacted-input, evaluation-definition, and provider-binding digests and confirm byte-for-byte identity where artifacts are unowned.
7. Inspect the diff for credentials, private data, raw provider content, real-person data, legal conclusions, scores, or unsupported claims. None may be present.

## 16. Commit permission and message

- Do not commit unless the coordinator explicitly authorizes the implementation commit.
- Exact implementation commit message: `fix: reconcile canonical review fixture`

## 17. Handoff requirements

- Report `Task: TASK-028` and outcome as Complete, Partial, or Blocked.
- List every changed file and confirm each is within Section 6.
- Report exact candidate membership/count, distinct D03/D04 chronology, evidence/dependency preservation, lanes, blockers, hero transition, and replay/checkpoint consistency.
- Report before/after canonical fixture, approved-redacted-input, evaluation-definition, and provider-binding digest evidence.
- Report every Section 14 command and every Section 15 manual check.
- Identify any unrun check, blocker, assumption, or required coordinator follow-up.
- Include a commit SHA only if the coordinator authorized the exact Section 16 commit; otherwise report `Not committed`.

## 18. Stop conditions

Stop and report to the coordinator if:

- Any dependency is not integrated or the worktree is not based on the pushed documentation baseline.
- A correction requires a write outside Section 6, including contracts, source PDFs, evaluation definitions, provider bindings, package files, configuration, UI, TASK-020, documentation, or the task graph.
- The exact 14-candidate set or separate D03/D04 chronology cannot be represented without changing frozen contracts or adding a candidate.
- Any canonical fixture, approved-redacted-input, evaluation-definition, control-fixture, packet, or provider-binding digest changes.
- Replay/checkpoint consistency cannot be restored without changing stable labels, fixture-reviewer attribution, selected segment order, or the hero candidate.
- Existing user changes overlap an owned path and cannot be preserved safely.
- Verification exposes an unrelated failure that cannot be resolved inside the exclusive scope without broad refactoring or hardening.
