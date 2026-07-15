# TASK-010: Case reducer, audit, persistence, and replay

## 1. Task metadata

- Status: Pending until coordinator marks ready.
- Stage: domain.
- Wave: 7.
- Risk: high.
- Suggested branch: `task/010-case-state-replay`.
- Depends on: TASK-002, TASK-003, TASK-005, TASK-006, TASK-007, TASK-008, TASK-009.
- Graph outcome: Implement central commands, browser-owned live-analysis lifecycle and recovery linkage, citation-resolution persistence, revision and idempotency checks, explanatory audit history, narrow session storage, Reset Case cleanup, deterministic replay, and the prepared checkpoint.

## 2. Goal

Implement one typed case-state boundary that applies every local command centrally, owns the live-analysis lifecycle and recovery linkage, derives current status safely, preserves explanatory and citation-resolution history, persists only the approved synthetic projection, and loads version-matched replay or checkpoint data without mixing runs.

## 3. Why this task exists

Every case route needs one trustworthy source of current synthetic-demo state. Centralizing commands, pending live execution, locally validated recovery metadata, citation resolution, revisions, audit events, persistence, reset, replay, and active-run selection prevents UI components from bypassing review, dependency, freshness, or provider-provenance rules.

## 4. Dependencies and base requirement

- TASK-002 must be integrated so `CaseState`, `PendingLiveAnalysis`, `CaseCommand`, `LiveAnalysisExecutionResult`, `AnalysisRecoveryMetadata`, `CitationResolutionDecision`, `ReviewIntent`, `ReplayBundle`, `DemoCheckpointBundle`, `NonRunAnalysisAttempt`, audit, run, gate, export, and schema contracts are canonical.
- TASK-003 must be integrated so fixture `CFN-DEMO-001`, fixture version `1.0.0`, canonical digests, trusted replay and checkpoint seed definitions, evaluation definitions, and guidance records exist.
- TASK-005 through TASK-009 must be integrated so coverage, masking, citation, review, dependency, and export-gate transitions are consumed rather than recreated.
- Start from the coordinator branch after all listed dependencies are integrated. The opening coordinator prompt must identify the base revision. Stop if the dependency state or base revision is missing or inconsistent.
- Use only the installed dependency set and existing shared configuration. This task does not own packages, shared contracts, or framework setup.

## 5. Required context

Read these sources before editing, in this order:

- `AGENTS.md`: Full.
- `tasks/TASK-010.md`: Full.
- `PLANS.md`: Full.
- `TASK_GRAPH.yaml`: Full, with special attention to TASK-010 ownership and verification.
- `docs/CONTEXT_INDEX.md`: Full.
- `PROJECT_BRIEF.md`: Sections `End-to-end prototype flow`, `Information labels`, `Prototype scope`, and `Strongest demo moment`.
- `docs/SAFETY_AND_DATA.md`: Full.
- `docs/CONTRACTS.md`: Sections 2, 4, 5, 7 through 9, 14 through 22, and 24 through 27.
- `docs/ARCHITECTURE.md`: Sections 7, 8.6, 8.7, 11, 13, and 14.
- `docs/PRODUCT_SPEC.md`: Sections 6, 7.5, 7.11, 7.12, 7.13, 7.14, 10, and 12.
- `docs/DEMO_AND_FIXTURES.md`: Sections 4, 7 through 11, 13, and 17.
- `docs/TESTING_AND_EVALUATION.md`: Sections 2, 4, 7.1 through 7.3, 8.4 through 8.6, 10, 15, 17, 21, and 22.
- `decision-log.md`: DEC-004 through DEC-010, DEC-013, DEC-015, DEC-024 through DEC-028, and DEC-034 through DEC-041.

## 6. Exclusive write scope

- `lib/state/`
- `lib/analysis/replay.ts`
- `fixtures/replay/`
- `tests/unit/state/`
- `tests/unit/replay/`

No other path may be created, modified, renamed, generated, or deleted by this task.

## 7. Read-only context allowed

