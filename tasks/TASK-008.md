# TASK-008: Review policy and dependency engine

## 1. Task metadata

- Status: Pending
- Readiness rule: Only the coordinator may mark this task Ready after TASK-001, TASK-002, and TASK-003 are integrated into the assigned base.
- Stage: domain
- Wave: 4
- Risk: high
- Suggested branch: `task/008-review-engine`
- Depends on: TASK-001, TASK-002, TASK-003
- Graph outcome: Implement candidate assembly, qualified timeline and Nexus records, individual review actions, context gaps, cycle rejection, downstream invalidation, and the complete hero transition.

## 2. Goal

Create a deterministic review and dependency engine that assembles qualified records, enforces individual human decisions, preserves unknowns and provenance, rejects cycles, and reproduces the exact `CAND-TASK-0402` withdrawal transition.

## 3. Why this task exists

Meaningful human control must be observable in system behavior, not just stated in copy. This engine ensures that unsupported positive claims cannot be accepted, changed evidence reopens only affected work, unrelated decisions remain intact, and export readiness is revoked until renewed review.

## 4. Dependencies and base requirement

- TASK-001, TASK-002, and TASK-003 must be integrated into the coordinator branch and present in this worktree base.
- Canonical candidate, timeline, Nexus, context-gap, review-decision, dependency, coverage, citation-status, support-status, review-status, and change contracts must be importable from `lib/contracts`.
- The full `CFN-DEMO-001` stable candidate, timeline, Nexus, review-lane, dependency, early-blocker, and hero-transition definitions must be available from TASK-003.
- TASK-007 is not a graph dependency. This engine consumes citation validation states through shared contracts and test records; it must not assume unintegrated citation code.
- Export gate and case reducer integration are later tasks. This task returns deterministic review and dependency results without editing global case state or creating exports.
- No provider call, model evaluation, UI, credential, cloud setting, or real case material is required.

## 5. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-008.md` in full.
3. `PLANS.md` in full.
4. The `TASK-008` entry in `TASK_GRAPH.yaml`.
5. `docs/CONTEXT_INDEX.md` in full.
6. `docs/SAFETY_AND_DATA.md` in full.
7. `docs/CONTRACTS.md` Sections 9 through 15 and 26.
8. `docs/DEMO_AND_FIXTURES.md` Sections 8 through 11 and 14 through 16.
9. `docs/PRODUCT_SPEC.md` Sections 6 and 7.6 through 7.12.
10. `docs/ARCHITECTURE.md` Sections 8.5 and 8.6.
11. `docs/DESIGN_SYSTEM.md` Sections 9.6 through 9.13 and 11.
12. `docs/TESTING_AND_EVALUATION.md` Sections 8.4 and 8.5.
13. `decision-log.md` decisions DEC-003, DEC-005 through DEC-009, DEC-015, DEC-024 through DEC-026, DEC-038, and DEC-041.
14. The integrated shared contracts and canonical fixture definitions, every current owned file, and the current Git status.

## 6. Exclusive write scope

- `lib/review/`
- `tests/unit/review/`

## 7. Read-only context allowed

- `lib/contracts/`
- `lib/fixtures/`
- `fixtures/cases/`
- `fixtures/evals/definitions/`
- `lib/citations/`
- `lib/documents/`
- `lib/state/`
- `lib/export/`
- `features/review/`
- `package.json`
- `vitest.config.ts`
- `tests/setup/`
- All coordinator-owned documentation and task packets

Downstream and unintegrated modules are reference only. Do not edit them or turn them into a hidden dependency.

## 8. Out of scope

