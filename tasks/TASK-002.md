# TASK-002: Shared TypeScript and Zod contracts

## 1. Task metadata

- Status: Pending
- Readiness rule: Only the coordinator may mark this task Ready after TASK-001 is integrated into the assigned base.
- Stage: foundation
- Wave: 2
- Risk: high
- Suggested branch: `task/002-shared-contracts`
- Depends on: TASK-001
- Graph outcome: Implement every frozen versioned enum, union, schema, identifier, provider contract, API contract, state contract, review contract, and export contract.

## 2. Goal

Provide one canonical TypeScript and strict Zod contract layer that represents every P0 shared value and boundary in `docs/CONTRACTS.md` without changing its meaning.

## 3. Why this task exists

Every fixture, provider adapter, route, reducer, review rule, export, and test must exchange the same names and shapes. A single tested contract package prevents parallel worktrees from inventing local enums, weakening strict boundaries, confusing stateless execution with browser-owned run history, merging provider runs, or representing prohibited legal decisions.

## 4. Dependencies and base requirement

- TASK-001 must be integrated into the coordinator branch and present in this worktree base.
- The exact pinned `zod@4.4.3` dependency and the shared Vitest contract-test setup must already be installed.
- `docs/CONTRACTS.md` version `1.0.0` is the frozen contract authority. If its draft correction status changes, the coordinator must integrate the complete approved correction before this task starts.
- No fixture implementation, provider adapter, route, reducer, UI, or export renderer is required for this task.

## 5. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-002.md` in full.
3. `PLANS.md` in full.
4. The `TASK-002` entry in `TASK_GRAPH.yaml`.
5. `docs/CONTEXT_INDEX.md` in full.
6. `docs/CONTRACTS.md` in full, including every table, code block, invariant, and acceptance item.
7. `docs/SAFETY_AND_DATA.md` in full.
8. `docs/ARCHITECTURE.md` Sections 7 through 9.
9. `docs/TESTING_AND_EVALUATION.md` Sections 7 and 8.
10. `docs/DEMO_AND_FIXTURES.md` Sections 4, 6 through 11, and 14 through 16 for representable stable IDs, replay, checkpoint, provider, and evaluation values.
11. `decision-log.md` decisions DEC-003 through DEC-010, DEC-012 through DEC-029, and DEC-034 through DEC-043.
12. The integrated TASK-001 package and test configuration, the current contents of every owned path, and the current Git status.

## 6. Exclusive write scope

- `lib/contracts/`
- `tests/contracts/shared/`

## 7. Read-only context allowed

- `package.json`
- `package-lock.json`
- `vitest.config.ts`
- `tests/setup/`
- `fixtures/`
- `lib/` outside `lib/contracts/`
- `app/`
- `features/`
- All coordinator-owned documentation and task packets

Read-only code may be inspected to follow export style and module resolution. Do not migrate an existing local type outside the owned scope in this task.

## 8. Out of scope

- Implementing business rules, provider calls, route orchestration, fixture content, document extraction, masking, citation matching, review transitions, persistence, export generation, or UI.
- Editing package files, test configuration, framework configuration, authoritative documentation, task packets, or the task graph.
- Adding convenience aliases that change a frozen enum, optionality, discriminator, field meaning, version, provider order, or failure classification.
- Adding scores, model-selected support or review status, bulk approval, automatic fallback, or cross-run output merging.
- Generating credentials, environment values, provider account data, fixture digests, or timestamps that belong to later tasks.

## 9. Frozen contracts and invariants