- `lib/contracts/`
- `lib/fixtures/`
- `lib/guidance/`
- `lib/documents/`
- `lib/redaction/`
- `lib/citations/`
- `lib/review/`
- `lib/export/core/`
- `fixtures/cases/`
- `fixtures/evals/definitions/`
- `package.json`
- `tsconfig.json`
- `vitest.config.ts`
- All authoritative Markdown documents listed in Section 5.

Read-only inspection does not grant permission to repair or reformat these paths.

## 8. Out of scope

- UI providers, route layouts, navigation, Reset Case controls, recovery panels, or user-facing audit views.
- Live analysis routing, provider adapters, provider registry, provider discovery, prompts, or model calls.
- Review, dependency, citation, coverage, redaction, export-gate, or shared-contract rule changes.
- Building an `AnalyzeRequest` in UI code or adding recovery linkage to the stateless API request or response.
- Durable server persistence, database storage, authentication, multi-user state, service workers, or cross-device resume.
- New replay modes, hidden checkpoints, hidden fixture decisions, or replay presented as live AI.
- Package, lockfile, shared test setup, environment, deployment, billing, quota, or cloud changes.

## 9. Frozen contracts and invariants

- Use canonical `CommandMeta`, `CaseCommand`, `FixtureProcessingResult`, `CoverageReviewIntent`, `CoverageReviewDecision`, `DependencyChange`, `CaseState`, `PendingLiveAnalysis`, `AuditEvent`, `LiveAnalysisExecutionResult`, `AnalysisRecoveryMetadata`, `AnalysisRun`, `CitationResolutionDecision`, `ReviewIntent`, `ReplayRequest`, `ReplayBundle`, `DemoCheckpointBundle`, `NonRunAnalysisAttempt`, `ExportGate`, `ExportRecord`, and `ExportManifest` contracts from `lib/contracts/`.
- The reducer supports exactly the frozen local commands. It has no bulk approve command and no component may directly set case status, support status, gate readiness, or dependency impacts.
- The reducer owns the fixed intake flow: `begin_fixture_processing`, validated `complete_fixture_processing`, safe `fail_fixture_processing`, retry of one fixed retryable fixture stage only, ephemeral local `refresh_mask_suggestions`, validated add and removal of safe mask suggestions, per-mask review, recomputed `complete_mask_review`, and `review_coverage_issue` with an explicit limitation. Candidate extraction, citation validation, timeline/Nexus assembly, and safety export checks transition only through explicit analysis or replay lifecycle commands and never retry a provider call. Coverage review appends one immutable persisted `CoverageReviewDecision`, retains original and reviewed consequence, and makes a safe reduced projection available to export. It never persists, logs, audits, exports, or transmits the local sensitive terms; it never accepts raw source text, arbitrary segments, a caller-supplied leak-scan result, or a caller-created coverage resolution.
- Reject a command when `expectedCaseRevision` is stale. Repeated `idempotencyKey` values cannot apply a mutation or append a duplicate audit event.
- The live lifecycle uses exactly `start_live_analysis(request, recoveryOfRunId local)`, `complete_live_analysis(startCommandId, succeeded response)`, `fail_live_analysis(startCommandId, failed response)`, `reject_live_analysis_preflight(startCommandId, rejected response)`, and `record_live_analysis_transport_failure(startCommandId, reasonCode)`. Deterministic replay uses `run_deterministic_replay(request)` whose request names only trusted `REPLAY-CFN-DEMO-001-V1`; checkpoint loading accepts only trusted ID `DEMO-CHECKPOINT-REVIEW`.
- `start_live_analysis` validates purpose, masking, leak scan, release, acknowledgement, case revision, and that no request is pending before any network call. A non-null local `recoveryOfRunId` must identify the current preserved failed run and a same-provider retry or provider-switch class permitted by that failure.
- The reducer derives `selectionReason` as `initial_choice`, `retry_same_provider`, `explicit_provider_switch`, or `explicit_deterministic_replay`, fixes `selectedBy` to `practitioner`, and fixes `automaticFailover` and `outputsMerged` to `false`. The stateless `AnalyzeRequest` and terminal `LiveAnalysisExecutionResult` never carry this recovery metadata.
- `pendingLiveAnalysis` holds the accepted start command and source case revision in memory only. Starting does not increment `caseRevision`, every unrelated material command is blocked while pending, the session serializer excludes it, and a terminal command is valid only when `startCommandId` and the unchanged source case revision match the pending request.
- `complete_live_analysis` and `fail_live_analysis` clear the matching pending request, attach the locally derived recovery metadata, and atomically append and activate the terminal execution as a separate run. Success loads only that run's records; failure activates the failed run with empty current candidates and citations.
- `reject_live_analysis_preflight` clears the matching pending request, appends a safe rejection audit event, creates no run, and preserves the previously active run and its current run-scoped data. `record_live_analysis_transport_failure` does the same for a matching network, missing-response, or invalid-envelope failure, but records the remote outcome as unknown, accepts no output, and creates no recovery link. Each produces a typed `NonRunAnalysisAttempt` projection derived from the safe audit event and linked by safe `startCommandId`, audit ID, and correlated live provider-release pair; no second mutable attempt ledger is added. A later explicit start after either no-run outcome is unlinked with `recoveryOfRunId: null` and `selectionReason: initial_choice`. `run_deterministic_replay` alone validates any non-null replay recovery link against the current preserved failed run and permitted replay recovery, attaches locally derived metadata, and executes and activates replay locally without calling `POST /api/analyze`.
- Every material purpose, authority, mask, evidence, context, review, guidance, run, or minimum-necessity selection change increments `caseRevision`, stales prior gates, and makes prior exports non-current without mutating the historical export record. Re-evaluating the same normalized export gate is revision-stable, preserves the exact ready gate object already referenced by a current export manifest, and `create_export` never increments case revision.
- Derive `caseStatus` in the frozen priority order: active processing, failed required processing, incomplete prerequisites, non-review critical blocker, pending or invalidated individual review, current ready gate, then current export.
- Audit events are append-only within the browser case through normal application actions. Sequence values are stable and increasing. Safe summaries contain no raw quote, direct identifier, prompt, provider body, credential, or free-text review reason.
- `analysisRuns` is append-only. `activeAnalysisRunId` is null or resolves to exactly one preserved run. Current candidates and citations come only from the active successful run and are empty for an active failed run.
- Retry, provider switch, and replay activation create separate linked runs. Never copy or merge candidates, citations, reviews, citation resolutions, dependency changes, gates, or exports across runs.
- `reviews`, `citationResolutions`, and `dependencyChanges` are append-only only while the same active successful run remains current. Activating any new successful run, failed run, alternate provider run, or ordinary replay clears those three current run-scoped ledgers together with current candidates, current citations, stale gate state, current export pointers, and current export manifest while preserving `analysisRuns`, safe audit history, immutable export records, coverage reviews, purpose, documents, segments, masking, coverage, processing, and guidance identity.
- `resolve_citation` verifies that the candidate and ambiguous citation belong to the active successful run, then calls the pure TASK-007 resolver. The selected segment and redacted range must exactly match an allowlisted recomputed option.
- A valid manual resolution updates the citation to `manually_resolved`, appends an immutable `CitationResolutionDecision` to `citationResolutions`, appends `citation_manually_resolved`, increments case revision, stales the gate, and recalculates affected support. It never upgrades evidence nature, auto-accepts review, or reinstates an earlier review decision.
- `sessionStorage` contains only the strict validated `PersistedCaseState` root with a 1 MB maximum. It excludes `SourceSegment`, raw text, PDF bytes, object URLs, provider request or response bodies, `pendingLiveAnalysis`, prompts, export blobs, API keys, and cookies. Restore verifies the fixed key, schema, fixture binding, relationships, guidance-pack identity, and safe projections, rehydrates read-only segments and the immutable guidance pack from trusted local assets, re-derives case status, and never resumes the request. If the restored guidance identity does not exactly match the current trusted pack, restore replaces the identity with the current pack, increments case revision, clears export gate, current export ID, current export manifest, and `exportedRevision`, and re-derives non-exported state without deleting safe audit or historical export records. Each appended run receives immutable browser-derived `RunInputStateProvenance`; its source case revision correlates only the pending response, while purpose, masking, selection, digest, and fixture fields support later stale-gate checks.
- Unknown or incompatible persisted major versions and invalid or oversized payloads fail closed and expose a Reset Case outcome. They are never partially restored.
- Reset Case clears in-memory case state and the versioned session key, and coordinates cleanup of object URLs, PDF workers, and document caches without deleting fixture assets.
- `review_candidate` accepts only a non-withdraw discriminated `ReviewIntent`. Edit requires changed non-empty limited text and a non-empty reason; non-edit actions reject edited text; the reducer derives the complete immutable `ReviewDecision`, including status transition, revision, actor, role, time, dependency snapshot, and supersession. `withdraw_candidate` is the only input path for a derived withdrawal decision.
- Replay is local and never uses `POST /api/analyze`. The compile-time trusted registry, not browser or persisted data, resolves the bundle ID and instantiates one successful local replay run with its `CaseCandidate[]` and `Citation[]`. It must match bundle, fixture, prompt, analysis response, and replay version `1.0.0`, canonical fixture digest, exact selected segments, approved-redacted-input digest, exact counts, and one-run ownership or fail closed before mutation.
- Ordinary replay requires the current validated Purpose Brief, local-replay disclosure acknowledgement, approved masking review, and passed leak scan. It recomputes the bundle's selected-segment derivative digest from current approved state and revalidates every bundled citation and range against that exact derivative. It has zero seeded decisions and never overwrites current purpose, documents, segments, masks, coverage, or processing state.
- `DEMO-CHECKPOINT-REVIEW` has bundle and checkpoint version `1.0.0`, visible label `Prepared synthetic review checkpoint`, replay label `Bundled deterministic replay, not live AI`, provider transmission `false`, and seeded decision actor `fixture_reviewer`.
- Checkpoint loading carries no recovery field. Its one run has null recovery linkage, explicit deterministic-replay selection, practitioner selection, no automatic failover, and no output merging.
- Loading the checkpoint resolves only its compile-time trusted ID, validates its complete Purpose Brief and replay acknowledgement, exact fixture documents and segments, approved fixture-reviewer masks and passed leak scan, selected-segment derivative digest, recomputed citation outcomes, recomputable coverage, completed processing, `coverageReviewCount: 0`, `coverageReviews: []`, every coverage-review linkage null, every checkpoint coverage issue active consequence equal to initial consequence, one successful run, exact collection counts, single-run ownership, and ordered fixture-reviewer-only decisions before one atomic mutation. It preserves append-only `analysisRuns`, safe audit history, and immutable historical export records; clears prior `reviews`, `citationResolutions`, `dependencyChanges`, gate state, current export pointers, and current export manifest; appends and activates the checkpoint run; and atomically replaces trusted purpose, documents, segments, masking, coverage, coverage reviews, processing, current candidates, current citations, and ordered fixture-reviewer decision state with the checkpoint prerequisite state. It applies those decisions once and requires the exact expected post-decision state hash under projection version `1.0.0`, including discriminator-specific dependency targets, source evidence nature, and stable citation source and quote fields. The canonical hash excludes dynamic run IDs, case revision, activation and review times, and audit IDs, sequences, and timestamps. It is not a saved user session, live response, third analysis mode, arbitrary browser payload, or current-practitioner work. This checkpoint prerequisite replacement is the explicit exception to preserving existing coverage reviews; ordinary replay preserves current coverage reviews.
- The normative `CAND-TASK-0402` withdrawal invalidates only reachable dependants, preserves unrelated decisions, and immediately revokes export readiness.