- Model prompting, provider output parsing, citation matching, PDF extraction, masking, case reducer integration, audit persistence, session storage, export gate implementation, export manifest creation, UI, or route behavior.
- Bulk review, automatic acceptance, hidden approval defaults, legal decision-making, confidence scoring, victim or trafficking status, guilt, credibility, eligibility, non-punishment outcome, priority, dangerousness, or overall risk.
- Changing stable candidate or Nexus IDs, fixture dependencies, expected actions, early blockers, the hero transition, review enums, support enums, or shared contracts.
- Treating international guidance as case evidence or domestic law, contacting an external service, or making cooperation affect analysis.
- Editing fixtures, package files, tool configuration, authoritative documents, provider settings, prompts, environment values, or cloud settings.

## 9. Frozen contracts and invariants

- Candidate assembly consumes validated sources, citations, coverage, and fixture definitions. Deterministic code, not a model, derives final support, review requirement, dependencies, timeline qualification, Nexus records, and context gaps.
- Assembly returns one `CaseCandidate[]` collection. Timeline, Nexus, context-gap, lane, review-completion, queue, and blocker results are pure read-only selectors over that collection; the engine never creates or mutates mirrored candidate arrays.
- Stable fixture IDs remain in fixture data. General review logic must not special-case golden IDs except through supplied fixture definitions and explicit golden tests.
- Preserve evidence nature on each source dependency and item origin, support status, and review status on each item as separate dimensions. Human actions never rewrite evidence nature or original item origin.
- Every consequential item starts `pending`. There is no bulk accept action, reducer shortcut, or API.
- `human_accepted` and `human_edited` require all required source citations to be exact or manually resolved, no open consequential coverage issue in the dependency closure, and `prohibitedConclusionCheck: passed`.
- A positive proposition with `insufficient_evidence` cannot be accepted. After dependency invalidation it may be completed only through `accept_as_limitation`, which requires explicit practitioner limitation text, changes `assertionMode` to `limitation`, sets `currentTextOrigin` to `human_created`, and results in `human_edited` rather than a positive finding.
- `confirm_unknown` applies only to `unknown_state`. Unknown remains distinct from false, absent, negative, empty, or inferred.
- Edit preserves immutable `proposedText` and `itemOrigin`, changes `currentText`, sets `currentTextOrigin` to `human_created`, and requires a reason. Source-free human text is reviewer-supplied context or interpretation and cannot independently become exact-source supported.
- Edit, reject, mark uncertain, and accept as limitation intents require a non-empty reason. Accept as limitation also requires non-empty explicit limitation text. Accept and confirm unknown may use `null`. The separate `withdraw_candidate` command requires a non-empty reason.
- Components and callers submit only narrow `ReviewIntent` values for accept, edit, reject, mark uncertain, confirm unknown, and accept as limitation. The central policy loads the canonical candidate and derives every immutable `ReviewDecision` field.
- Withdrawal is not a `ReviewIntent` action. It enters only through the separate `withdraw_candidate` command, whose central transition derives the withdrawal decision and dependency change.
- Prior decisions are retained while the same active successful run remains current. A later action references `supersedesDecisionId` and preserves actor, role, run, candidate revision, prompt, ruleset, dependency snapshot, and time. TASK-010 clears the current review ledger when a new run replaces the active run, while preserving safe audit and export history.
- A withdrawn candidate becomes `inclusionStatus: withdrawn` and `reviewStatus: invalidated`. It is a resolved exclusion, not permanently incomplete review.
- Only active candidates with `reviewRequirement: individual` block review completion. Derived summaries do not create duplicate approval.
- Timeline dates preserve day, range, approximate, conflicting, and unknown precision. Sorting never resolves a conflict or turns an allegation into guilt.
- Create exactly six Nexus rows from fixture definitions: `NEXUS-RECRUITMENT`, `NEXUS-MOVEMENT`, `NEXUS-CONTROL`, `NEXUS-COMPELLED-TASKS`, `NEXUS-OFFENCE-TIMING`, and `NEXUS-URGENCY`.
- Each `NEXUS-*` value is that row's sole `CandidateItem.id`. Review, selectors, exports, and `NexusDependency.nexusCandidateId` use the same value. No independent `nexusId` or mapping exists.
- `NEXUS-CONTROL` and `NEXUS-URGENCY` are `derived_summary`. `NEXUS-COMPELLED-TASKS` and `NEXUS-OFFENCE-TIMING` require individual review. Recruitment and movement use the fixture-specified requirements without duplicate child approval.
- Derived summaries reject every direct review intent and create no `ReviewDecision`. Their review status, support, export eligibility, current text, relationship summary, dependencies, and required or child ID lists are deterministically rebuilt from sorted upstream state: invalidated outranks pending; pending outranks rejected, uncertain, withdrawn, or insufficient support; all exact accepted upstream rows derive accepted exact support; reviewed partial or edited upstream rows derive human-edited partial support; conflicting upstream support derives uncertain. Tests must cover every branch and confirm an upstream material change invalidates the summary before recalculation.
- The Nexus has no overall score, probability, victim-status conclusion, causal legal conclusion, or traffic-light rating.
- Context gaps permit answered, preserved unknown, deferred, and outside-scope outcomes. `answered` requires reviewer-supplied text; deferred or outside-scope requires an explanation; preserved unknown has neither. The command cannot set `unanswered`, which is initial-only. No gap answer is mandatory, and an unanswered or preserved gap never becomes adverse evidence.
- Keep the three lanes separate: `trafficking_indicators`, `non_punishment_relevance`, and `protection_remedy_urgency`. Shared evidence never merges candidate identity or approval.
- Cooperation Yes, No, or Unknown cannot alter evidence, Nexus, or protection outputs.
- Dependency graphs reject self-dependencies and all cycles before mutation. Recalculation traverses only reachable downstream active edges.
- Removing evidence never strengthens a dependent support status. Affected accepted or edited items become invalidated, unaffected decisions remain unchanged, and `exportReadinessRevoked` is true.
- The exact `CAND-TASK-0402` transition table is normative. Withdrawing it invalidates only `NEXUS-COMPELLED-TASKS` and `NEXUS-OFFENCE-TIMING` among affected reviewed Nexus items, leaves unrelated decisions unchanged, and requires renewed individual review.
- After withdrawal, `NEXUS-COMPELLED-TASKS` remains partially supported and can be accepted after renewed review. `NEXUS-OFFENCE-TIMING` becomes insufficient evidence and can be accepted only as a limitation, never as a positive link.
- The final reviewed state must not state that the 2025-04-02 alleged communication is linked to an assigned task.

