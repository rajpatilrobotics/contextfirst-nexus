# TASK-011: Shared AI boundary and provider registry

## 1. Task metadata

- Status: Pending until coordinator marks ready.
- Stage: providers.
- Wave: 5.
- Risk: high.
- Suggested branch: `task/011-shared-ai-boundary`.
- Depends on: TASK-001, TASK-002, TASK-003, TASK-006.
- Graph outcome: Implement the static provider registry and fail-closed version-controlled admission record, disclosures, canonical server reconstruction, prompt, request policy, safe errors, safe logging, exact fixture binding, and environment template.

## 2. Goal

Implement the server-only shared AI boundary that admits only frozen provider releases and the exact bundled fixture, creates a typed static admission record with every live release initially `not_evaluated`, derives registry evaluation and selectability from that record, reconstructs minimum-necessary redacted input from canonical server data, exposes safe provider metadata, and supplies one strict prompt and error policy to every live adapter.

## 3. Why this task exists

Provider adapters and the analysis route need one common, inspectable control layer. Without it, browser input, environment values, raw source text, provider-specific behavior, or hidden recovery could bypass fixture, privacy, disclosure, or provenance rules.

## 4. Dependencies and base requirement

- TASK-001 must be integrated with the approved provider SDKs, `server-only`, test tooling, package lock, and exact installed SDK versions recorded in `decision-log.md`.
- TASK-002 must be integrated so provider, disclosure, request, response, error, run, and fixture-binding contracts are canonical.
- TASK-003 must be integrated so the exact `CFN-DEMO-001` fixture manifest, version, segment allowlist, and canonical digest can be loaded server-side.
- TASK-006 must be integrated so canonical redaction mapping, mask validation, allowlisted replacement tokens, and leak scanning are available.
- Start from the coordinator branch after all four dependencies are integrated. The opening coordinator prompt must identify the base revision. Stop if the dependency state, SDK record, or base revision is missing or inconsistent.
- No credential, provider-account change, live request, or cloud configuration is required to implement or verify this task.

## 5. Required context

Read these sources before editing, in this order:

- `AGENTS.md`: Full.
- `tasks/TASK-011.md`: Full.
- `PLANS.md`: Full.
- `TASK_GRAPH.yaml`: Full, with special attention to TASK-011 ownership and verification.
- `docs/CONTEXT_INDEX.md`: Full.
- `PROJECT_BRIEF.md`: Sections `The proposed solution`, `End-to-end prototype flow`, `Prototype scope`, and `Product principles`.
- `docs/SAFETY_AND_DATA.md`: Full.
- `docs/CONTRACTS.md`: Sections 2, 4.7, 5 through 9, 16, 18, 22, 23, 25, 26, and 27.
- `docs/ARCHITECTURE.md`: Sections 3 through 5, 7, 8.4, 8.5, 9, and 12 through 16.
- `docs/MODEL_ROUTING.md`: Full.
- `docs/DEMO_AND_FIXTURES.md`: Sections 3 through 7, 11, 14, 15, and 16.
- `docs/TESTING_AND_EVALUATION.md`: Sections 5 through 7.2, 11, 12, 14.1, 14.4, 18, 19, and 22.
- `docs/SOURCE_REGISTER.md`: TECH-001 through TECH-004, TECH-014 through TECH-036, and Section 9.
- `decision-log.md`: DEC-004, DEC-011 through DEC-016, DEC-020 through DEC-029, DEC-036, DEC-042, and DEC-043, plus the implementation-time SDK and provider-fact records.

## 6. Exclusive write scope

- `.env.example`
- `prompts/`
- `lib/ai/server/index.ts`
- `lib/ai/server/types.ts`
- `lib/ai/server/admission.ts`
- `lib/ai/server/registry.ts`
- `lib/ai/server/canonical-input.ts`
- `lib/ai/server/request-policy.ts`
- `lib/ai/server/errors.ts`
- `lib/security/provider-boundary.ts`
- `lib/security/safe-logging.ts`
- `tests/unit/ai/shared/`

No other path may be created, modified, renamed, generated, or deleted by this task.

## 7. Read-only context allowed

