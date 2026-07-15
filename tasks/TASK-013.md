# TASK-013: Gemini analysis adapter

## 1. Task metadata

- Status: Pending until coordinator marks ready.
- Stage: providers.
- Wave: 6.
- Risk: high.
- Suggested branch: `task/013-gemini-adapter`.
- Depends on: TASK-011.
- Graph outcome: Implement one native stateless Gemini structured request, unpaid synthetic-only enforcement, no tools or files, abort handling, safe error mapping, and normalized provenance.

## 2. Goal

Implement the native server-only Gemini adapter that sends one exact allowlisted synthetic canonical input to `gemini-3.5-flash` and returns one provider-neutral `ModelAnalysisProposal` under the shared safety boundary.

## 3. Why this task exists

Gemini is the cost-conscious live alternative, but its unpaid data-use terms require stricter fixture enforcement and clear provenance. A native adapter keeps those controls, errors, and metadata explicit without routing through OpenAI compatibility.

## 4. Dependencies and base requirement

- TASK-011 must be integrated with the shared adapter interface, registry, disclosure, canonical input, request policy, safe errors, safe logging, and server-only exports.
- TASK-001 and TASK-002 are transitive prerequisites through TASK-011. The exact installed official `@google/genai` version must be present in the lockfile and recorded in `decision-log.md`.
- Start from the coordinator branch after TASK-011 is integrated. The opening coordinator prompt must identify the base revision. Stop if the dependency state, SDK record, or base revision is missing or inconsistent.
- Verification uses a mocked native Gemini transport and the bundled synthetic canonical input. It must not use a real key or make a live request.

## 5. Required context

Read these sources before editing, in this order:

- `AGENTS.md`: Full.
- `tasks/TASK-013.md`: Full.
- `PLANS.md`: Full.
- `TASK_GRAPH.yaml`: Full, with special attention to TASK-013 ownership and verification.
- `docs/CONTEXT_INDEX.md`: Full.
- `PROJECT_BRIEF.md`: Sections `End-to-end prototype flow`, `Prototype scope`, and `Product principles`.
- `docs/SAFETY_AND_DATA.md`: Full.
- `docs/CONTRACTS.md`: Sections 2, 4.7, 16, 22, 23, 26, and 27.
- `docs/ARCHITECTURE.md`: Sections 4, 7, 8.4, 8.5, 9, 12 through 15, and 18.
- `docs/MODEL_ROUTING.md`: Sections 2, 3, 5 through 11, and 13, especially Section 8.2.
- `docs/TESTING_AND_EVALUATION.md`: Sections 6, 7.2, 11, 12, 14.1, 14.4, 18, and 19.
- `docs/SOURCE_REGISTER.md`: TECH-014 through TECH-023 and Section 9.
- `decision-log.md`: DEC-020, DEC-022, DEC-025 through DEC-029, plus the exact installed Google GenAI SDK record.

## 6. Exclusive write scope

- `lib/ai/server/adapters/gemini.ts`
- `tests/unit/ai/gemini-adapter.test.ts`

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
- OpenAI or Mistral adapters.
- `/api/analyze`, orchestration, post-validation, recovery options, case-state mutation, provider UI, evaluation admission, or exports.
- Paid Gemini, real or harmless-public data, browser-supplied text, raw PDFs, file upload, Google Search, URL context, caching, conversation history, background work, streaming, tools, or provider memory.
- Any retry, alternate-provider call, automatic fallback, replay substitution, or output merging.
- Package, lockfile, environment, credential, provider-account, billing, quota, deployment, or cloud changes.

## 9. Frozen contracts and invariants

- Implement the shared `AnalysisProviderAdapter<"google_gemini">` interface and return the provider-neutral normalized result expected by TASK-011. Do not create a parallel adapter or proposal contract.
- Accept only the exact registry configuration with provider `google_gemini`, release `gemini-quality-v1`, model `gemini-3.5-flash`, unpaid service tier, and thinking level `medium`.
- Use the official `@google/genai` SDK through its native server API, never an OpenAI-compatible endpoint.
- Make exactly one stateless, non-streaming structured generation request per adapter invocation. No SDK or application retry may create a second request.
- Send only server-reconstructed redacted text from the exact registry-bound `CFN-DEMO-001` fixture, version `1.0.0`, data origin `bundled_synthetic`, and canonical digest. Recheck the release, tier, origin, case, fixture version, and digest before transport.
- Unpaid Gemini must reject harmless public material, real case material, survivor or client material, private material, user-entered narrative, a wrong digest, and any non-bundled origin before provider transmission.
- Enable no tools, Search, URL context, file upload, caching, background execution, conversation history, provider memory, or external action.
- Request only the shared strict structured proposal schema. Never use a prose fallback, partial text parse, or alternate shape.
- Pass through and honor the supplied `AbortSignal`. An aborted or timed-out request returns a shared safe failure and no proposal.
- Normalize requested and returned model identifiers, release configuration, adapter version, unpaid service tier, disclosure version, thinking level, provider-transmission state, usage metadata when supplied, and safe request metadata.
- The adapter returns untrusted `ModelAnalysisProposal` data only. It cannot create citations, support, review, dependencies, audit, legal conclusions, gate readiness, or exports.
- Map authentication, permission, service-tier, quota, rate-limit, timeout, temporary-unavailability, refusal, data-policy, and invalid-structured-response failures to shared safe classifications without exposing raw diagnostics.
- Never log evidence text, quotes, prompts, model bodies, identifiers, credentials, project details, account details, billing details, or review content.
- Never call OpenAI, Mistral, replay, or Gemini a second time after any failure.