## 10. Implementation steps

1. Inspect the integrated canonical contracts and pure dependency modules, then define the smallest reducer, command-result, audit, persistence, cleanup, and replay interfaces inside the owned paths.
2. Implement validated initial state and central command dispatch with revision, idempotency, actor, transition, active-run, pending-live-request, narrow `ReviewIntent`, and derived-decision checks.
3. Implement the five-command live lifecycle. Validate local recovery linkage at start, keep the source revision unchanged, block unrelated material commands while pending, accept only a matching terminal response, attach recovery metadata locally, append and activate success or failure atomically, and preserve the active run without creating a run on preflight or transport failure.
4. Implement `resolve_citation` through the pure TASK-007 resolver with active-successful-run ownership, ambiguous-status, allowlisted-range, append-only decision and audit, gate-staleness, and support-recalculation checks.
5. Implement deterministic audit event creation and case-status derivation without duplicating upstream domain rules.
6. Implement the narrow session serializer, parser, schema-versioned key, 1 MB limit, pending-write pause, prior-stable-snapshot restore, case-status re-derivation, pending-request exclusion, and fail-closed restore result.
7. Implement Reset Case state and registered-resource cleanup behavior.
8. Implement the compile-time trusted bundled-artifact registry, ID-only command resolution, version, selected-segment, approved-redacted-input digest, citation and range validation, exact count and single-run ownership checks, local `run_deterministic_replay` behavior with failed-run recovery validation, and atomic `DEMO-CHECKPOINT-REVIEW` loading with complete trusted prerequisite state and frozen fixture-reviewer provenance.
9. Implement `evaluate_export_gate` and `create_export` only through TASK-009 normalized `ExportSelection`, recomputed `exportSelectionDigest`, dependency-closure validation, Purpose `intendedRecipientCategory` validation, current-gate validation, and manifest hash checks. Canonicalize selection array order before digesting. Re-evaluating the same normalized gate with unchanged inputs must not increment `caseRevision`. If a current export already exists for the same revision and digest, preserve the exact ready gate object referenced by the manifest, including ID and evaluated time. A structurally valid changed minimum-necessary selection increments revision and clears current export state before a new gate is created at the resulting revision, including when the new gate is blocked for unconfirmed minimum necessity, outside-purpose recipient category mismatch, category-ineligible content, or missing dependency closure. `create_export` never increments `caseRevision` and must use the current ready-gate revision for the export record, manifest, and `exportedRevision`. Reject only structurally malformed, unknown-ID, duplicate, overlapping, wrong-kind, stale, or digest-mismatched selections before mutation.
10. Add focused tests for every command, stale revision, repeated idempotency key, invalid start, revision-stable pending state, material-command blocking, pending exclusion, terminal correlation, atomic activation, preflight and transport-failure preservation and `NonRunAnalysisAttempt` projection, local recovery metadata, narrow review intent and derived decisions, citation resolution, status transition, audit safety rule, persistence exclusion, restore failure, reset cleanup, run isolation, registry rejection of arbitrary or unknown bundle data, replay ownership and count mismatch, replay version mismatch, checkpoint prerequisite mismatch, checkpoint load, export-selection normalization and digest rejection, and hero transition.
11. Run the exact verification commands, inspect the diff for unowned files and sensitive content, and prepare the required handoff.

