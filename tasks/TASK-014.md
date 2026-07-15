# TASK-014: Mistral analysis adapter

## 1. Task metadata

- Status: Pending until coordinator marks ready.
- Stage: providers.
- Wave: 6.
- Risk: high.
- Suggested branch: `task/014-mistral-adapter`.
- Depends on: TASK-011.
- Graph outcome: Implement one native non-streaming Mistral JSON Schema request for the frozen exact snapshot, medium reasoning, disabled SDK retries, unpaid synthetic-only enforcement, and normalized safe errors.

## 2. Goal

Implement the native server-only Mistral adapter that makes one bounded JSON Schema Chat Completions request for the exact unpaid synthetic-only release and returns one provider-neutral `ModelAnalysisProposal`.

## 3. Why this task exists

Mistral is the third live recovery candidate and has distinct free-tier, retention, training-use, snapshot-availability, and SDK controls. A native adapter makes those constraints testable while keeping the release unavailable until matching passed reviewed static admission and coordinator-recorded deployed-account availability are present.

## 4. Dependencies and base requirement

- TASK-011 must be integrated with the shared adapter interface, registry, disclosure, canonical input, request policy, safe errors, safe logging, and server-only exports.
- TASK-001 and TASK-002 are transitive prerequisites through TASK-011. The exact installed official `@mistralai/mistralai` version must be present in the lockfile, checked against GHSA-jgg6-4rpr-wfh7, and recorded in `decision-log.md`.
- Start from the coordinator branch after TASK-011 is integrated. The opening coordinator prompt must identify the base revision. Stop if the dependency state, SDK record, advisory check, or base revision is missing or inconsistent.
- Verification uses a mocked native Mistral transport and the bundled synthetic canonical input. It must not use a real key or make a live request.

## 5. Required context

Read these sources before editing, in this order:

- `AGENTS.md`: Full.
- `tasks/TASK-014.md`: Full.
- `PLANS.md`: Full.
- `TASK_GRAPH.yaml`: Full, with special attention to TASK-014 ownership and verification.
- `docs/CONTEXT_INDEX.md`: Full.
- `PROJECT_BRIEF.md`: Sections `End-to-end prototype flow`, `Prototype scope`, and `Product principles`.
- `docs/SAFETY_AND_DATA.md`: Full.
- `docs/CONTRACTS.md`: Sections 2, 4.7, 16, 22, 23, 26, and 27.
- `docs/ARCHITECTURE.md`: Sections 4, 7, 8.4, 8.5, 9, 12 through 15, and 18.
- `docs/MODEL_ROUTING.md`: Sections 2, 3.1, 5 through 11, and 13, especially Section 8.3.
- `docs/TESTING_AND_EVALUATION.md`: Sections 6, 7.2, 11, 12, 14.1, 14.4, 18, and 19.
- `docs/SOURCE_REGISTER.md`: TECH-025 through TECH-036 and Section 9.
- `decision-log.md`: DEC-020, DEC-023, DEC-025 through DEC-029, plus the exact installed Mistral SDK and advisory-check records.

## 6. Exclusive write scope

- `lib/ai/server/adapters/mistral.ts`
- `tests/unit/ai/mistral-adapter.test.ts`

No other path may be created, modified, renamed, generated, or deleted by this task.

## 7. Read-only context allowed

