# TASK-015: Analysis route and deterministic post-validation

## 1. Task metadata

- Status: Pending until coordinator marks ready.
- Stage: integration.
- Wave: 7.
- Risk: high.
- Suggested branch: `task/015-analysis-orchestration`.
- Depends on: TASK-007, TASK-008, TASK-011, TASK-012, TASK-013, TASK-014.
- Graph outcome: Implement safe capability discovery, the strict live-analysis route, single selected-provider orchestration, timeout handling, proposal normalization, citation and policy validation, quarantine, and safe recovery-option derivation.

## 2. Goal

Implement the complete stateless server route that safely describes available releases, accepts one strict live-analysis request, calls exactly the selected adapter once, and returns one terminal `LiveAnalysisExecutionResult` with only proposals that passed common deterministic validation.

## 3. Why this task exists

The browser-to-provider boundary is the highest-risk runtime path. This task makes provider selection explicit, reconstructs approved content server-side, treats every model result as untrusted, quarantines invalid proposals, returns safe terminal failures with no partial brief, and prevents provider or replay substitution without owning browser case history or recovery linkage.

## 4. Dependencies and base requirement

- TASK-007 must be integrated with exact citation matching, the one conservative normalization fallback, ambiguity rejection, semantic mismatch handling, and source-range resolution.
- TASK-008 must be integrated with canonical candidate assembly, support derivation, review requirements, prohibited-output rules, and dependency validation.
- TASK-011 must be integrated with the registry, disclosures, canonical request reconstruction, prompt, request policy, safe errors, safe logging, and server-only interfaces.
- TASK-012, TASK-013, and TASK-014 must be integrated with their native mocked and verified adapters.
- Start from the coordinator branch after all six dependencies are integrated. The opening coordinator prompt must identify the base revision. Stop if the dependency state or base revision is missing or inconsistent.
- Use only existing dependencies and environment names. Keep all verification mocked and synthetic. Do not make a live provider request.

## 5. Required context

Read these sources before editing, in this order:

- `AGENTS.md`: Full.
- `tasks/TASK-015.md`: Full.
- `PLANS.md`: Full.
- `TASK_GRAPH.yaml`: Full, with special attention to TASK-015 ownership and verification.
- `docs/CONTEXT_INDEX.md`: Full.
- `PROJECT_BRIEF.md`: Sections `End-to-end prototype flow`, `Information labels`, `Prototype scope`, and `Product principles`.
- `docs/SAFETY_AND_DATA.md`: Full.
- `docs/CONTRACTS.md`: Sections 2, 4.7, 6 through 10, 14 through 18, 22, 23, 25, 26, and 27.
- `docs/ARCHITECTURE.md`: Sections 3, 4, 7, 8.4, 8.5, 9, and 12 through 16.
- `docs/MODEL_ROUTING.md`: Full.
- `docs/PRODUCT_SPEC.md`: Sections 6, 7.5, 7.11, 10, and 12.
- `docs/DEMO_AND_FIXTURES.md`: Sections 6 through 9, 11, 14, 15, 16, and 17.
- `docs/TESTING_AND_EVALUATION.md`: Sections 2, 4, 6, 7.2, 8.1, 11, 12, 14.1, 14.2, 14.4, 18, 19, 21, and 22.
- `docs/SOURCE_REGISTER.md`: TECH-001 through TECH-004, TECH-005 through TECH-007, TECH-010, TECH-014 through TECH-036, and Section 9.
- `decision-log.md`: DEC-004, DEC-011, DEC-012, DEC-015, DEC-020 through DEC-029, DEC-034, DEC-036 through DEC-039, DEC-042, and DEC-043, plus the exact installed SDK and provider-fact records.

## 6. Exclusive write scope

- `app/api/analyze/route.ts`
- `lib/ai/server/orchestrator.ts`
- `lib/ai/server/evaluation-entry.ts`
- `lib/ai/server/post-validate.ts`
- `lib/ai/server/recovery.ts`
- `lib/ai/server/normalize.ts`
- `tests/contracts/api/`
- `tests/unit/ai/orchestration/`

