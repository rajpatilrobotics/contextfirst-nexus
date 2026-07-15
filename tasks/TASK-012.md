# TASK-012: OpenAI analysis adapter

## 1. Task metadata

- Status: Pending until coordinator marks ready.
- Stage: providers.
- Wave: 6.
- Risk: high.
- Suggested branch: `task/012-openai-adapter`.
- Depends on: TASK-011.
- Graph outcome: Implement one server-only Responses API call using the frozen OpenAI release, medium reasoning, strict structured output, store false, no tools, disabled hidden retries, abort handling, and normalized provenance.

## 2. Goal

Implement the native server-only OpenAI adapter that turns one canonical redacted input into one provider-neutral `ModelAnalysisProposal` using exactly the frozen OpenAI release and controls.

## 3. Why this task exists

OpenAI is the initial accuracy-first live baseline, but it must remain behind the same narrow request, safety, provenance, and failure boundary as every other provider. This adapter isolates OpenAI-specific SDK behavior without letting it set application truth or trigger fallback.

## 4. Dependencies and base requirement

- TASK-011 must be integrated with the shared adapter interface, registry entry, prompt, canonical input, request policy, safe errors, safe logging, and server-only exports.
- TASK-001 and TASK-002 are transitive prerequisites through TASK-011. The exact installed official OpenAI SDK version must be present in the lockfile and recorded in `decision-log.md`.
- Start from the coordinator branch after TASK-011 is integrated. The opening coordinator prompt must identify the base revision. Stop if the dependency state, SDK record, or base revision is missing or inconsistent.
- Verification uses a mocked SDK transport and the bundled synthetic canonical input. It must not use a real key or make a live request.

## 5. Required context

Read these sources before editing, in this order:

- `AGENTS.md`: Full.
- `tasks/TASK-012.md`: Full.
- `PLANS.md`: Full.
- `TASK_GRAPH.yaml`: Full, with special attention to TASK-012 ownership and verification.
- `docs/CONTEXT_INDEX.md`: Full.
- `PROJECT_BRIEF.md`: Sections `End-to-end prototype flow`, `Prototype scope`, and `Product principles`.
- `docs/SAFETY_AND_DATA.md`: Full.
- `docs/CONTRACTS.md`: Sections 2, 4.7, 16, 22, 23, 26, and 27.
- `docs/ARCHITECTURE.md`: Sections 4, 7, 8.4, 8.5, 9, 12 through 15, and 18.
- `docs/MODEL_ROUTING.md`: Sections 2, 5 through 11, and 13, especially Section 8.1.
- `docs/TESTING_AND_EVALUATION.md`: Sections 6, 7.2, 11, 12, 14.1, 14.4, 18, and 19.
- `docs/SOURCE_REGISTER.md`: TECH-001 through TECH-004, TECH-024, and Section 9.
- `decision-log.md`: DEC-020, DEC-021, DEC-025 through DEC-029, plus the exact installed OpenAI SDK record.

## 6. Exclusive write scope

- `lib/ai/server/adapters/openai.ts`
- `tests/unit/ai/openai-adapter.test.ts`

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

- Shared AI contracts, registry, prompt, canonical reconstruction, safe errors, safe logging, or environment template.
- Gemini or Mistral adapters.
- `/api/analyze`, orchestration, post-validation, recovery options, case-state mutation, provider UI, evaluation admission, or exports.
- Any second request, SDK retry, same-provider retry workflow, cross-provider fallback, replay substitution, streaming, tool, file, background, conversation, browsing, search, or memory feature.
- Package, lockfile, environment, credential, provider-account, billing, quota, deployment, or cloud changes.

## 9. Frozen contracts and invariants

- Implement the shared `AnalysisProviderAdapter<"openai">` interface and return the provider-neutral normalized result expected by TASK-011. Do not create a parallel adapter or proposal contract.
- Accept only the server-constructed `CanonicalAnalysisInput` and the exact registry configuration with provider `openai`, release `openai-quality-v1`, requested model `gpt-5.6-sol`, paid tier, and reasoning effort `medium`.
- Use the official OpenAI SDK and Responses API through a server-only module.
- Make exactly one non-streaming provider request for one adapter invocation. Disable SDK hidden retries.
- Set `store: false`. Enable no tools, background mode, conversation state, previous response, browsing, file search, files, memory, or external action.
- Request the shared strict structured proposal schema only. Never use a prose fallback, partially parse text, or accept an unvalidated alternate shape.
- Pass through and honor the supplied `AbortSignal`. An aborted or timed-out call returns the shared safe failure and no proposal.
- Normalize requested and returned model identifiers, release configuration, adapter version, service tier, disclosure version, reasoning effort, provider-transmission state, token usage when supplied, and safe request metadata into the shared result.
- The adapter returns an untrusted `ModelAnalysisProposal`. It cannot create citations, support status, review status, dependency results, audit events, legal conclusions, gate readiness, or exports.
- Map authentication, quota, rate-limit, timeout, unavailability, refusal, and invalid structured response to the shared safe classifications without returning raw provider messages, bodies, headers, request content, account details, or stack traces.
- Never log canonical evidence text, quotes, prompts, provider response bodies, identifiers, credentials, or review content.
- Never call Gemini, Mistral, replay, or OpenAI a second time after any failure.