- Implement `ContractVersions` with every frozen `1.0.0` version exactly as documented.
- Every persisted or exported root carries `schemaVersion`. Unknown major versions fail closed. Serialized JSON never contains `undefined`; semantic unknown uses the defined enum or `null`.
- Timestamps are ISO 8601 UTC, date-only evidence remains `YYYY-MM-DD`, and character ranges are inclusive start and exclusive end.
- All identifier formats in Section 3 are validated. Fixture IDs remain data, not business-logic constants.
- Preserve exact enum spellings for evidence nature, item origin, support status, review status, review lane, stage status, case status, provider IDs, release configuration IDs, failure classifications, recovery actions, review actions, blocker codes, and every other documented union.
- Evidence nature, item origin, support status, and review status remain distinct fields. Human acceptance never changes origin or evidence nature. Unknown never means false, absent, negative, omitted, or empty success.
- No contract accepts a victim, trafficking, credibility, guilt, legal eligibility, non-punishment, case priority, case-strength, dangerousness, overall-risk, or legal-outcome score.
- Provider order is OpenAI `1`, Google Gemini `2`, Mistral `3`, and local replay `4`. This is display order only.
- Preserve the exact provider-release bindings: `openai-quality-v1` with `gpt-5.6-sol`, `gemini-quality-v1` with `gemini-3.5-flash`, `mistral-small-free-v1` with `mistral-small-2603` and medium reasoning effort, and `prepared-replay-v1` with local deterministic replay.
- Every provider registry entry allows exactly one `bundled_synthetic`, `CFN-DEMO-001`, fixture `1.0.0` binding with a canonical digest. The three live registry branches require typed static admission; the replay branch has no live-provider admission and reports evaluation as not applicable. Mistral remains unselectable until its exact release has matching passed reviewed static admission and coordinator-recorded deployed-account availability whose `available` state has a non-empty safe evidence ID and valid ISO 8601 verification time. Mistral permits only `not_verified`, `available`, or `unavailable`; OpenAI and Gemini require `not_required`. Every null-evidence availability state has null evidence fields.
- Live provider option projections require `mode: live` and provider transmission. The local replay projection requires `mode: deterministic_replay` and `providerTransmission: false`; these states cannot be interchanged by a broad union field.
- Provider and disclosure projections expose no keys, endpoints, raw environment values, internal errors, account data, or provider bodies.
- `AnalyzeRequest` is narrower than browser state and has no `recoveryOfRunId`. Strict schemas reject extra root fields, raw file or raw-text fields, direct identifiers, unexpected URLs, structural tool fields, free-text purpose fields, unknown values, and wrong types.
- The stateless API returns a terminal `LiveAnalysisExecutionResult` inside `AnalyzeResponse` without `AnalysisRecoveryMetadata`. Only the browser reducer may promote that execution into an `AnalysisRun` by attaching locally validated recovery metadata.
- A preflight rejection has `outcome: rejected_before_run`, `run: null`, and no candidates or citations. A started failed run has no partial candidates or citations.
- `CaseState` includes `pendingLiveAnalysis` for the in-memory request lifecycle. The narrower session-persistence projection excludes it.
- The frozen live lifecycle commands are `start_live_analysis(request, recoveryOfRunId local)`, `complete_live_analysis(startCommandId, succeeded response)`, `fail_live_analysis(startCommandId, failed response)`, `reject_live_analysis_preflight(startCommandId, rejected response)`, and `record_live_analysis_transport_failure(startCommandId, reasonCode)`. `run_deterministic_replay` accepts a `ReplayRequest` naming only trusted bundle ID `REPLAY-CFN-DEMO-001-V1`, and `load_demo_checkpoint` accepts only trusted checkpoint ID `DEMO-CHECKPOINT-REVIEW`. Neither command accepts a browser-supplied bundle object.
- The reducer validates any local `recoveryOfRunId` against the current preserved failed run and its permitted recovery class. It derives `selectionReason` as `initial_choice`, `retry_same_provider`, `explicit_provider_switch`, or `explicit_deterministic_replay`, fixes `selectedBy` to `practitioner`, and fixes `automaticFailover` and `outputsMerged` to `false` before attaching `AnalysisRecoveryMetadata`.
- Starting live analysis does not increment `caseRevision`, and unrelated material commands are blocked while a request is pending. Successful completion and started failure atomically append and activate separate runs. Preflight rejection and client transport failure create no run and preserve the active run. A transport failure records unknown remote outcome and no accepted output. Live retry, provider switch, and replay selection are explicit, never automatic, preserve verified failed runs, and never merge outputs.
- `SystemCard.attemptedRuns` contains only real `AnalysisRun` projections. `SystemCard.nonRunAttempts` contains the strict `NonRunAnalysisAttempt` union: preflight is not transmitted and not started, transport has unknown transmission and remote execution, both have `outputAccepted: false`, and neither has a run ID.
- `PersistedCaseState` is the sole strict session root. It contains safe derived state and selected segment IDs but no `SourceSegment`, raw text, PDF bytes, prompt, provider body, key, cookie, blob, or pending request. Restore validates it against the trusted fixture and rehydrates read-only segments rather than trusting persisted source content.
- Replay and `DEMO-CHECKPOINT-REVIEW` preserve exact version, label, no-transmission, and fixture-reviewer provenance fields.
- `CitationResolutionDecision`, `citationResolutions`, the `resolve_citation` command, and the `citation_manually_resolved` audit event are canonical contracts. Manual resolution is append-only, remains scoped to the active successful run, recalculates support, and never auto-accepts review.
- `CaseCandidate` is the strict discriminated union of `TimelineEvent`, `NexusRow`, `ContextGap`, and `OtherCandidate`. `CaseState.candidates: CaseCandidate[]` is the only stored candidate collection; timeline, Nexus, context-gap, lane, queue, and blocker views are derived read-only selectors, not parallel persisted arrays. A Nexus row has no second ID: its `NEXUS-*` `CandidateItem.id` is also the review, selector, export, and `NexusDependency.nexusCandidateId` target.
- `ReplayBundle` and `DemoCheckpointBundle` contain exactly one successful local replay run with `quarantinedCount: 0` and only that run's `CaseCandidate[]` and `Citation[]`. They bind the ordered selected segment IDs and exact approved-redacted-input digest. Ordinary replay has no seeded decisions. The checkpoint also contains trusted complete purpose, exact fixture projections, approved fixture-reviewer masking, coverage, completed processing, ordered fixture-reviewer decisions, exact counts, and one-run ownership.
- The checkpoint outcome hash uses projection version `1.0.0`, a strict lowercase 64-character SHA-256 value, and the canonical sorted outcome projection from `docs/CONTRACTS.md`. It binds each dependency's stable target and source evidence nature plus each citation's stable source, quote, range, bounding-box, and resolver fields. Dynamic run IDs, case revision, activation or review times, and audit identifiers, sequences, and timestamps are excluded.
- Evaluation definitions and results are strict discriminated unions. Genuine live model evidence, deterministic controls, replay evidence, and not-run evidence cannot impersonate one another. Passed live admission requires each model-output variant's three real transmitted live runs plus every exact deterministic-control scenario declared by the frozen definition set.
- Safe error and non-run records use correlated live provider-release pairs. Preflight codes form a positive allowlist, and server-generated quarantine records never copy the provider-owned `proposedId`.
- Source-supported positive candidates require exact or manually resolved citations. The model cannot set final support, review, audit, export, or legal status.
- UI and local callers submit only narrow `ReviewIntent` values. The central policy and reducer derive immutable `ReviewDecision` fields from canonical state. `withdraw_candidate` is the sole withdrawal input, and `ReviewIntent` or `review_candidate` cannot express `withdraw`.
- Review is individual. No bulk accept command or contract exists. Insufficient-evidence positive claims can be accepted only as an explicit limitation or gap.
- Dependency graphs reject cycles. Evidence withdrawal affects only reachable downstream decisions and revokes export readiness.
- The six golden Nexus IDs and their review requirements are representable without an overall score.
- `ExportManifest` is purpose-bound, redacted, reviewed, single-run, and shared by PDF and JSON. It contains the four exact required labels and has no blocker override.
- Guidance cannot become case evidence or an unverified domestic legal conclusion.
- `CaseState` excludes raw PDF bytes, prompts, provider bodies, API keys, and generated PDF blobs. Active outputs belong to exactly one active successful run.
- Every P0 provider request is non-streaming and cannot assemble partial streamed output.