## 11. Acceptance criteria

- Every frozen `CaseCommand` is validated and applied through one reducer boundary, and no bulk-review or free-form status mutation exists.
- A matching command increments revision exactly when material state changes and appends the expected safe audit event exactly once.
- A stale `expectedCaseRevision` or repeated `idempotencyKey` fails without changing state or appending an audit record.
- An invalid live transition creates no `pendingLiveAnalysis` and authorizes no network request. A valid start records one in-memory pending request with locally validated recovery linkage without incrementing `caseRevision`, and unrelated material commands are rejected until pending state clears.
- A terminal command with the wrong `startCommandId` or changed source case revision fails without appending a run. Matching success or started failure clears pending state and atomically appends and activates exactly one run with locally attached recovery metadata.
- Preflight rejection or a safe client transport failure clears the matching pending request, creates no run, and preserves the previously active run. Transport failure records unknown remote outcome, no accepted output, and no recovery link. `AnalyzeRequest` and `LiveAnalysisExecutionResult` remain free of recovery metadata.
- Each no-run outcome creates one `NonRunAnalysisAttempt` with safe `startCommandId` and audit linkage. Preflight records not transmitted and not started; transport failure records transmission unknown and remote outcome unknown; both record `outputAccepted: false` and no invented run ID.
- `run_deterministic_replay` validates a non-null recovery link locally, creates a separate linked replay run with `explicit_deterministic_replay` selection reason, and makes no network request.
- Case status matches the frozen priority order for draft, processing, processing failed, blocked, review required, ready to export, and exported fixtures.
- Processing stages follow the frozen transition matrix: local fixture success completes only intake through identifier masking; live or replay start activates candidate extraction; terminal success completes candidate extraction, citation validation, and timeline/Nexus assembly while leaving safety/export checks pending until `evaluate_export_gate`; terminal started failure fails candidate extraction; preflight and transport failure restore the prior stable processing array.
- Initial structurally valid export selection creates a gate at the current revision without incrementing. Export gate evaluation with the same normalized selection and unchanged inputs is revision-stable. If a current export already exists for the same revision and digest, the reducer preserves the exact ready gate object referenced by the manifest. A structurally valid changed minimum-necessary selection increments revision before creating the new gate, including blocked gates for unconfirmed, outside-purpose recipient category mismatch, category-ineligible content, or missing-closure selections. Structurally invalid selections leave state unchanged. `PROCESSING_FAILED` excludes `safety_export_gate_checks` itself. `create_export` never increments revision and records `exportedRevision` from the current ready gate.
- Audit events retain actor, run, recovery, provider, release, version, affected entity, reason-code, sequence, and time fields when applicable, while their summaries contain none of the prohibited content.
- Activating a failed run leaves current candidates and citations empty. Activating a successful retry, alternate provider, or replay uses only that run's records and preserves earlier runs without output merging.
- Activating any new run clears run-scoped current `reviews`, `citationResolutions`, and `dependencyChanges`; no current ledger record may point to a candidate or citation from a non-active run.
- A valid `resolve_citation` updates only an ambiguous citation in the active successful run, appends one `CitationResolutionDecision` and one `citation_manually_resolved` audit event, recalculates support, stales the gate, and never auto-accepts review. Invalid ranges or run ownership make no change.
- `review_candidate` accepts no full decision object and no withdrawal action. From one valid `ReviewIntent`, policy derives exactly one decision with the correct prior and resulting status, candidate revision, actor, role, time, dependency snapshot, and supersession. Withdrawal succeeds only through `withdraw_candidate`.
- The persistence round trip restores all permitted reviewed synthetic state, the current validated redacted export manifest, guidance identity, and completed active-run citation-resolution decisions, while excluding every prohibited raw, secret, object, prompt, response, pending-live-request, and generated blob field. A pending request does not overwrite the prior stable snapshot, refresh restores a re-derived non-processing state without resuming transport, and a guidance-pack identity mismatch replaces the identity, increments revision, clears current export pointers, clears `exportedRevision`, clears the export gate, and preserves safe audit plus historical export records.
- Invalid JSON, unknown major version, wrong case or fixture version, or payload above 1 MB fails closed with a Reset Case result and no partial state.
- Reset Case removes the session key, returns a fresh `CFN-DEMO-001` state, and invokes registered object URL, PDF worker, and document-cache cleanup once.
- Replay commands accept only the allowlisted bundle ID. The registry rejects an unknown ID or any attempt to pass candidate, citation, decision, run, checkpoint, fixture, or registry data from the browser or persistence boundary.
- Replay rejects any bundle, fixture, prompt, response, replay, fixture digest, selected-segment order, approved-redacted-input digest, recomputed derivative, citation outcome, count, nonzero omitted-quarantine, ID-uniqueness, dependency-resolution, or one-run ownership mismatch before state mutation and makes no provider request. Ordinary replay preserves the current validated purpose, source, masking, coverage, and processing state and loads no seeded decision.
- Loading `DEMO-CHECKPOINT-REVIEW` exposes both frozen labels, validates complete purpose and replay acknowledgement, exact fixture records, approved fixture-reviewer masking and leak scan, selected-segment derivative digest, citation outcomes, recomputable coverage, completed processing, `coverageReviewCount: 0`, `coverageReviews: []`, null coverage-review decision links, active consequence equal to initial consequence for every checkpoint coverage issue, exact counts and one-run ownership, records no provider transmission, appends exactly one local replay run, keeps the visible practitioner load action separate, attributes every seeded purpose, mask, and review record to `fixture_reviewer`, applies decisions once in frozen order, and matches the expected lowercase SHA-256 post-decision state hash with complete stable dependency targets and citation source fields under projection version `1.0.0` regardless of dynamic activation metadata.
- The exact `CAND-TASK-0402` transition invalidates `NEXUS-COMPELLED-TASKS` and `NEXUS-OFFENCE-TIMING`, preserves unrelated decisions, stales the gate, and supports the normative renewed-review result.
- All tests use synthetic fixtures and no file outside Section 6 changes.