## 10. Implementation steps

1. Inspect Git status, integrated contracts and fixture definitions, current owned files, and test setup.
2. Implement pure candidate assembly that returns one `CaseCandidate[]`, preserves original proposal text and provenance, and derives safe support, review requirement, dependencies, coverage relationships, unknowns, and prohibited-conclusion eligibility from validated inputs.
3. Implement qualified timeline, six-row Nexus, three-lane, context-gap, review-completion, queue, and blocker selectors over the canonical collection without embedding golden IDs in generic algorithms or writing parallel arrays.
4. Implement a central review transition policy that accepts narrow `ReviewIntent` for accept, edit, reject, mark uncertain, confirm unknown, and accept as limitation, then derives the complete immutable `ReviewDecision`. Implement withdrawal only through the separate `withdraw_candidate` transition, including its reason, derived decision, dependency snapshot, and invalid-transition errors.
5. Implement directed dependency graph construction, missing-node validation, self-edge and cycle rejection, deterministic downstream traversal, support weakening, preserved-node reporting, and export-readiness revocation.
6. Implement context-gap response rules and review-completion selectors that consider only active individual items and preserve unknown, deferred, and outside-scope states.
7. Add decision-table tests for every review action and invalid action, discriminated-intent validation including blank or unchanged edit rejection and non-edit `editedText` rejection, rejection of client-authored decision fields, rejection of withdrawal through `ReviewIntent`, the sole `withdraw_candidate` path, coverage and citation gates, source-free edits, derived summaries, canonical Nexus identity and dependency targeting, three-lane separation, timeline qualifications, selector consistency, absence of mirrored arrays, cycle cases, reachability, no-strengthening, and cooperation invariance.
8. Add the full golden initial state, early unresolved list, Step 0 through Step 3 `CAND-TASK-0402` transition, renewed Nexus review, unrelated-decision preservation, and final limitation assertions.
9. Run the graph verification commands and inspect the final diff for unowned files, hard-coded generic fixture logic, hidden bulk behavior, prohibited conclusions, provider or export behavior, and weakened tests.