## 10. Implementation steps

1. Inspect Git status, the integrated contract test setup, and every current file in the owned paths.
2. Create a clear canonical module structure under `lib/contracts/` with one public export surface and no circular dependency.
3. Implement all documented primitive enums, identifiers, version literals, records, discriminated unions, provider and disclosure contracts, stateless analysis request and response contracts, pending live-analysis state, safe errors, citation-resolution decisions, processing and audit contracts, the `CaseCandidate` union and single canonical candidate collection, narrow review intents, derived review decisions, dependency contracts, export contracts, guidance and evaluation contracts, commands, and root case state.
4. Pair boundary-facing TypeScript types with strict Zod schemas. Infer types from schemas where that prevents drift, while preserving documented generic or conditional relationships where TypeScript adds meaningful guarantees.
5. Add reusable validators for identifiers, ISO UTC timestamps, date-only values, finite ranges, strict objects, version roots, and canonical serialization requirements without implementing later business engines.
6. Add focused contract tests for valid round trips, every exact enum spelling, strict unknown-field rejection, rejection of `recoveryOfRunId` in `AnalyzeRequest`, correlated provider-release pairs, positive preflight-only error codes, server-generated quarantine identifiers, `CaseCandidate` discriminated-union exclusivity, one canonical Nexus identity, rejection of parallel candidate arrays, narrow `ReviewIntent` payloads, rejection of client-authored `ReviewDecision` fields and review-intent withdrawal, run-only `attemptedRuns`, typed `nonRunAttempts`, terminal live-result shapes without recovery metadata, all five live lifecycle commands, transport-failure reasons, pending-state shapes, citation-resolution records, version failure, unknown handling, provider bindings and order, strict deployed-account evidence states, strict versioned evaluation definitions and evidence branches, ID-only replay and checkpoint commands, trusted bundle selected-segment and redacted-input digest shapes, single-run and zero-quarantine shapes, checkpoint prerequisite and ordered-decision shapes, dependency and citation-complete post-decision hash projection and format, single-run response shapes, and prohibited score rejection.
7. Cover the schema-level portions of the API-BAD malformed-input matrix and the cross-contract invariants that can be established at the contract boundary.
8. Run both graph verification commands and inspect the final diff for local duplicate contracts, unowned changes, secrets, relaxed schemas, and undocumented fields.