## 12. Verification commands

```text
npx vitest run tests/unit/state tests/unit/replay
npm run typecheck
```

Both commands must pass. Do not weaken an assertion, delete a fixture, or hide a failure.

## 13. Manual checks

1. Apply one valid command, repeat it with the same `idempotencyKey`, and confirm the second attempt changes neither state revision nor audit length.
2. Apply a command with an earlier `expectedCaseRevision` and confirm it fails without a partial mutation.
3. Start one initial live analysis and one permitted recovery. Confirm the reducer records a pending request before transport, validates the recovery against the current failed run, and derives practitioner selection with both automatic failover and output merging false.
4. Submit mismatched terminal command IDs and a terminal response after a source-revision change. Confirm neither appends a run. Then submit matching success and failure responses and confirm each appends and activates atomically.
5. While a request is pending, attempt a purpose, mask, citation, review, and export mutation. Confirm each is rejected without changing `caseRevision`, state, or audit history.
6. Submit a matching preflight rejection after a prior successful run. Confirm pending state clears, no run is created, and the prior active run and output remain selected.
7. Submit each valid transport-failure reason for a matching pending request. Confirm pending state clears, `analysis_transport_failed` records unknown remote outcome and no accepted output, the prior active run remains selected, and no run or recovery link is created.
8. Inspect the system-card projection after one preflight rejection and one transport failure. Confirm two typed `nonRunAttempts`, exact start-command and audit linkage, safe reason fields, correct transmission and remote statuses, `outputAccepted: false`, and no run ID.
9. Submit one valid non-withdraw `ReviewIntent`, a caller-built full decision object, and a review intent with `withdraw`. Confirm only the narrow valid intent is accepted and all decision-owned fields are derived. Then confirm withdrawal works only through `withdraw_candidate`.
10. Resolve one ambiguous citation with an allowlisted resolver option, then try a fabricated range and a citation from another run. Confirm only the valid action appends a decision and audit event, stales the gate, recalculates support, and leaves review unaccepted.
11. Persist and restore the complete synthetic reviewed state, then inspect the serialized text for pending live analysis, raw segment text, seeded identifiers, provider bodies, prompts, keys, object URLs, export blobs, or bundled registry data.
12. Attempt restore with an unknown major version and with a payload above 1 MB. Confirm both return the fail-closed Reset Case path.
13. Activate a failed run followed by a successful alternate-provider or replay run. Confirm the prior run remains and no candidate, citation, or review record is merged across runs.
14. Activate a successful run, add a review, citation resolution, and dependency change, then activate a second run. Confirm the three run-scoped ledgers are cleared, historical audit/export records remain, and no dangling record points to the prior run.
15. Restore a persisted state with a stale guidance-pack identity. Confirm restore replaces it with the current trusted identity, increments revision, clears current export ID, current export manifest, exported revision, and export gate, preserves safe audit and historical export records, and does not run analysis.
16. Exercise the processing stage matrix for fixture success, fixture failure, retry, live start, replay start, terminal success, terminal started failure, malformed output, preflight rejection, transport failure, and `evaluate_export_gate`. Confirm every status matches the contract and no export gate is created without the explicit command.
17. Evaluate an initial structurally valid export selection and confirm the gate is created at the current revision without incrementing. Evaluate the same normalized export selection twice and confirm case revision is unchanged. Submit a reorder-equivalent selection and confirm revision is unchanged. Submit a valid changed minimum-necessary selection and confirm revision increments before the new gate is created. Submit unconfirmed, outside-purpose recipient category mismatch, category-ineligible, and missing-closure selections and confirm each creates a blocked gate with the correct blocker. Submit structurally invalid, duplicate, overlapping, or unknown-ID selections and confirm no state mutation. Create an export and confirm revision is unchanged, the export record and manifest use the ready-gate revision, and `exportedRevision` equals the current case revision. Re-evaluate the same normalized selection after export and confirm the manifest still references the exact same ready gate ID and evaluated time.
18. Resolve `REPLAY-CFN-DEMO-001-V1`, then alter each version, digest, declared count, `replayRun.candidateCount`, `replayRun.quarantinedCount`, run owner, candidate owner, citation owner, dependency target, and seeded-decision count in isolated test doubles. Confirm only the untouched trusted bundle with `quarantinedCount: 0` activates and ordinary replay preserves the existing purpose and mask state.
19. Attempt an unknown bundle ID and commands carrying an injected run, candidate, citation, decision, or checkpoint object. Confirm they fail before mutation and cannot extend or override the compile-time registry.
20. Load `DEMO-CHECKPOINT-REVIEW` twice with different generated run IDs and activation times. Confirm the exact two visible labels, complete acknowledged purpose, exact fixture projections, approved fixture-reviewer masks, passed leak scan, recomputed coverage, `coverageReviewCount: 0`, `coverageReviews: []`, null coverage-review decision links, active consequence equal to initial consequence for every checkpoint coverage issue, completed processing, one local replay run per fresh case, matching counts, no provider transmission, fixture-reviewer-only attribution, one ordered decision application, and the same expected lowercase SHA-256 post-decision state hash. Corrupt each prerequisite, projection field, coverage-review field, decision order, projection version, or expected hash in isolated test doubles and confirm atomic rejection with no partial state.
21. Run Reset Case with registered cleanup doubles and confirm the session key, in-memory state, object URL, PDF worker, and cache are each cleared without changing fixture files.
22. Inspect the final diff and confirm it contains only the five paths in Section 6 and no secret, real case data, raw provider output, or unsupported claim.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Exact commit message: `feat: add case state persistence and replay`