- `lib/contracts/`
- `lib/ai/server/index.ts`
- `lib/ai/server/types.ts`
- `lib/ai/server/registry.ts`
- `lib/ai/server/canonical-input.ts`
- `lib/ai/server/request-policy.ts`
- `lib/ai/server/errors.ts`
- `lib/security/provider-boundary.ts`
- `lib/security/safe-logging.ts`
- `prompts/`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vitest.config.ts`
- All authoritative Markdown documents listed in Section 5.

Read-only inspection does not grant permission to repair or reformat these paths.

## 8. Out of scope

- Shared AI contracts, registry, disclosures, prompt, canonical reconstruction, safe errors, safe logging, or environment template.
- OpenAI or Gemini adapters.
- `/api/analyze`, orchestration, post-validation, recovery options, case-state mutation, provider UI, evaluation admission, or exports.
- A moving Mistral alias, paid Mistral tier, real or harmless-public data, browser-supplied source text, raw PDFs, tools, files, search, agents, conversations, provider memory, external actions, or streaming.
- Any retry, alternate-provider call, automatic fallback, replay substitution, or output merging.
- Package, lockfile, environment, credential, provider-account, training-opt-out, billing, quota, deployment, or cloud changes.

## 9. Frozen contracts and invariants

- Implement the shared `AnalysisProviderAdapter<"mistral">` interface and return the provider-neutral normalized result expected by TASK-011. Do not create a parallel adapter or proposal contract.
- Accept only provider `mistral`, release `mistral-small-free-v1`, exact requested model `mistral-small-2603`, unpaid service tier, and reasoning effort `medium`.
- Use the official `@mistralai/mistralai` SDK through the native server API, never OpenAI compatibility.
- Use one stateless, non-streaming JSON Schema Chat Completions request per adapter invocation. Disable SDK retries so one selected application run causes exactly one provider request.
- Send only server-reconstructed redacted text from exact fixture `CFN-DEMO-001`, version `1.0.0`, data origin `bundled_synthetic`, and the registry-bound canonical digest. Recheck release, tier, origin, case, fixture version, and digest before transport.
- Free Mistral must reject harmless public material, real case material, survivor or client material, private material, user-entered narrative, a wrong digest, an incompatible tier, and every non-bundled origin before provider transmission.
- Enable no tools, files, search, agents, conversations, provider memory, external action, background process, or streaming.
- Request only the shared strict JSON Schema proposal. Never use a prose fallback, partial text parse, or alternate output shape.
- Pass through and honor the supplied `AbortSignal`. An aborted or timed-out request returns the shared safe failure and no proposal.
- Normalize requested and returned model identifiers, release configuration, adapter version, unpaid tier, disclosure version, reasoning effort, provider-transmission state, usage metadata when supplied, and safe request metadata.
- The adapter returns untrusted `ModelAnalysisProposal` data only. It cannot create citations, support, review, dependencies, audit, legal conclusions, gate readiness, or exports.
- Map authentication, permission, payment or service-tier, quota, rate-limit, timeout, temporary-unavailability, refusal, data-policy, and invalid-structured-response failures to shared safe classifications. An unavailable tier maps exactly to `PROVIDER_SERVICE_TIER_UNAVAILABLE`.
- Never expose or log evidence text, quotes, prompts, provider bodies, headers, identifiers, credentials, workspace details, account details, billing details, training settings, or review content.
- The adapter implementation does not make `mistral-small-free-v1` selectable. Runtime admission remains blocked until exact evaluation and deployed-account availability are recorded.
- Never call OpenAI, Gemini, replay, or Mistral a second time after any failure.

## 10. Implementation steps

1. Inspect the integrated adapter interface, exact Mistral registry entry, canonical-input proof, shared JSON Schema, safe errors, installed SDK API, advisory record, and server-only import pattern.
2. Implement exact release, unpaid tier, and fixture-binding validation immediately before the transport boundary.
3. Construct one native stateless Chat Completions request with JSON Schema, reasoning effort `medium`, no prohibited capability, disabled SDK retries, and the supplied abort signal.
4. Parse only the shared structured result and normalize success provenance and usage metadata.
5. Normalize documented Mistral operational, service-tier, policy, refusal, and structure failures into shared safe errors without leaking raw diagnostics.
6. Add focused transport-mock tests for all PROVIDER-MISTRAL checks, exact one-call behavior, fixture and tier blocking, request shape, abort, error mapping, normalized provenance, and no fallback.
7. Run the exact verification commands, inspect the diff for unowned files and sensitive values, and prepare the required handoff.

## 11. Acceptance criteria

- PROVIDER-MISTRAL-01 proves the exact registry configuration: `mistral-small-free-v1`, `mistral-small-2603`, unpaid tier, medium reasoning, and native adapter.
- PROVIDER-MISTRAL-02 proves one stateless non-streaming Chat Completions request with the shared strict JSON Schema and no tool, file, search, agent, conversation, memory, background, or external-action capability.
- PROVIDER-MISTRAL-03 proves a schema-valid response normalizes to the same provider-neutral proposal contract used by the other live adapters.
- PROVIDER-MISTRAL-04 proves SDK retries are disabled and one invocation makes exactly one mocked provider request.
- PROVIDER-MISTRAL-05 proves authentication, permission, payment or tier, quota, rate-limit, timeout, temporary-unavailability, refusal, and invalid-structure failures map to safe codes, including exact `PROVIDER_SERVICE_TIER_UNAVAILABLE` for an unavailable tier.
- PROVIDER-MISTRAL-06 proves wrong fixture, digest, origin, release, or service tier is rejected before mock transport and yields the matching safe policy failure.
- The captured valid request contains approved canonical redacted synthetic content only and no raw PDF, original seeded identifier, browser raw text, API key, endpoint override, or prohibited capability.
- A pre-aborted signal makes no provider call. An abort during the request stops the call and returns no partial proposal.
- Schema-invalid, empty, incomplete, or prose-only output returns no partial proposal or prose fallback.
- Complete normalized provenance includes requested and returned model, release, adapter, unpaid tier, medium reasoning, disclosure, transmission, and usage metadata when supplied.
- The adapter never changes registry admission, retries, calls another provider, enters replay, or merges outputs.
- The module remains server-only, all tests are mocked and synthetic, and no file outside Section 6 changes.

## 12. Verification commands

```text
npx vitest run tests/unit/ai/mistral-adapter.test.ts
npm run typecheck
```

Both commands must pass. Do not weaken an assertion, delete a failure case, or hide a failure.

## 13. Manual checks

1. Inspect the captured valid mock request and confirm the exact snapshot, unpaid tier, medium reasoning, strict JSON Schema, non-streaming behavior, disabled retries, one call, and absence of every prohibited Mistral capability.
2. Attempt transport with a wrong fixture digest, wrong data origin, wrong case ID, moving model alias, and paid service tier. Confirm each fails before the mock Mistral method is called.
3. Trigger authentication, permission, payment or tier, quota, rate-limit, timeout, temporary-unavailability, refusal, and invalid-response mocks. Confirm the tier case is exactly `PROVIDER_SERVICE_TIER_UNAVAILABLE` and no raw diagnostic escapes.
4. Abort before invocation and during the pending mock, then return prose-only and schema-invalid responses. Confirm none produces a partial proposal, retry, alternate-provider call, or replay action.
5. Inspect normalized provenance and confirm it contains the exact requested and returned model fields, adapter version, unpaid tier, medium reasoning, disclosure version, transmission state, and supplied usage.
6. Inspect the final diff and confirm it contains only the two files in Section 6 and no credential, real case data, raw provider response, unsupported opt-out claim, or registry-admission change.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Exact commit message: `feat: add Mistral analysis adapter`

## 15. Handoff requirements

- Report `Task: TASK-014` and outcome as Complete, Partial, or Blocked.
- List the two changed files.
- Summarize exact snapshot enforcement, unpaid fixture enforcement, native request construction, disabled retries, one-call behavior, strict output parsing, abort handling, safe errors, and normalized provenance.
- State how advisory review, synthetic-only processing, no tools, no fallback, no registry admission, untrusted output, and conservative free-tier handling were preserved.
- Report each Section 12 command and its pass or fail result.
- Report every Section 13 manual check and its result.
- Identify any unrun check, blocker, assumption, or coordinator follow-up.
- Include a commit hash only when the opening prompt authorized a commit and the exact message was used. Otherwise report `Not committed`.

## 16. Stop conditions

Stop and report to the coordinator if:

- TASK-011 is not integrated, the base revision is not identified, the shared adapter interface or exact registry entry is missing, or the installed Mistral SDK version or advisory check is unrecorded.
- The installed SDK version is affected by GHSA-jgg6-4rpr-wfh7 on the used path and no coordinator-approved safe version is integrated.
- Implementation requires a write outside Section 6, including shared AI files, contracts, prompt, registry, route, packages, lockfile, environment template, or test configuration.
- A new dependency, environment variable, Mistral model, alias, release, endpoint, paid tier, response contract, retry, tool, streaming path, data origin, provider, replay behavior, or recovery rule appears necessary.
- The exact snapshot is unavailable to the deployed account, or actual free-tier training-use, retention, or service facts needed for a claim are missing, stale, or conflict with the authoritative record.
- Safe mapping would require exposing a raw provider message, header, body, account, workspace, billing, training, key fragment, or request content.
- A live provider call, real credential, provider-account or opt-out action, billing or quota action, deployment change, or cloud setting would be required.
- Existing user changes overlap the owned files and cannot be preserved safely.