## 11. Acceptance criteria

- Candidate assembly preserves original wording, stable provenance dimensions, valid dependencies, related coverage, unknowns, and individual review requirements without allowing a model to set final status.
- Assembly returns a valid `CaseCandidate` discriminated union in one canonical collection. Timeline, Nexus, context-gap, lane, queue, blocker, and review-completion selectors remain read-only, reflect the same revisions, and create no mutable or persisted mirrors.
- Timeline records keep documented, reported, alleged, approximate, conflicting, range, and unknown qualifications and never infer guilt or resolve conflicting dates through sorting.
- Fixture-driven assembly produces exactly the six frozen Nexus rows using each frozen `NEXUS-*` value as its sole candidate identity, exact required dependencies targeting those same IDs, exact initial support and review states, and no score or legal conclusion.
- The three review lanes remain separate and cooperation-value changes produce deeply equal evidence, Nexus, and protection outputs excluding cooperation metadata.
- Every consequential individual item begins pending. There is no bulk action or hidden acceptance path.
- Accept and edit are blocked by invalid citations, consequential open coverage, failed prohibited-conclusion check, or an insufficient-evidence positive proposition.
- Confirm unknown and accept as limitation work only for their permitted assertion modes. Edit, reject, uncertain, and limitation intents require applicable reasons, while central policy derives all immutable decision fields and preserves prior active-run decisions through supersession.
- `withdraw_candidate` is the only accepted withdrawal input, requires a reason, and derives its decision and downstream effects centrally. A `ReviewIntent` or `review_candidate` withdrawal attempt fails before mutation.
- Source-free human edits remain reviewer-authored and never become exact-source supported by themselves.
- Unanswered, deferred, outside-scope, and preserved-unknown context gaps remain visible and do not block every workflow or become negative evidence.
- Self-dependencies, missing dependency nodes, direct cycles, and indirect cycles are rejected before state mutation.
- A dependency change recalculates only reachable downstream items, never strengthens support, invalidates affected reviewed items, lists preserved candidates, and returns `exportReadinessRevoked: true`.
- The golden Step 0 state is blocked by pending review; Step 1 reaches review completion after all required individual actions; Step 2 withdrawal produces the exact documented affected states; Step 3 reaches review completion only after both affected Nexus items are reviewed again.
- At Step 2, CAND-TASK-0402 is invalidated and withdrawn, NEXUS-COMPELLED-TASKS is partially supported and invalidated, NEXUS-OFFENCE-TIMING is insufficient evidence and invalidated, and unrelated decisions remain byte-for-byte unchanged.
- At Step 3, NEXUS-COMPELLED-TASKS is human accepted after renewed review and NEXUS-OFFENCE-TIMING is human edited only as the exact insufficient-evidence limitation in the fixture. The positive 2025-04-02 assignment link is absent.
- Focused review tests and TypeScript checking pass with no changes outside Section 6.

## 12. Verification commands

```text
npx vitest run tests/unit/review
npm run typecheck
```

## 13. Manual checks