## 10. Implementation steps

1. Inspect the integrated shared adapter interface, registry entry, prompt output, normalized result, safe-error helpers, installed SDK API, and existing server-only import pattern.
2. Implement exact release validation and construct one strict Responses API request from canonical input.
3. Disable SDK retries, set `store: false`, omit all prohibited capabilities, and pass the supplied abort signal.
4. Parse only the shared strict structured result and normalize success provenance and usage.
5. Normalize documented OpenAI failure classes into shared safe errors without leaking raw diagnostics.
6. Add focused transport-mock tests for request shape, exact one-call behavior, strict output, abort, every required failure class, normalized provenance, and no fallback.
7. Run the exact verification commands, inspect the diff for unowned files and sensitive values, and prepare the required handoff.

## 11. Acceptance criteria

- A valid invocation makes exactly one mocked Responses API call using `gpt-5.6-sol`, reasoning effort `medium`, strict shared structured output, `store: false`, non-streaming behavior, and disabled SDK retries.
- The captured request contains only canonical redacted input and shared prompt content, with no raw PDF, original identifier, browser-supplied raw text, API key, endpoint override, tool, file, search, conversation, previous response, background mode, or memory field.
- A schema-valid provider response returns exactly one provider-neutral `ModelAnalysisProposal` and complete normalized OpenAI provenance, including returned model and token usage when the mock supplies them.
- Schema-invalid, empty, incomplete, or prose-only output fails safely and returns no partial proposal or prose fallback.
- A pre-aborted signal makes no provider call. An abort during the request stops the call and maps to the shared timeout or safe abort classification required by the integrated boundary.
- Authentication, quota, rate-limit, timeout, provider-unavailable, refusal, and invalid-structured-response mocks map to the exact shared safe classifications and expose no raw diagnostic content.
- The adapter never retries, calls another provider, enters replay, or merges output after any success or failure.
- Tests prove the adapter cannot emit final citation, support, review, audit, gate, legal-status, or export fields.
- The module remains server-only, all tests are mocked and synthetic, and no file outside Section 6 changes.

## 12. Verification commands

```text
npx vitest run tests/unit/ai/openai-adapter.test.ts
npm run typecheck
```

Both commands must pass. Do not weaken an assertion, delete a failure case, or hide a failure.

## 13. Manual checks

1. Inspect the captured valid mock request and confirm the exact model, medium reasoning, strict schema, `store: false`, disabled retries, non-streaming behavior, and absence of every prohibited capability.
2. Inspect the captured input and confirm it contains approved redacted canonical text only and no raw PDF bytes, original seeded identifier, free-text Purpose field, key, or endpoint override.
3. Trigger each mocked operational failure and confirm the returned object contains only the shared safe classification, code, and allowed provenance, with no raw provider body, header, account detail, or stack trace.
4. Abort before invocation and during the pending mock. Confirm the first makes zero calls and the second terminates without a proposal.
5. Return prose-only and schema-invalid mock responses. Confirm neither produces a candidate, citation, partial proposal, retry, alternate-provider call, or replay action.
6. Inspect the final diff and confirm it contains only the two files in Section 6 and no credential, real case data, raw provider response, or unsupported provider claim.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Exact commit message: `feat: add OpenAI analysis adapter`

## 15. Handoff requirements

- Report `Task: TASK-012` and outcome as Complete, Partial, or Blocked.
- List the two changed files.
- Summarize exact request construction, one-call behavior, strict output parsing, abort handling, safe error mapping, and normalized provenance.
- State how server-only secrets, `store: false`, no tools, no retries, no fallback, untrusted output, and single-provider behavior were preserved.
- Report each Section 12 command and its pass or fail result.
- Report every Section 13 manual check and its result.
- Identify any unrun check, blocker, assumption, or coordinator follow-up.
- Include a commit hash only when the opening prompt authorized a commit and the exact message was used. Otherwise report `Not committed`.

## 16. Stop conditions

Stop and report to the coordinator if:

- TASK-011 is not integrated, the base revision is not identified, the shared adapter interface or registry entry is missing, or the exact installed OpenAI SDK version is unrecorded.
- Implementation requires a write outside Section 6, including shared AI files, contracts, prompts, registry, route, packages, lockfile, environment template, or test configuration.
- A new dependency, environment variable, model, release, endpoint, response contract, retry, tool, streaming path, provider, replay behavior, or recovery rule appears necessary.
- The installed SDK cannot express the frozen strict structured, `store: false`, non-streaming, no-tools, one-attempt request without changing a shared contract.
- Safe mapping would require exposing a raw provider message, header, body, account detail, key fragment, or request content.
- A live provider call, real credential, provider-account action, billing or quota action, deployment change, or cloud setting would be required.
- Existing user changes overlap the owned files and cannot be preserved safely.
