# Model Routing and Provider Resilience

## 1. Status and purpose

This document freezes the P0 model-provider strategy for ContextFirst Nexus. It defines how the application selects a live provider, how it recovers when a provider is unavailable, and how every provider is held to the same product, safety, citation, and evaluation contracts.

It does not claim that any provider is accurate enough for this product. Evaluation produces evidence only. A provider becomes selectable only after a separate reviewed handoff records a matching passed status in the version-controlled, fail-closed static admission registry.

The controlling order is:

1. `docs/SAFETY_AND_DATA.md`
2. `docs/CONTRACTS.md`
3. `docs/ARCHITECTURE.md`
4. This document

## 2. P0 decision

P0 defines three live provider adapters and one local replay path:

| Release configuration | Provider | Model | Role | P0 status |
|---|---|---|---|---|
| `openai-quality-v1` | OpenAI | `gpt-5.6-sol` | Accuracy-first baseline | Evaluation and reviewed static admission required |
| `gemini-quality-v1` | Google Gemini | `gemini-3.5-flash` | Free-tier quality alternative and provider-outage recovery | Evaluation and reviewed static admission required |
| `mistral-small-free-v1` | Mistral | `mistral-small-2603` | Free-tier live recovery candidate after Gemini | Static admission and deployed-account availability required; initially unselectable |
| `prepared-replay-v1` | Local fixture | Frozen replay output | Demo continuity when no live provider is used | Deterministic and visibly labelled |

The interface lets the practitioner choose a selectable, statically admitted live-provider release before analysis. The browser switches a release configuration, never an API key. Keys remain server-side.

OpenAI is the initial baseline, not a permanent winner. Gemini or Mistral may become recommended only if the exact release configuration passes the same development and fresh held-out assurance gates, completes the reviewed static admission handoff, and performs better for the project task. The decision must be recorded before the recommendation changes. Mistral remains unselectable until `mistral-small-free-v1` has a matching passed static admission record and a coordinator-recorded `available` deployed-account release status.

## 3. Why Gemini 3.5 Flash is the P0 alternative

As verified on 2026-07-15, Google documents `gemini-3.5-flash` as a stable model with structured outputs, text and PDF support, a 1,048,576-token input limit, a 65,536-token output limit, and free input and output usage within changeable project quotas.

It is the selected initial P0 alternative because it combines:

- a stable model identifier;
- constrained structured output;
- a first-party TypeScript SDK;
- enough context for the synthetic packet;
- a continuing free API tier at the time of verification;
- a direct provider relationship without an aggregator.

Free quota is not an availability guarantee. Google exposes the active project limits in AI Studio and may change them. Multiple keys under the same project do not create independent quota.

The unpaid Gemini terms permit Google to use submitted content and generated responses to improve products, and human reviewers may process that content. P0 contains only bundled synthetic material, so the unpaid profile is permitted only for the exact allowlisted synthetic fixture. Any future real-data pilot requires a separately approved paid provider configuration and vendor review.

The selected-provider facts are registered as TECH-014 through TECH-024 in `docs/SOURCE_REGISTER.md`.

### 3.1 Why Mistral Small 4 is the third P0 candidate

Mistral Small 4 adds a direct, cost-conscious live option without relying on an aggregator. P0 freezes provider ID `mistral`, release configuration `mistral-small-free-v1`, exact model `mistral-small-2603`, unpaid service tier, and reasoning effort `medium`. It uses the native `MistralAnalysisAdapter` and official `@mistralai/mistralai` SDK through one stateless JSON Schema Chat Completions request.

The Mistral adapter disables SDK retries and makes exactly one bounded request for a selected run. It enables no tools, files, search, agents, conversations, provider memory, or external actions. It sends only the server-reconstructed redacted text for the exact allowlisted bundled fixture.

Mistral's free service is not a privacy substitute for a reviewed paid deployment. Current provider documentation permits free-service input and output to be used for training unless the account opts out, describes retention of API request data for up to 30 days for safety and abuse monitoring, and does not make zero data retention available on the free tier. The disclosure shows the actual verified training-use or opt-out state. A verified training opt-out does not remove the retention limitation or create zero data retention. The unpaid configuration is prohibited for real, private, client, or survivor material.