1. Assemble the golden fixture and inspect the one canonical candidate collection plus derived timeline, three lanes, context gaps, and six Nexus rows. Confirm exact union branches, qualifications, dependencies, initial statuses, no mirrored arrays, and no overall score or legal conclusion.
2. Try accepting CAND-CTRL-CONFINEMENT as a positive finding. Confirm insufficient evidence blocks acceptance and permits only reject, uncertain, or an applicable limitation path.
3. Edit CAND-CTRL-PASSPORT to `Maya reported passport removal; recruiter messages separately refer to passport custody.` Confirm original wording remains, reason is required, and reported and documented evidence natures remain separate.
4. Confirm CAND-URG-INTERPRETER and CAND-META-COOPERATION as unknown. Confirm unknown remains explicit and does not become a positive or negative fact.
5. Before initial review completion, inspect unresolved individual items. Confirm CAND-SENDER-0402 and CAND-URG-INTERPRETER are the exact named early unresolved blockers from the fixture definition.
6. Attempt withdrawal through `ReviewIntent` and confirm it fails before mutation. Then complete the initial required decisions, accept CAND-TASK-0402, and withdraw it only through `withdraw_candidate` with a reason. Confirm the exact Step 2 states and that unrelated review decisions are unchanged.
7. Renew review of NEXUS-COMPELLED-TASKS and record NEXUS-OFFENCE-TIMING as an insufficient-evidence limitation. Confirm the exact Step 3 states and no positive 2025-04-02 assignment link.
8. Build direct and indirect cycles and a self-edge. Confirm all are rejected before any candidate or decision mutates.
9. Run the cooperation Yes, No, and Unknown variants. Confirm evidence, Nexus, and protection outputs are equal apart from cooperation metadata.
10. Review the final Git diff and confirm every changed path is in Section 6 and no fixture, citation, contract, package, provider, export, reducer, component, route, or documentation file changed.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Message: `feat: add review dependency engine`

## 15. Handoff requirements

- Report Task ID `TASK-008` and outcome as Complete, Partial, or Blocked.
- List every changed review-engine and test file.
- Summarize candidate, timeline, Nexus, lane, gap, review-transition, graph, invalidation, and review-completion behavior.
- Report the exact Step 0 through Step 3 hero results and identify preserved unrelated decisions.
- Confirm the individual-review, no-bulk, no-score, unknown-preservation, evidence-separation, cycle-rejection, no-strengthening, cooperation-invariance, and export-revocation invariants.
- Report both Section 12 commands with pass or fail status and any manual check not completed.
- Report any fixture, citation-input, transition, dependency, coverage, or contract uncertainty as a blocker or follow-up.
- Confirm no unowned file, dependency, provider, fixture, environment value, cloud setting, or secret changed.
- Include a commit hash only when the opening coordinator prompt authorized the commit; otherwise state `Not committed`.

## 16. Stop conditions

- Stop if TASK-001, TASK-002, or TASK-003 is not integrated, canonical review fixture definitions or shared contracts are unavailable, or another active task owns a path in Section 6.
- Stop if completing the task requires any file outside Section 6, a new dependency, package or test configuration change, contract change, fixture or stable-ID change, citation change, provider change, export-gate change, reducer change, route change, or cloud change.
- Stop if an expected transition conflicts with the normative `CAND-TASK-0402` table, if a dependency closure is ambiguous, or if a fixture-defined review requirement is missing.
- Stop if a requested behavior requires bulk approval, automatic acceptance, deletion of prior decisions inside the same active run, strengthening after evidence removal, cross-lane merged approval, cooperation-based inference, or a prohibited legal or person-level score or conclusion. TASK-010 run replacement is the only approved path that clears the current review ledger while preserving safe audit and export history.
- Stop if integration requires fixing TASK-007, TASK-009, TASK-010, or another unowned module. Report the exact missing interface to the coordinator for a scope decision.
- Stop before any provider call, live evaluation, real-data test, credential use, external upload, destructive command, global install, billing, quota, deployment, or production-setting action.
- Stop on any safety, product, contract, fixture, architecture, design, or testing conflict and report exact passages to the coordinator.