- `lib/contracts/`
- `lib/fixtures/`
- `lib/redaction/`
- `fixtures/cases/`
- `fixtures/evals/definitions/`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vitest.config.ts`
- Existing server-only dependency and test setup created by TASK-001.
- All authoritative Markdown documents listed in Section 5.

Read-only inspection does not grant permission to repair, regenerate, or reformat these paths.

## 8. Out of scope

- OpenAI, Gemini, or Mistral adapter implementation owned by TASK-012, TASK-013, and TASK-014.
- `/api/analyze`, orchestration, post-validation, response normalization, or recovery generation owned by TASK-015.
- Provider selection, disclosures, recovery UI, system card UI, audit UI, or Safety Lab UI.
- Deterministic replay execution, checkpoint loading, case-state mutation, or export creation.
- Runtime registry admission based on unmeasured results, provider recommendation, live evaluation, environment values, provider responses, or dynamic loading of evaluation reports.
- Any additional model, provider, endpoint, environment variable, tool, file upload, search, browsing, agent, memory, streaming path, retry chain, or fallback.
- Package, lockfile, framework configuration, deployment, billing, quota, firewall, credential-store, or production-setting changes.

## 9. Frozen contracts and invariants

- Import canonical provider contracts from `lib/contracts/`. Do not create weaker local release, disclosure, request, response, run, or error shapes.
- The static registry contains exactly `openai-quality-v1`, `gemini-quality-v1`, `mistral-small-free-v1`, and `prepared-replay-v1` in display order OpenAI `1`, Gemini `2`, Mistral `3`, replay `4`.
- `lib/ai/server/admission.ts` contains the typed version-controlled static admission record for the three live release configurations. Every live release begins with `evaluationStatus: not_evaluated`, null evaluation report identity and digest, and fail-closed deployed-account availability where applicable.
- The three live registry entries use `LiveProviderReleaseRegistryEntry` and reference their exact admission record. `prepared-replay-v1` uses `ReplayReleaseRegistryEntry`, contains no `ProviderReleaseAdmissionRecord`, and reports `evaluationStatus: not_applicable` with local deterministic provenance.
- TASK-011 owns the initial creation of `lib/ai/server/admission.ts`. After TASK-011 and TASK-016 are integrated, ownership transfers exclusively to TASK-026 for the reviewed static evidence handoff. TASK-011 and TASK-026 must never be active concurrently.
- The registry derives each live release evaluation status and selectability from that static admission record plus exact recomputed evaluated-configuration equality and digest. The digest binds provider, release, model, tier, adapter, inference, disclosure, fixture, prompt, schemas, ruleset, and evaluation-definition set. It never promotes admission from an environment value, credential, provider response, runtime evaluation, or dynamically loaded result or report file.
- Missing, incomplete, stale, unknown, or mismatched admission evidence fails closed as `not_evaluated` and non-selectable. A configured or enabled environment state cannot change that result.
- Bind OpenAI to `gpt-5.6-sol`, paid tier, reasoning effort `medium`, `store: false`, and the approved disclosure. Bind Gemini to `gemini-3.5-flash`, unpaid tier, thinking level `medium`, and the unpaid synthetic-only disclosure. Bind Mistral to `mistral-small-2603`, unpaid tier, reasoning effort `medium`, stateless free storage, and the up-to-30-day, no-free-ZDR, training-use disclosure.
- Every registry entry is non-streaming, tool-free, structured-output only, and bound to the one `bundled_synthetic` fixture `CFN-DEMO-001`, fixture version `1.0.0`, and exact canonical digest.
- A live release is selectable only when the exact registry entry is enabled, configured when applicable, has static exact-tier availability, is statically recorded as evaluation-passed for the exact evidence binding, is permitted for the current data origin and fixture binding, and has a current disclosure. Static tier availability is version-controlled registry configuration, never a provider health or quota probe. An environment value or credential cannot admit a release.
- `mistral-small-free-v1` remains non-selectable until its exact snapshot passes evaluation and deployed-account availability is recorded. If the actual training opt-out state is not recorded, do not claim opt-out or enable the release.
- Safe provider projections expose only approved release metadata, availability, disclosure, and selection status. They never expose credentials, key fragments, environment values, endpoints, account, project, billing, quota, or raw provider details.
- The browser can select a frozen release only. Its request carries one complete safe correlated disclosure acknowledgement for that same provider, release, and service tier, but it cannot supply a model, endpoint, API key, reasoning setting, arbitrary service tier, data-use policy, or retry policy.
- Canonical input reconstruction loads allowlisted segment text server-side, verifies the exact case, fixture version, digest, data origin, safe purpose ID and context shape, mask review, leak-scan state, selected segment IDs, mask spans, and allowlisted replacement tokens, then constructs the approved redacted derivative. Active Purpose and authority are enforced by the central browser reducer before transport.
- Reject extra root fields, raw files, raw-text fields, direct identifiers, unexpected URL fields, structural tool-instruction fields, unknown IDs or versions, oversized input, and forged fixture bindings before provider transmission.
- Canonical instruction-like, HTML-like, and URL-like fixture content remains inert untrusted evidence. `D07-P2-S03` remains visible as untrusted `evidence_only` content but cannot support a candidate or export.
- Prompt version is `1.0.0` and has four separated parts: fixed system boundary and prohibited conclusions, requested tasks and shared schema, versioned definitions, and redacted documents serialized as untrusted data. Guidance is not injected as case proof.
- Request policy permits exactly one explicitly selected release call per application run, with no hidden retry, cross-provider fallback, replay substitution, streaming, tools, background work, conversation state, files, browsing, search, memory, or external action.
- Safe errors and logs contain only allowlisted operational metadata. They never contain source text, quotes, identifiers, prompts, model bodies, keys, cookies, exports, review reasons, stack traces, or raw provider diagnostics.
- `.env.example` contains only the frozen names and safe descriptions for `ENABLE_OPENAI_ANALYSIS`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_REASONING_EFFORT`, `ENABLE_GEMINI_ANALYSIS`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_SERVICE_TIER`, `ENABLE_MISTRAL_ANALYSIS`, `MISTRAL_API_KEY`, `MISTRAL_MODEL`, `MISTRAL_SERVICE_TIER`, `MISTRAL_REASONING_EFFORT`, `ENABLE_LIVE_ANALYSIS`, `NEXT_PUBLIC_ENABLE_LIVE_ANALYSIS`, and `NEXT_PUBLIC_ENABLE_DEMO_REPLAY`. It contains no real value or secret, and no credential or API-key variable uses `NEXT_PUBLIC_`.
- Public live analysis remains disabled unless a later explicitly approved cloud and budget action changes deployed settings. A public flag can never enable a server-disabled route.

## 10. Implementation steps

1. Inspect integrated contracts, fixture loaders, redaction APIs, installed SDK versions, and existing server-only boundaries.
2. Implement server-only shared types, the fail-closed static admission record with every live release initially `not_evaluated`, and the static release registry with deterministic safe projections and frozen availability rules derived from that record.
3. Implement provider disclosures and the exact safe `.env.example` template without reading or exposing secret values in public projections.
4. Implement canonical request preflight and server reconstruction from fixture IDs, digest, selected segments, and validated masks.
5. Implement the versioned shared prompt and request policy that every adapter must consume.
6. Implement safe error construction and allowlist-based operational logging helpers.
7. Add focused tests for initial admission state, missing and mismatched evidence, no environment or dynamic-report promotion, registry order, exact release bindings, selectability, projections, fixture and mask rejection, leak scanning, inert embedded instructions, prompt separation, request policy, errors, logs, and environment-template safety.
8. Run the exact verification commands, inspect the diff for unowned files and sensitive values, and prepare the required handoff.

## 11. Acceptance criteria

- The registry contains exactly the four frozen release configurations with the correct provider, model or replay artifact, service tier, inference setting, storage mode, retention setting, adapter version field, disclosure version, fixture binding, and display order. Only the three live entries contain admission records; replay is structurally unable to contain one.
- The typed static admission record contains all three live releases at `not_evaluated` with no report ID or digest, and the registry exposes each as non-selectable regardless of environment configuration.
- Missing, incomplete, stale, or mismatched admission evidence remains `not_evaluated`; no runtime file read, environment value, credential, or provider response can promote evaluation or selectability.
- Mistral is non-selectable until the exact release has an evaluation-passed record and deployed-account availability. Missing actual training-use facts never become an opt-out claim.
- Safe projections correctly distinguish available, disabled, not evaluated, evaluation failed, not configured, service-tier unavailable, deployed-account-release unavailable, and data-policy blocked states without probing a provider. Quota and temporary availability are started-run outcomes, not static capability states.
- No safe projection or error contains a key, secret name, environment value, internal endpoint, account detail, project detail, billing detail, quota detail, or raw provider body.
- A valid canonical request reconstructs only approved redacted text from the exact server fixture and never trusts browser-supplied source text or support classifications.
- Wrong case, fixture version, digest, origin, release, service tier, disclosure, segment, mask span, replacement token, purpose ID or context shape, mask review, leak-scan state, or size fails before a provider call is possible. An active complete Purpose and authority are browser prerequisites before a request is created.
- The server-side declared-identifier scan runs even when the request claims a passed client scan.
- The shared prompt keeps application instructions separate from JSON evidence, carries version `1.0.0`, includes no credential or external capability, and preserves `D07-P2-S03` as inert evidence-only content.
- The request policy represents exactly one selected non-streaming, structured, tool-free call and has no automatic retry, alternate provider, or replay path.
- Safe logging accepts only the frozen operational metadata fields and rejects or redacts prohibited content.
- `.env.example` contains all and only the frozen environment names with safe example settings, blank credential fields, public live analysis disabled, and replay enabled.
- Server-only entry points cannot be imported through a client-safe public surface.
- All tests use mocks and synthetic fixtures. No live provider request occurs and no file outside Section 6 changes.

## 12. Verification commands

```text
npx vitest run tests/unit/ai/shared
npm run typecheck
```

Both commands must pass. Do not weaken an assertion, delete a fixture, or hide a failure.

## 13. Manual checks

1. Inspect the static admission record and safe registry projection in each configured, missing-key, disabled, unevaluated, and data-policy-blocked state. Confirm all live releases start `not_evaluated`, provider order remains OpenAI, Gemini, Mistral, replay, no environment or dynamic result file promotes a release, and no private value appears.
2. Submit a canonical-input test request with a forged digest, unknown segment, invalid mask span, non-allowlisted replacement token, and false client leak-scan claim. Confirm every case fails before a mock adapter can be invoked.
3. Build the valid canonical input and confirm it contains approved redacted derivative text only, no raw PDF bytes, no original identifier, and no browser-supplied free-text purpose or recipient value.
4. Inspect the rendered prompt representation and confirm fixed instructions and untrusted evidence are separate, `D07-P2-S03` remains labelled evidence-only, and no guidance passage is presented as case proof.
5. Inspect `.env.example` and confirm every key field is blank, no secret has a `NEXT_PUBLIC_` prefix, public live analysis is disabled, and no unapproved environment name was added.
6. Pass a sample source quote, prompt, provider body, credential-like value, and review reason through the safe logging helper. Confirm none can enter emitted metadata.
7. Inspect the final diff and confirm it contains only the twelve paths in Section 6 and no credential, real case data, raw provider body, or unsupported provider claim.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Exact commit message: `feat: add shared AI provider boundary`

## 15. Handoff requirements

- Report `Task: TASK-011` and outcome as Complete, Partial, or Blocked.
- List every changed file under the twelve owned paths.
- Summarize static admission, registry derivation, disclosures, canonical reconstruction, prompt, request policy, safe errors, safe logging, fixture binding, and environment-template behavior.
- State how synthetic-only data, exact fixture binding, provider order, no automatic fallback, no tools, server-only secrets, and conservative provider disclosures were preserved.
- Report each Section 12 command and its pass or fail result.
- Report every Section 13 manual check and its result.
- Identify any unrun check, unresolved provider fact, blocker, assumption, or coordinator follow-up.
- Include a commit hash only when the opening prompt authorized a commit and the exact message was used. Otherwise report `Not committed`.

## 16. Stop conditions

Stop and report to the coordinator if:

- Any dependency is not integrated, the base revision is not identified, an installed provider SDK version is unrecorded, or the Mistral SDK version is affected by the registered advisory without an approved resolution.
- Implementation requires a write outside Section 6, including contracts, fixture manifests, packages, lockfiles, adapters, route orchestration, UI, state, or test configuration.
- A new dependency, environment variable, provider, model, release, endpoint, tool, retry, streaming path, data origin, fixture binding, storage mode, or disclosure rule appears necessary.
- The canonical fixture digest, provider account tier, training-use setting, retention limitation, evaluation state, or service availability needed for an enabled claim is missing or conflicts with the authoritative records. Missing admission evidence alone must remain safely `not_evaluated` rather than trigger an invented enabled claim.
- The required behavior would trust browser text, expose a secret, permit unapproved data, enable Mistral before admission, add automatic fallback, merge runs, or weaken prompt, leak, or safe-error controls.
- A live provider call, credential placement, provider-account action, billing or quota action, firewall or Vercel change, deployment change, or public live enablement would be required.
- Existing user changes overlap the owned paths and cannot be preserved safely.