No other path may be created, modified, renamed, generated, or deleted by this task.

## 7. Read-only context allowed

- `lib/contracts/`
- `lib/citations/`
- `lib/review/`
- `lib/ai/server/index.ts`
- `lib/ai/server/types.ts`
- `lib/ai/server/registry.ts`
- `lib/ai/server/canonical-input.ts`
- `lib/ai/server/request-policy.ts`
- `lib/ai/server/errors.ts`
- `lib/ai/server/adapters/openai.ts`
- `lib/ai/server/adapters/gemini.ts`
- `lib/ai/server/adapters/mistral.ts`
- `lib/security/provider-boundary.ts`
- `lib/security/safe-logging.ts`
- `prompts/`
- `lib/fixtures/`
- `fixtures/cases/`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vitest.config.ts`
- All authoritative Markdown documents listed in Section 5.

Read-only inspection does not grant permission to repair or reformat these paths.

## 8. Out of scope

- Shared contract, registry, prompt, canonical-input, request-policy, safe-logging, or adapter changes.
- Case reducer, pending live-analysis state, recovery-link validation, `AnalysisRecoveryMetadata` attachment, audit append, case history, session persistence, replay loading, checkpoint behavior, or browser run activation.
- Provider selection and recovery UI, processing UI, system card, Safety Lab, review workspace, or exports.
- Deterministic replay through `POST /api/analyze`; replay remains a local path.
- Automatic retry, automatic provider fallback, automatic replay, cross-run output merging, prose fallback, or partial brief recovery.
- New provider, model, release, environment variable, public endpoint, tool, file-upload, browsing, search, agent, memory, background, or streaming capability. The named private evaluation entry is permitted only as the documented server-only non-HTTP bootstrap for TASK-016.
- Package, lockfile, shared configuration, credential, billing, quota, firewall, deployment, or cloud changes.

## 9. Frozen contracts and invariants

- `GET /api/analyze` returns `AnalyzeAvailabilityResponse` version `1.0.0` with safe registry projections only. It never sends case content, probes provider health, or reveals private configuration.
- `POST /api/analyze` accepts only strict `AnalyzeRequest` version `1.0.0` for case `CFN-DEMO-001`, fixture `1.0.0`, data origin `bundled_synthetic`, mode `live`, and one exact live release selection. `AnalyzeRequest` has no `recoveryOfRunId`, and any attempted recovery field is rejected as an extra field.
- `lib/ai/server/evaluation-entry.ts` exports the only private live-evaluation entry. It is server-only, has no route or client export, accepts only the frozen bundled synthetic fixture, exact release, canonical redacted derivative, fixed prompt and schema, and a validated local batch spend approval plus one bounded call ordinal. The local runner owns duplicate and ordinal tracking. The entry reuses the exact selected adapter and common post-validation path, emits evidence only, bypasses runtime selectability only for that frozen evaluation call, and cannot read or mutate admission, registry, public availability, or browser state.
- The route uses Node.js runtime, `maxDuration = 60`, `Cache-Control: no-store`, JSON content type, practical same-origin checks, and a 1 MB request-body limit.
- Reject extra fields, raw file or text, direct identifiers, unknown structural tool or URL fields, free-text Purpose fields, malformed purpose ID or context, wrong versions or IDs, oversized input, incomplete mask approval, leak failure, wrong fixture digest, unavailable release, mismatched service tier, or mismatched disclosure before provider transmission. Active Purpose and authority status are browser-reducer prerequisites, not unverifiable stateless-route claims.
- The server reconstructs canonical redacted content, computes the redacted-derivative digest server-side, verifies canonical fixture binding and digest requirements, and reruns the declared-identifier leak scan. It never accepts a browser-supplied redacted-derivative digest or trusts client source text, evidence nature, support status, or leak-scan assertion.
- Call exactly the explicitly selected adapter once with a 45-second application timeout and abort signal. All non-selected adapter spies remain untouched. Do not call replay from this route.
- A preflight rejection returns `outcome: "rejected_before_run"`, `run: null`, empty candidates, citations, and quarantine, plus a safe `ApiError` with a positive preflight-only code and no fabricated failed execution. Timeout, refusal, authentication, quota, rate-limit, structured-response, citation, prohibited-output, semantic-safety, and client-transport errors cannot use that branch.
- After a valid execution starts, every provider or validation failure returns `outcome: "failed"`, one terminal failed `LiveAnalysisExecutionResult`, empty candidates, citations, and quarantine, and a safe error. Partial output is unrepresentable.
- Normalize all adapter responses into the one provider-neutral proposal before common validation. Provider-specific output cannot bypass a common check.
- Deterministic post-validation confirms allowlisted source IDs, document and page relationships, exact or uniquely normalized quotes, redacted range mapping, evidence-nature preservation, dependency validity, no prohibited conclusion or score, no instruction propagation, and a valid dependency or explicit gap.
- A successful route response contains one `CaseCandidate[]` discriminated-union collection. It never returns parallel timeline, Nexus, context-gap, lane, queue, or blocker candidate arrays.
- `D07-P2-S03` remains visible as untrusted `evidence_only` content but can never support a candidate or export statement.
- Only multiple bounded exact-codepoint occurrences inside one known, available, allowlisted, candidate-eligible canonical segment return the candidate with `supportStatus: citation_unresolved`, `reviewStatus: pending`, and an `ambiguous_match` citation with null ranges for central manual resolution. A unique normalized lookup may resolve as `exact_match`; multiple normalized-only matches, cross-segment ambiguity, an unknown or unavailable source, a non-candidate-eligible segment, and an unbounded result are quarantined as `AMBIGUOUS_QUOTE` with no candidate or citation.
- Other invalid proposals are quarantined only with `UNKNOWN_SOURCE`, `QUOTE_NOT_EXACT`, `EVIDENCE_NATURE_UPGRADE`, `PROHIBITED_CONCLUSION`, `INJECTION_PROPAGATION`, or `INVALID_DEPENDENCY`. Quarantine records use server-generated opaque IDs and one-based proposal ordinals only, never the provider-owned `proposedId`. They are never silently repaired with another model call.
- Deterministic code creates citations, derives support, assigns review status, and builds dependency records. The model cannot set final support, review, audit, gate, export, or legal status.
- Every successful candidate and citation carries the returned successful execution ID. Before activation, candidate, citation, and quarantine counts equal their run metadata, every candidate source dependency resolves to a returned citation, and every returned citation is dependency-referenced. One response never contains output from another execution.
- `LiveAnalysisExecutionResult` and `AnalyzeResponse` contain no `AnalysisRecoveryMetadata`, never receive, verify, echo, or log `recoveryOfRunId`, and never mutate browser case history. The browser reducer alone may attach recovery metadata after local validation.
- Operational failures may expose only applicable safe recovery options derived from safe failure classification. Same-provider retry has display order `0`, alternate live releases retain registry order `1` through `3`, replay has `4`, and Return to Purpose has `5`.
- Refusal, privacy, citation, injection, prohibited-output, invalid-structure, and semantic-safety failures cannot offer provider switching as a bypass.
- API errors and logs contain no source text, quote, prompt, provider body, key, cookie, account, billing, project, export, review reason, or stack trace.

## 10. Implementation steps

1. Inspect all integrated request, registry, adapter, citation, review, error, and normalization interfaces and confirm the route can consume them without changing shared files.
2. Implement safe `GET` capability discovery and strict route headers, runtime, size, content-type, and origin controls.
3. Implement `POST` preflight through the shared canonical reconstruction and selected-release policy, including server-side redacted-derivative digest computation and the exact rejected-before-run union.
4. Implement one selected-adapter orchestration with a 45-second timeout, abort propagation, safe execution timing, and no retry or fallback. Export the named private evaluation entry that reuses this exact path with its narrow frozen-input and approval guard, is unreachable from `app/`, browser, and public route imports, and cannot mutate admission.
5. Implement provider-neutral normalization and common deterministic post-validation, run-owned citation creation, one `CaseCandidate[]` assembly path, support derivation, the bounded repeated exact-codepoint within-segment ambiguity path, and quarantine for multiple normalized-only or otherwise unsafe ambiguity and other invalid proposals.
6. Implement terminal failed-execution responses and safe recovery-option derivation from safe classifications only, with no recovery metadata or case-history behavior.
7. Add contract and unit tests for the full malformed-input matrix, rejection of recovery fields, positive preflight-code enforcement, correlated provider-release errors, server-computed derivative digest, all adapters, success, failure, timeout, provider-owned malicious or identifier-bearing `proposedId` quarantine containment, evidence-only containment, recovery order, safety bypass prevention, single-execution provenance, and private evaluation-entry frozen-input, approval, no-HTTP, no-browser-import, no-runtime-admission-mutation isolation.
8. Run the exact verification commands, inspect the diff for unowned files and sensitive values, and prepare the required handoff.

## 11. Acceptance criteria

- `GET /api/analyze` returns the four safe provider and replay options in frozen order with correct selectability and no provider call or private value.
- API-BAD-01 through API-BAD-08 reject unknown fields including `recoveryOfRunId`, raw or direct content, wrong versions, wrong canonical fixture digest, missing approvals, invalid masks, oversized payloads, and wrong types before any adapter call.
- API-BAD-09 returns the failed union with one terminal failed live execution and empty candidates, citations, and quarantine for provider refusal, timeout, incomplete output, or invalid structure.
- API-BAD-10 and API-BAD-11 quarantine unknown-source, invalid-quote, multiple normalized-only matches, unsafe cross-segment or unbounded ambiguity, prohibited-conclusion, and injection-propagation proposals so none enters the candidate list.
- API-BAD-12 rejects unknown, disabled, not-configured, unavailable, unevaluated, or disclosure-mismatched releases before transmission.
- API-BAD-13 and API-BAD-14 reject non-matching unpaid Gemini and Mistral fixture requests with `PROVIDER_DATA_POLICY_BLOCKED` before adapter transport.
- A valid OpenAI, Gemini, or Mistral request invokes only its selected adapter exactly once and returns the same response shape and common validation behavior.
- The 45-second timeout aborts the selected adapter, returns `PROVIDER_TIMEOUT`, and creates no partial brief or hidden second attempt.
- Every successful candidate and citation carries case `CFN-DEMO-001` and exactly the successful execution ID. Candidate, citation, quarantine, ownership, and dependency-reference mismatches reject the complete terminal response before a reducer can activate it.
- Every successful candidate parses as exactly one `CaseCandidate` union branch, and the response contains no parallel timeline, Nexus, context-gap, lane, queue, or blocker arrays.
- Exact citations pass. A unique normalized lookup may resolve as `exact_match`. Multiple bounded exact-codepoint occurrences within one eligible canonical segment return one unresolved candidate and range-null citation for central resolution; multiple normalized-only matches and all other unsafe ambiguity are quarantined. Zero matches fail, evidence nature cannot be upgraded, and `D07-P2-S03` cannot support a returned candidate.
- Every quarantine reason uses one frozen safe code, a server-generated opaque ID, and a proposal ordinal. It contains no provider-owned proposal ID, raw evidence, or provider diagnostics.
- The private evaluation entry can call only the exact frozen adapter with validated local spend approval and canonical synthetic redacted input. It has no HTTP route or browser import and cannot change admission, registry, selectability, or public availability.
- Eligible operational failures produce deterministic explicit recovery options in fixed display order. No option starts automatically, and no option is recovery metadata.
- Refusal, privacy, citation, injection, prohibited-output, invalid-structure, and semantic-safety failures present no alternate-provider bypass.
- Preflight rejection returns `run: null`; a started failure returns a terminal failed `LiveAnalysisExecutionResult`; neither response carries recovery linkage or mutates case history.
- The server computes the redacted-derivative digest from reconstructed approved content and never trusts a browser-supplied derivative digest.
- Route responses and captured logs contain none of the prohibited sensitive fields.
- All tests use mocked providers and synthetic fixtures, the production build passes, and no file outside Section 6 changes.

## 12. Verification commands

```text
npx vitest run tests/contracts/api tests/unit/ai/orchestration
npm run typecheck
npm run build
```

All three commands must pass. Do not weaken an assertion, delete a fixture, or hide a failure.

## 13. Manual checks

1. Invoke the `GET` handler in the route harness and inspect option order, selectability, and disclosures. Confirm no adapter mock was called and no secret or raw environment value appears.
2. Send one valid request for each live release with all three adapter spies installed. Confirm exactly one selected spy runs per request and the other two remain at zero calls.
3. Send representative API-BAD-01 through API-BAD-14 requests, including an extra `recoveryOfRunId`, and confirm every preflight case stops before transport and every started failure returns empty output.
4. Return proposals with an unknown source, fabricated quote, one unique normalized lookup, repeated bounded exact-codepoint occurrences in one eligible segment, multiple normalized-only matches, cross-segment ambiguity, evidence-nature upgrade, prohibited conclusion, propagated embedded instruction, and invalid dependency. Confirm the unique normalized lookup resolves exactly, only the repeated exact-codepoint case enters unresolved review, and each unsafe case is quarantined with the matching safe reason.
5. Trigger quota, rate-limit, timeout, service-tier, refusal, privacy, citation, injection, invalid-structure, and semantic-safety failures. Confirm only operational failures offer eligible explicit recovery options, none starts an action, and no response contains recovery metadata.
6. Inspect a successful response and confirm every candidate and citation shares exactly one successful execution ID with complete provider provenance and no case-history fields.
7. Reconstruct one approved redacted derivative in the route harness. Confirm its digest is computed server-side and a browser attempt to supply a derivative digest is rejected.
8. Inspect response bodies and captured logs for the seeded identifiers, raw quote, prompt text, provider body, credential-like value, account detail, billing detail, project detail, review reason, recovery link, and stack trace. Confirm none is present.
9. Inspect the final diff and confirm it contains only the seven paths in Section 6 and no credential, real case data, raw provider response, or unsupported claim.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Exact commit message: `feat: add validated analysis orchestration`

## 15. Handoff requirements

- Report `Task: TASK-015` and outcome as Complete, Partial, or Blocked.
- List every changed file under the seven owned paths.
- Summarize capability discovery, stateless request preflight, server-computed derivative digest, one-provider orchestration, timeout, normalization, post-validation, quarantine, terminal failed responses, and safe recovery-option derivation.
- State how exact fixture binding, no partial brief, no automatic fallback, no safety bypass, single-execution output, safe errors, and safe logging were preserved.
- Report each Section 12 command and its pass or fail result.
- Report every Section 13 manual check and its result.
- Identify any unrun check, blocker, assumption, or coordinator follow-up.
- Include a commit hash only when the opening prompt authorized a commit and the exact message was used. Otherwise report `Not committed`.

## 16. Stop conditions

Stop and report to the coordinator if:

- Any dependency is not integrated, the base revision is not identified, or an expected registry, adapter, canonical-input, citation, review, request, response, or safe-error contract is missing.
- Implementation requires a write outside Section 6, including contracts, shared AI files, adapters, fixtures, state, UI, packages, lockfile, environment template, or shared test configuration.
- A new dependency, environment variable, provider, model, release, endpoint, tool, file, streaming path, retry, replay route, persistence layer, recovery class, or quarantine reason appears necessary.
- The required behavior would trust browser source text, permit an unapproved fixture, create a partial brief, silently repair output, call a second provider, enter replay, merge runs, or offer model switching after a safety failure.
- The route would need to receive or return recovery linkage, attach `AnalysisRecoveryMetadata`, inspect browser run history, persist case state, or activate a run.
- A fixture, provider policy, timeout, safe-error mapping, citation rule, recovery rule, or shared contract conflicts with an authoritative document.
- A live provider call, real credential, provider-account action, billing or quota action, firewall or Vercel change, deployment change, or public live enablement would be required.
- Existing user changes overlap the owned paths and cannot be preserved safely.