## 15. Handoff requirements

- Report `Task: TASK-010` and outcome as Complete, Partial, or Blocked.
- List every changed file under the five owned paths.
- Summarize command validation, revision and idempotency behavior, pending mutation lock, locally validated recovery metadata, atomic activation, preflight and transport-failure preservation and non-run projections, narrow review intent and derived decisions, citation resolution, status derivation, audit safety, session persistence, reset cleanup, run isolation, trusted bundle resolution, replay, and checkpoint behavior.
- State how review, dependency, export freshness, provider provenance, synthetic-only data, and fixture-reviewer attribution were preserved.
- Report each Section 12 command and its pass or fail result.
- Report every Section 13 manual check and its result.
- Identify any unrun check, blocker, assumption, or coordinator follow-up.
- Include a commit hash only when the opening prompt authorized a commit and the exact message was used. Otherwise report `Not committed`.

## 16. Stop conditions

Stop and report to the coordinator if:

- Any dependency is not integrated, the base revision is not identified, or an expected contract, fixture, replay record, or upstream API is missing.
- Implementation requires a write outside Section 6, including contracts, fixtures outside `fixtures/replay/`, domain engines, UI, package files, shared test configuration, or documentation.
- A new dependency, command outside the frozen `CaseCommand` union, state enum, audit type, replay mode, checkpoint ID, persistence service, environment variable, provider, route, or cloud setting appears necessary.
- The required behavior would allow bulk review, caller-formed review decisions, review-intent withdrawal, direct status mutation, stale revision acceptance, duplicate commands, mixed-run outputs, unsafe persistence, hidden replay, current-practitioner attribution of seeded decisions, arbitrary browser-supplied bundle data, or an incomplete reset.
- The live lifecycle would require recovery metadata from the stateless API, persistence of a pending request, activation without a matching start and source revision, a material mutation while pending, or a fabricated run for preflight or transport failure.
- Citation resolution would require a component-side status change, a non-allowlisted range, a resolver reimplementation, mutable decision history, or automatic review acceptance.
- A fixture, contract, provider-provenance rule, or hero transition conflicts with an authoritative document.
- A live provider call, credential, database, durable server store, billing action, deployment change, or production setting would be required.
- Existing user changes overlap the owned paths and cannot be preserved safely.