## 10. Implementation steps

1. Inspect the integrated adapter interface, Gemini registry entry, canonical-input proof, shared schema, safe errors, installed SDK API, and server-only import pattern.
2. Implement exact unpaid release and fixture-binding validation immediately before the transport boundary.
3. Construct one native stateless structured request with thinking level `medium`, no prohibited capability, and the supplied abort signal.
4. Parse only the shared structured result and normalize success provenance and usage metadata.
5. Normalize documented Gemini operational, policy, refusal, and structure failures into shared safe errors without leaking raw diagnostics.
6. Add focused transport-mock tests for fixture and tier blocking, request shape, one-call behavior, structured output, abort, each required error class, normalized provenance, and no fallback.
7. Run the exact verification commands, inspect the diff for unowned files and sensitive values, and prepare the required handoff.

## 11. Acceptance criteria

- A valid invocation makes exactly one mocked native Gemini request using `gemini-3.5-flash`, thinking level `medium`, the shared strict schema, stateless non-streaming behavior, and no hidden retry.
- The captured request contains only approved canonical redacted synthetic content and no raw PDF, original seeded identifier, browser raw text, API key, endpoint override, tool, Search, URL context, file, cache, conversation, background, or memory field.
- Wrong data origin, case ID, fixture version, canonical digest, release ID, or service tier returns `PROVIDER_DATA_POLICY_BLOCKED` or the matching shared preflight failure before the mock transport is invoked.
- A schema-valid response returns exactly one provider-neutral `ModelAnalysisProposal` and complete Gemini provenance, including returned model and usage metadata when supplied.
- Schema-invalid, empty, incomplete, or prose-only output fails safely and returns no partial proposal or prose fallback.
- A pre-aborted signal makes no provider call. An abort during the request stops the call and maps to the shared timeout or safe abort classification required by the integrated boundary.
- Authentication, permission, service-tier, quota, rate-limit, timeout, temporary-unavailability, refusal, data-policy, and invalid-structure mocks map to exact shared safe classifications with no raw diagnostic content.
- The adapter never retries, calls another provider, enters replay, or merges output after any result.
- Tests prove the adapter cannot emit final citation, support, review, audit, gate, legal-status, or export fields.
- The module remains server-only, all tests are mocked and synthetic, and no file outside Section 6 changes.

## 12. Verification commands

```text
npx vitest run tests/unit/ai/gemini-adapter.test.ts
npm run typecheck
```

Both commands must pass. Do not weaken an assertion, delete a failure case, or hide a failure.

## 13. Manual checks

1. Inspect the captured valid mock request and confirm the exact model, medium thinking, strict schema, stateless behavior, one call, and absence of every prohibited Gemini capability.
2. Attempt transport with a wrong fixture digest, wrong data origin, wrong case ID, and paid service tier. Confirm each fails before the mock Gemini method is called.
3. Inspect the valid captured input and confirm it contains approved redacted canonical text only and no raw PDF bytes, original seeded identifier, browser free text, key, project detail, or endpoint override.
4. Trigger each mocked operational and policy failure and confirm the result contains only the shared safe classification, code, and allowed provenance, with no raw body, header, account, billing, project, or stack detail.
5. Abort before invocation and during the pending mock, then return prose-only and schema-invalid responses. Confirm none produces a partial proposal, retry, alternate-provider call, or replay action.
6. Inspect the final diff and confirm it contains only the two files in Section 6 and no credential, real case data, raw provider response, or unsupported unpaid-service claim.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Exact commit message: `feat: add Gemini analysis adapter`

## 15. Handoff requirements

- Report `Task: TASK-013` and outcome as Complete, Partial, or Blocked.
- List the two changed files.
- Summarize unpaid fixture enforcement, native request construction, one-call behavior, strict output parsing, abort handling, safe errors, and normalized provenance.
- State how synthetic-only processing, native SDK use, no tools, no retries, no fallback, untrusted output, and conservative unpaid-service handling were preserved.
- Report each Section 12 command and its pass or fail result.
- Report every Section 13 manual check and its result.
- Identify any unrun check, blocker, assumption, or coordinator follow-up.
- Include a commit hash only when the opening prompt authorized a commit and the exact message was used. Otherwise report `Not committed`.

## 16. Stop conditions

Stop and report to the coordinator if:

- TASK-011 is not integrated, the base revision is not identified, the shared adapter interface or registry entry is missing, or the exact installed `@google/genai` version is unrecorded.
- Implementation requires a write outside Section 6, including shared AI files, contracts, prompt, registry, route, packages, lockfile, environment template, or test configuration.
- A new dependency, environment variable, Gemini model, release, endpoint, paid tier, response contract, retry, tool, streaming path, data origin, provider, replay behavior, or recovery rule appears necessary.
- The installed SDK cannot express the frozen native stateless strict structured, no-tools, one-attempt request without changing a shared contract.
- Unpaid data-use or retention facts needed for a claim are missing, stale, or conflict with the authoritative record.
- Safe mapping would require exposing a raw provider message, header, body, account, billing, project, key fragment, or request content.
- A live provider call, real credential, provider-account action, billing or quota action, deployment change, or cloud setting would be required.
- Existing user changes overlap the owned files and cannot be preserved safely.