## 11. Acceptance criteria

- Every type, enum, identifier, root, union, and cross-contract relationship defined in `docs/CONTRACTS.md` has one canonical exported representation in `lib/contracts/`.
- Boundary-facing schemas are strict and reject unknown fields instead of stripping or accepting them silently.
- TypeScript types and parsed Zod output agree for all tested valid fixtures and discriminated unions.
- All `1.0.0` roots, provider bindings, provider order values, replay and checkpoint labels, safe error codes, recovery order values, Nexus IDs, blocker codes, export labels, and evaluation states match the document exactly.
- Invalid identifiers, timestamps, date-only values, ranges, versions, enum values, wrong JSON types, impossible discriminators, and `undefined` serialization fail in focused tests.
- An analysis failure cannot contain partial candidates or citations, and a preflight rejection cannot contain a fabricated run.
- `AnalyzeRequest` cannot contain recovery linkage, while `LiveAnalysisExecutionResult` contains no recovery metadata and `AnalysisRun` requires locally attached `AnalysisRecoveryMetadata`.
- `CaseState` represents one optional `pendingLiveAnalysis`, and the session-persistence contract excludes that pending request.
- All five live lifecycle commands, `run_deterministic_replay`, `load_demo_checkpoint`, and `resolve_citation` preserve their exact discriminators and payload ownership.
- Replay and checkpoint command schemas accept only their frozen trusted IDs. Bundle schemas represent one successful local run with zero quarantined output, exact selected segments, approved-redacted-input digest, counts and run ownership, and no arbitrary browser artifact. The checkpoint prerequisite state, fixture-reviewer decisions, dependency and citation-complete projection, projection version, and lowercase SHA-256 outcome hash are strict and versioned.
- `CitationResolutionDecision`, `citationResolutions`, and `citation_manually_resolved` are representable without allowing a component or model to set citation validity, support, or review acceptance directly.
- `CaseCandidate` rejects impossible branch combinations, and `CaseState` plus its persistence projection expose exactly one canonical candidate collection with no mirrored timeline, Nexus, context-gap, lane, queue, or blocker arrays.
- `ReviewIntent` exposes only practitioner-entered action inputs. Client-authored immutable `ReviewDecision` fields and `withdraw` through `review_candidate` are unrepresentable, while `withdraw_candidate` remains the sole typed withdrawal input.
- System-card contracts keep verified runs and non-run attempts structurally separate. Preflight and transport records cannot fabricate a run ID or accepted output, and their transmission and remote-execution states remain exact.
- An unavailable or unevaluated Mistral release is representable without weakening its exact model, unpaid tier, fixture binding, retention setting, medium reasoning setting, or evidence-required `available` state.
- A strict evaluation definition binds each of the 14 variant IDs to its split, checks, gates, execution requirement, repetitions, and deterministic-control scenarios. Mock, deterministic, replay, mixed, non-transmitted, duplicate-run, and not-run records cannot validate as genuine live model evidence.
- No schema accepts browser-supplied model names, endpoints, API keys, provider bodies, raw document content, tool instructions, prohibited scores, automatic fallback, bulk approval, or cross-run merged output.
- Candidate, timeline, Nexus, context-gap, review, dependency-change, export-gate, export-manifest, guidance, evaluation, command, and case-state contracts preserve all documented required fields and conditional rules.
- API, provider, replay, review, export, and state unions serialize deterministically with explicit `null` or unknown values where defined and never `undefined`.
- All shared contract tests and TypeScript checking pass with no changes outside Section 6.

## 12. Verification commands