Selected Mistral references are the [Small 4 model card](https://docs.mistral.ai/models/model-cards/mistral-small-4-0-26-03), [custom structured-output guidance](https://docs.mistral.ai/studio-api/conversations/structured-output/custom), [official TypeScript SDK](https://github.com/mistralai/client-ts), [free API setup](https://docs.mistral.ai/getting-started/quickstarts/studio/activate-and-generate-api-key), [training opt-out guidance](https://help.mistral.ai/en/articles/455207-can-i-opt-out-of-my-input-or-output-data-being-used-for-training), and [zero data retention guidance](https://help.mistral.ai/en/articles/347612-can-i-activate-zero-data-retention-zdr).

The selected Mistral facts are registered as TECH-025 through TECH-036 in `docs/SOURCE_REGISTER.md`.

## 4. Broader provider research

The following providers were screened using current official documentation. This is an architecture-fit shortlist, not a general intelligence ranking. Provider marketing benchmarks are not a substitute for the project evaluation set.

| Candidate | Useful property | Reason it is not added to P0 now |
|---|---|---|
| Cerebras GLM 4.7, `zai-glm-4.7` | Free allowance, very fast inference, strict JSON Schema, in-memory processing | Preview status and unproven quote fidelity keep it outside the admitted P0 live-provider set |
| Anthropic Claude Sonnet 5 | Strong paid quality candidate, 1M context, guaranteed structured output | No continuing free API allowance, so it does not solve the requested cost fallback |
| xAI Grok 4.5 | Strict structured output and large context | Paid API, no documented continuing free allowance, and no P0 advantage demonstrated |
| Groq Qwen 3.6 27B | Free allowance and high speed | Preview model and no strict response-schema guarantee for this model |
| Cloudflare Workers AI Kimi K2.6 | Free daily allowance and TypeScript platform support | JSON Schema compliance is not guaranteed and another platform adds operational complexity |
| OpenRouter free routing | Access to multiple free models | Downstream provider and model availability can change; random routing is unacceptable for evidence processing |
| DeepSeek V4 | Extremely low price and long context | JSON mode is not strict schema enforcement, empty output is documented, and current data terms are a poor fit for this domain |

Cerebras remains the first reserve evaluation candidate. It is not implemented, shown in the selection list, or offered by the recovery interface until a decision-log entry, the full assurance suite, and a reviewed static handoff admit an exact release configuration.

### 4.1 Official screening sources

The remaining research-only sources are registered as SCREEN-TECH-002 through SCREEN-TECH-008 in `docs/SOURCE_REGISTER.md`. Mistral is no longer a screening-only entry; its controlling selected-provider sources are TECH-025 through TECH-036.

- Cerebras: [GLM 4.7 guidance](https://inference-docs.cerebras.ai/resources/glm-47-migration), [structured outputs](https://inference-docs.cerebras.ai/capabilities/structured-outputs), and [rate limits](https://inference-docs.cerebras.ai/support/rate-limits)
- Anthropic: [Claude Sonnet 5](https://platform.claude.com/docs/en/about-claude/models/whats-new-sonnet-5) and [structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- xAI: [Grok 4.5](https://docs.x.ai/developers/models/grok-4.5) and [structured outputs](https://docs.x.ai/developers/model-capabilities/text/structured-outputs)
- Groq: [supported models](https://console.groq.com/docs/models), [structured outputs](https://console.groq.com/docs/structured-outputs), and [rate limits](https://console.groq.com/docs/rate-limits)
- Cloudflare: [Kimi K2.6](https://developers.cloudflare.com/workers-ai/models/kimi-k2.6/), [JSON mode](https://developers.cloudflare.com/workers-ai/features/json-mode/), and [pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- OpenRouter: [free limits](https://openrouter.ai/docs/api/reference/limits), [structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs), and [free router](https://openrouter.ai/docs/guides/routing/routers/free-router)
- DeepSeek: [models and pricing](https://api-docs.deepseek.com/quick_start/pricing/), [JSON mode](https://api-docs.deepseek.com/guides/json_mode/), and [privacy policy](https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html)

## 5. Provider-neutral boundary

Every live adapter implements one server-only interface:

```ts
interface AnalysisProviderAdapter<P extends LiveProviderId> {
  providerId: P;
  analyze(
    input: CanonicalAnalysisInput,
    configuration: Extract<
      LiveProviderReleaseConfiguration,
      { providerId: P }
    >,
    signal: AbortSignal
  ): Promise<NormalizedProviderResult>;
}
```

P0 implementations are:

- `OpenAIAnalysisAdapter`;
- `GeminiAnalysisAdapter`;
- `MistralAnalysisAdapter`.

Deterministic replay is separate from live provider adapters because replay is not a model request. Its local command supplies only frozen trusted bundle ID `REPLAY-CFN-DEMO-001-V1`; the prepared checkpoint supplies only `DEMO-CHECKPOINT-REVIEW`. The compile-time bundled registry, not browser data, session storage, environment selection, a URL, or provider output, resolves either artifact and enforces the versioned single-run contracts before activation.

All three adapters receive the same server-reconstructed, minimum-necessary, redacted fixture input. All three return the same provider-neutral `ModelAnalysisProposal`. Provider output cannot directly create reviewed candidates, final citations, support status, review status, an export gate, or an export.

Only repeated exact-codepoint occurrences inside one eligible canonical segment may create a reviewable ambiguous citation. Multiple normalized-only matches and all unsafe ambiguity are quarantined. A reviewable ambiguous citation can change validity only through the typed browser `resolve_citation` command. The central reducer recomputes the selected exact range, updates canonical case state, and appends the resolution decision and audit event. A provider response or UI component cannot mark a citation valid.

The shared provider schema uses only the conservative JSON Schema subset supported by all three providers. The application then performs the complete Zod parse and deterministic semantic validation. Schema-valid JSON is never treated as evidence of factual, citation, or legal correctness.

## 6. Release configuration registry

The server owns a static allowlist of release configurations and a version-controlled admission record for each live release in `lib/ai/server/admission.ts`. It never accepts an arbitrary provider, model, endpoint, reasoning setting, or admission record from the browser.

The canonical `ProviderReleaseRegistryEntry` union is defined once in Section 4.7 of `docs/CONTRACTS.md` and is consumed unchanged here. Every entry binds fixed display order, exact fixture and digest, inference setting, storage mode, retention setting, structured output, `streamingEnabled: false`, `toolsEnabled: false`, and disclosure version. The three live branches also bind static admission. The replay branch has no live-provider admission and instead binds local deterministic provenance. This document does not define a weaker routing-specific registry shape.

The evaluation harness produces a versioned report and canonical digest but cannot edit runtime admission. A separate reviewed handoff verifies the report identity, digest, release, adapter, settings, fixture, prompt, schemas, ruleset, required runs, and blocking gates before updating the static admission record. A complete valid report with any failed blocking gate maps to `failed`. Missing, incomplete, stale, duplicate, or mismatched evidence maps to fail-closed `not_evaluated`. Environment variables, runtime files, provider responses, credential presence, and account health never promote a release.

Mistral has one additional admission condition. Its static record must include coordinator-recorded `available` deployed-account release status for the exact release. No account detail or evidence content appears in the browser projection.

The safe public projection reports:

- release configuration ID;
- provider and model display name;
- static-admission-derived evaluation and deployed-account availability status for live entries, or explicit not-applicable status for local replay;
- service-tier label;
- actual provider storage or retention setting and its limitation;
- applicable data-flow disclosure;
- whether the configuration may be selected.

It never reports keys, raw environment values, internal endpoints, or provider error bodies. A configured key does not prove provider health.

## 7. Selection and recovery flow

### 7.1 Before analysis

1. The Purpose screen shows the selectable, statically admitted provider choices returned by `GET /api/analyze`.
2. The user selects OpenAI, Gemini, Mistral, or the visibly labelled Bundled deterministic replay, not live AI mode. Options are displayed in that order, with replay always last.
3. A live choice displays its provider, exact model, tier, data flow, retention limitation, training-use disclosure, and last verification date.
4. The user acknowledges that provider-specific disclosure version.
5. The browser dispatches `start_live_analysis`, validates the prerequisites and any locally requested recovery relationship, and creates a memory-only pending record.
6. `POST /api/analyze` receives the strict `AnalyzeRequest`, which contains no `recoveryOfRunId`, and verifies the selected release configuration and acknowledgement before transmission.

The live route is stateless. It does not receive, verify, echo, log, or persist recovery linkage. It returns a terminal live execution result only. The pending request, start command ID, source case revision, and locally derived recovery metadata remain in browser memory and are excluded from `sessionStorage`.

Starting the pending request does not increment `caseRevision`, and other material commands remain blocked until the request is resolved or reset. If the browser receives no parseable response, it records a safe transport failure, clears the matching pending state, preserves the prior active run, and creates no run or recovery link. The remote outcome is shown as unknown and any later attempt is explicit and unlinked.

### 7.2 After a live failure

A failed run remains in the case history. For an eligible operational failure, the interface shows only the actions permitted by the safe error contract:

- retry the same provider when same-provider retry is safe;
- switch to any remaining selectable, statically admitted live provider when cross-provider recovery is allowed and after acknowledging its disclosure;
- choose the bundled deterministic replay when replay recovery is allowed, shown after all eligible live-provider choices.

If configuration or release validation rejects the request before a run starts, the response contains `run: null`. The browser reducer clears the matching pending request, records a safe `analysis_preflight_rejected` audit event, creates no run, and preserves the previously active run. The same eligible recovery choices may be shown.

For a terminal started execution, the browser reducer requires the matching pending command and unchanged source case revision. It validates the recovery relationship against the append-only failed-run history, attaches the locally derived recovery metadata, and appends a separate run. Switching providers never overwrites the failed run, and candidates from different live attempts are never merged.

P0 does not silently switch companies. The display order OpenAI, Gemini, Mistral, and replay is not an attempt chain. Every live switch is an explicit practitioner action that creates a separate linked run. This prevents invisible data-flow changes, surprise costs, and safety-rule shopping while preserving immediate recovery choices when credits, quota, or availability fail.

Replay is never automatic and is never described as live AI.

### 7.3 Failures that permit provider switching

- provider not configured;
- provider disabled;
- provider service tier unavailable;
- quota exhausted;
- rate limited;
- timeout;
- temporary provider unavailability;
- provider authentication failure.

For not-configured, disabled, service-tier, or authentication failures, the interface may offer the remaining selectable, statically admitted live providers in registry order, followed by bundled replay. It offers same-provider retry only after the deployment configuration or service access changes.

### 7.4 Failures that do not trigger a provider recovery suggestion

- invalid or prohibited input;
- privacy leak detection;
- provider refusal;
- prompt-injection propagation;
- prohibited conclusion;
- invalid citation or quote;
- semantically invalid structured output;
- any attempt to bypass a safety result by asking another model.

The user may start a new, separately recorded analysis run after correcting the underlying issue, but the application does not present model switching as a way around a safety rejection.

## 8. Provider-specific rules

### 8.1 OpenAI

- Use the official OpenAI SDK and Responses API.
- Require `store: false`.
- Use no tools, background mode, conversation state, previous response, browsing, file search, or provider memory.
- Request the statically admitted structured response configuration only.
- Record requested and returned model identifiers when returned.

### 8.2 Google Gemini

- Use the official `@google/genai` SDK through a native adapter.
- Use one stateless structured generation request.
- Use no tools, Search, URL context, file upload, caching, background execution, or conversation history.
- Send only server-reconstructed redacted text, not PDF bytes.
- Restrict the unpaid release configuration to `DataOrigin = "bundled_synthetic"` and the exact allowlisted fixture digest.
- Record the model, service tier, provider disclosure version, and usage metadata returned by the provider.

Gemini is not called through OpenAI compatibility. A native adapter keeps provider behavior, metadata, errors, and disclosures explicit.

### 8.3 Mistral

- Use the native `MistralAnalysisAdapter` with the official `@mistralai/mistralai` SDK.
- Freeze provider ID `mistral`, release configuration `mistral-small-free-v1`, requested model `mistral-small-2603`, unpaid service tier, and reasoning effort `medium`.
- Use one stateless, non-streaming JSON Schema Chat Completions request.
- Disable SDK retries so one selected run makes exactly one provider request.
- Use no tools, files, search, agents, conversations, provider memory, or external action capability.
- Send only server-reconstructed redacted text, never PDF bytes or browser-supplied source text.
- Restrict the unpaid release configuration to `DataOrigin = "bundled_synthetic"` and the exact allowlisted fixture digest.
- Record the requested and returned model identifiers, service tier, inference setting, adapter version, provider disclosure version, and returned usage metadata in normalized provenance.

Mistral is not called through OpenAI compatibility. The native adapter preserves provider-specific request controls, error normalization, usage metadata, and disclosure behavior behind the shared application contract.

## 9. Secrets and environment configuration

The later implementation may define:

```text
ENABLE_LIVE_ANALYSIS=false
NEXT_PUBLIC_ENABLE_LIVE_ANALYSIS=false
NEXT_PUBLIC_ENABLE_DEMO_REPLAY=true
ENABLE_OPENAI_ANALYSIS=true
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-sol
OPENAI_REASONING_EFFORT=medium

ENABLE_GEMINI_ANALYSIS=false
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
GEMINI_SERVICE_TIER=unpaid

ENABLE_MISTRAL_ANALYSIS=false
MISTRAL_API_KEY=
MISTRAL_MODEL=mistral-small-2603
MISTRAL_SERVICE_TIER=unpaid
MISTRAL_REASONING_EFFORT=medium
```

Rules:

- `.env.example` contains names and explanations, never real credentials.
- Real values belong only in `.env.local` and approved deployment settings.
- The browser never reads, writes, selects, rotates, or displays an API key.
- P0 uses at most one key per provider.
- The application does not pool multiple accounts or keys, and it does not rotate keys to extend quota, evade a provider limit, or bypass a billing control.
- A configured model environment value must exactly match the release configuration in the static registry.
- Environment values control operational configuration only. An environment change, runtime report file, provider response, credential, or account-health result cannot make an unevaluated provider selectable or recommended.

## 10. Evaluation and admission

Each release configuration is evaluated independently against the same frozen task:

- exact citation validity;
- exact quote fidelity;
- correct preservation of evidence nature;
- required abstention on insufficient and negative evidence;
- conflict and unknown preservation;
- zero accepted instruction propagation;
- no prohibited legal, guilt, credibility, or victim-status conclusion;
- cooperation-pair equality;
- declared identifier removal;
- structured-output conformance;
- deterministic export blocking after post-validation.

The development set is used for prompt and configuration selection. A release configuration is frozen before a fresh held-out assurance run. A held-out failure blocks admission and starts a new release configuration. Held-out results are not reused as tuning data under the same version.

The harness outputs a `ProviderEvaluationAdmissionReport` and canonical digest as review evidence only. It cannot update `lib/ai/server/admission.ts`, registry selectability, or deployment configuration. A separate handoff task verifies every frozen identity and blocking gate, then records `passed`, `failed`, or fail-closed `not_evaluated` in the static admission file. Missing or mismatched evidence remains `not_evaluated`.

A provider may be labelled recommended only when it passes every blocking safety gate and has the strongest measured result for this exact task. Cost and latency break ties after safety and task quality.

## 11. Run and audit visibility

Every live or replay run records in canonical browser case state:

- run ID and the browser-validated recovery source run ID;
- live or replay mode;
- provider and release configuration;
- requested and returned model identifiers;
- service tier and provider disclosure version;
- prompt, response-contract, fixture, and ruleset versions;
- start, completion, and duration;
- safe outcome or failure classification;
- token usage when returned;
- whether any provider transmission occurred.

Logs retain only operational metadata. They never contain document text, quotes, prompts, model response bodies, keys, or provider error bodies.

## 12. Dependency and task ownership

The dependency-bootstrap task is the only task allowed to add `@google/genai` or `@mistralai/mistralai`, update `package.json`, or update the lockfile. It must pin the installed versions later and record them in the decision log before adapter implementation begins.

After shared contracts and the release registry are implemented, OpenAI, Gemini, and Mistral adapter tasks may run in parallel. No adapter task may edit shared contracts, the route orchestration, the static admission registry, or another adapter.

The evaluation task produces evidence only. A later reviewed static-admission handoff owns the version-controlled admission update. The provider selector, recovery UI, system card, and route consume that reviewed state after the handoff is integrated.

## 13. Acceptance criteria

- OpenAI, Gemini, and Mistral are separate server-only adapters behind one application contract.
- The user switches a selectable, statically admitted release configuration, not a key.
- A missing or exhausted provider account does not block explicit selection of another statically admitted live configuration.
- A live-provider outage does not remove the explicit replay path, which remains the last displayed recovery option.
- A failed live run returns no partial candidates.
- Provider switching is explicit, acknowledged, and recorded.
- No live attempt silently switches provider or replay mode.
- Free Gemini accepts only the exact bundled synthetic fixture.
- Free Mistral accepts only the exact bundled synthetic fixture and carries conservative training, 30-day retention, and no-ZDR disclosure.
- `mistral-small-free-v1` remains unselectable until the exact release has a matching passed static admission and coordinator-recorded deployed-account availability.
- Every successful provider result passes the same deterministic validation.
- The system card identifies the selected and attempted providers, and the export identifies the exact source run and provider.
- No provider is described as best before the project evaluation establishes that result.
- `POST /api/analyze` accepts no recovery link and stores no case state. The browser reducer owns the memory-only pending request and locally validates and attaches recovery metadata.
- A preflight rejection creates no run and preserves the previously active run.
- Evaluation reports cannot enable a release. Only the reviewed static admission handoff can change selectability, and missing or mismatched evidence fails closed.
- No environment value, runtime file, provider response, account-health result, or multi-key pool can promote or silently replace a provider release.