```text
npm run typecheck
npx vitest run tests/contracts/shared
```

## 13. Manual checks

1. Compare the public exports against every heading in `docs/CONTRACTS.md`; confirm no documented contract is missing and no competing spelling exists.
2. Inspect the analysis request schema and verify there is no raw text, raw file, free-text purpose, endpoint, API key, user-selected model name, tool field, or `recoveryOfRunId`.
3. Inspect provider projections and safe errors and verify they cannot expose credentials, raw environment values, internal endpoints, provider bodies, prompts, quotes, or stack traces.
4. Inspect the provider and recovery unions and confirm OpenAI, Gemini, Mistral, and replay retain order `1`, `2`, `3`, and `4`, while same-provider retry is recovery order `0` and Return to Purpose is `5`.
5. Inspect candidate, review, dependency, and export contracts and confirm `CaseCandidate` is discriminated, `CaseState.candidates` is the only stored candidate collection, selectors are read-only projections, `ReviewIntent` is narrow, `withdraw_candidate` is the only withdrawal input, and there is no bulk action, legal decision, confidence value, overall score, critical override, or cross-run merge field.
6. Parse one valid root from each persisted or exported family and deliberately try an unknown major version, extra root field, `undefined` semantic value, and prohibited score. Each invalid case must fail closed.
7. Inspect the live lifecycle and system-card contracts and confirm a pending start is local and revision-stable, unrelated material commands are blocked, terminal responses carry no recovery metadata, preflight and transport failure create no run, `attemptedRuns` remains run-only, `nonRunAttempts` uses exact safe states and no run ID, replay is local, and `pendingLiveAnalysis` is excluded from the persistence projection.
8. Inspect replay and checkpoint contracts. Confirm commands accept only fixed trusted IDs, each bundle contains one successful local run with zero quarantined output and single-run records, checkpoint prerequisites and fixture-reviewer decisions are complete, and the versioned post-decision hash projection excludes dynamic activation fields while requiring canonical lowercase SHA-256.
9. Inspect `resolve_citation`, `CitationResolutionDecision`, `citationResolutions`, and `citation_manually_resolved`; confirm the selected range is typed and no field can auto-accept review.
10. Review the final Git diff and confirm every changed path is in Section 6 and no runtime behavior, fixture content, provider call, or documentation changed.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Message: `feat: add shared TypeScript and Zod contracts`

## 15. Handoff requirements

- Report Task ID `TASK-002` and outcome as Complete, Partial, or Blocked.
- List every changed file under `lib/contracts/` and `tests/contracts/shared/`.
- Summarize the public contract export surface and the strict-boundary behavior added.
- Name the provider, safety, review, dependency, stateless-live-lifecycle, local-recovery, citation-resolution, replay, and single-run invariants preserved.
- Report both Section 12 commands with pass or fail status and list any test not run.
- Report any missing, ambiguous, or conflicting contract as a coordinator blocker. Do not resolve it silently.
- Confirm that no unowned file, package, fixture, provider setting, environment value, or secret changed.
- Include a commit hash only when the opening coordinator prompt authorized the commit; otherwise state `Not committed`.

## 16. Stop conditions

- Stop if TASK-001 is not integrated, `zod@4.4.3` or shared test tooling is unavailable, or another active task owns a path in Section 6.
- Stop if `docs/CONTRACTS.md` conflicts with `docs/SAFETY_AND_DATA.md`, another higher-authority document, the task graph, or this packet. Report exact passages.
- Stop if a required contract is ambiguous or would require changing a frozen name, version, discriminator, provider binding, fixture ID, review rule, export rule, or safety invariant.
- Stop if implementation requires a file outside Section 6, a new dependency, package or test configuration change, fixture change, provider change, prompt change, route change, architecture change, or cloud change.
- Stop if a schema would need to accept raw case content, secrets, a browser-supplied replay or checkpoint bundle, automatic provider fallback, replay substitution, cross-run merging, bulk approval, a critical export override, or a prohibited decision or score.
- Stop if a stateless API contract would need to receive recovery linkage, return recovery metadata, mutate case history, or persist `pendingLiveAnalysis`.
- Stop if citation resolution would let a component choose a non-allowlisted range, bypass the pure resolver, overwrite decision history, or auto-accept review.
- Stop if a test fails because the authoritative contract and the expected behavior disagree. Do not weaken the assertion or silently alter the meaning.
- Stop before any destructive command, global install, live provider call, credential use, deployment, billing, quota, or production-setting action.
