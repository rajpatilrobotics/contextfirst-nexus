# ContextFirst Nexus Decision Log

## 1. Purpose

This log records frozen product and technical decisions so parallel Codex tasks do not reopen them independently.

It is not proof that a feature is implemented. Higher-authority documents listed in `AGENTS.md` control if this summary becomes stale or conflicts with them.

## 2. Decision protocol

Each decision has one of these states:

- Proposed: under review and not available for implementation.
- Accepted: approved for the current scope.
- Frozen for P0: required for parallel implementation and change-controlled.
- Superseded: replaced by a named later decision.
- Rejected: considered and intentionally excluded.

Changing a frozen decision requires:

1. A clear reason and affected user or safety outcome.
2. The files, contracts, fixtures, tasks, and tests affected.
3. Coordinator review and explicit approval when required.
4. Updates to every affected authoritative document in one controlled change.
5. A new decision entry that names the superseded decision.

## 3. Frozen product decisions

### DEC-001: Track and product focus

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Build ContextFirst Nexus for Track 3, Accountability & Justice, focused on trafficking-related forced criminality and source-grounded case preparation.
- Reason: It directly fits the challenge's evidence-organization and legal-work direction while supporting a focused, demonstrable workflow.
- Authority: `PROJECT_BRIEF.md`, `docs/PRODUCT_SPEC.md`

### DEC-002: Intended user and affected stakeholder

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: The direct user is an authorized qualified legal-aid, defence, public-defender, court-navigation, or NGO legal practitioner. The person described in the records is the primary affected stakeholder and is not a direct prototype user.
- Reason: The product supports professional review without asking a survivor to retell traumatic experiences to an AI system.
- Authority: `PROJECT_BRIEF.md`, `docs/SAFETY_AND_DATA.md`

### DEC-003: Product role and prohibited decisions

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: AI may extract, organize, link, summarize, suggest, and surface gaps. It may not decide trafficking or victim status, credibility, guilt, legal eligibility, non-punishment outcome, prosecution, sentence, priority, or risk.
- Reason: These are consequential human and legal judgments outside the prototype's validated role.
- Authority: `docs/SAFETY_AND_DATA.md`, `docs/CONTRACTS.md`

### DEC-004: Synthetic-only P0 data

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Enable only the bundled fictional adult fixture `CFN-DEMO-001`, fixture version `1.0.0`. Do not expose arbitrary upload or process real, private, client, survivor, or child material.
- Reason: This creates a reliable judged flow and a defensible privacy boundary for a public hackathon prototype.
- Authority: `docs/SAFETY_AND_DATA.md`, `docs/DEMO_AND_FIXTURES.md`

### DEC-005: Hero artifact and review model

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: The hero artifact is the Charge-Coercion Nexus with six stable rows, source dependencies, limitations, unknowns, and individual review where required. There is no overall score.
- Reason: It makes the alleged-conduct and possible-coercion relationship inspectable without deciding the case.
- Authority: `PROJECT_BRIEF.md`, `docs/CONTRACTS.md`

### DEC-006: Separate epistemic and workflow states

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Evidence nature, item origin, support status, and review status remain separate in data and UI.
- Reason: Human acceptance must not erase that a statement was alleged, reported, uncertain, or first suggested by AI.
- Authority: `PROJECT_BRIEF.md`, `docs/CONTRACTS.md`, `docs/DESIGN_SYSTEM.md`

### DEC-007: Human review and export gating

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Require individual consequential review, exact or manually resolved citations, coverage checks, dependency recalculation, privacy checks, and a purpose-bound export gate. No bulk approval or critical override exists.
- Reason: Review must be an observable control, not a disclaimer.
- Authority: `docs/SAFETY_AND_DATA.md`, `docs/CONTRACTS.md`

### DEC-008: Strongest demonstration moment

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: The practitioner accepts and then withdraws `CAND-TASK-0402`. The system invalidates `NEXUS-COMPELLED-TASKS` and `NEXUS-OFFENCE-TIMING`, preserves unrelated decisions, and blocks export until renewed review.
- Reason: This demonstrates source dependency, meaningful human control, and safe abstention in one interaction.
- Authority: `docs/DEMO_AND_FIXTURES.md`

### DEC-009: Three separated review lanes

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Keep trafficking indicators, non-punishment relevance, and protection, remedy, or procedural urgency in three separate review lanes.
- Reason: Shared evidence must not collapse distinct practitioner questions into a single status or conclusion.
- Authority: `docs/PRODUCT_SPEC.md`, `docs/DESIGN_SYSTEM.md`

### DEC-010: Export formats and transmission

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Build one reviewed `ExportManifest` and render its selected handoff as local PDF and structured JSON downloads. The application does not email, upload, file, refer, or otherwise transmit an export.
- Reason: A single manifest preserves parity and keeps downstream action under practitioner control.
- Authority: `docs/CONTRACTS.md`, `docs/SAFETY_AND_DATA.md`

## 4. Frozen architecture decisions

### DEC-011: Application topology

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Use one Next.js 16 App Router application with React 19, TypeScript, Tailwind CSS 4, and the existing Vercel project. Do not create microservices.
- Reason: One application is the fastest understandable path to the complete judged flow.
- Authority: `docs/ARCHITECTURE.md`

### DEC-012: Routes and server boundary

- Date: 2026-07-15
- Status: Amended by DEC-045 on 2026-07-17
- Decision: Use the six approved user routes plus one Node.js `/api/analyze` route. The route exposes a safe capability projection on `GET`; after TASK-040 contract reconciliation, `POST` accepts one bounded provider-neutral live-analysis intent and applies server-managed routing.
- Reason: This keeps provider credentials and controls server-side while retaining a small architecture.
- Authority: `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`

### DEC-013: No P0 database or production authentication

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Use typed in-memory case state plus a versioned, validated, redacted synthetic-state projection in browser `sessionStorage`. Do not add a database, durable server case store, or production authentication.
- Reason: The public prototype has one synthetic case and does not need multi-user persistence. A role chooser must not be described as authentication.
- Authority: `docs/ARCHITECTURE.md`, `docs/SAFETY_AND_DATA.md`

### DEC-014: PDF extraction and OCR boundary

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Use browser-side `pdfjs-dist@6.1.200` in a same-origin worker for the bundled text PDFs. Do not add OCR. Missing, unreadable, image-only, or failed pages stay explicitly unavailable.
- Reason: Deterministic text fixtures make exact citation possible without a heavy or privacy-sensitive OCR service.
- Authority: `docs/ARCHITECTURE.md`

### DEC-015: Validation and source grounding

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Use `zod@4.4.3` plus deterministic semantic validation. Resolve citations first by exact codepoint match and then only by one unique conservative normalized match.
- Reason: Structured output alone cannot prove source, meaning, safety, or legal validity.
- Authority: `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`

### DEC-016: Guidance architecture

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Use a small versioned local guidance pack of reviewed source-register material. Do not build general legal RAG, embeddings, hosted search, or a vector database.
- Reason: A local reviewed pack prevents fluent invention and accidental treatment of general guidance as case evidence or domestic law.
- Authority: `docs/ARCHITECTURE.md`, `docs/SOURCE_REGISTER.md`

### DEC-017: Export implementation

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Use `@react-pdf/renderer@4.5.1`, loaded on the export route, plus a native browser `Blob` for JSON.
- Reason: Both formats can be generated locally from the same manifest without a new service.
- Authority: `docs/ARCHITECTURE.md`

### DEC-018: UI foundations

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Use a small inspected subset of local shadcn/ui patterns and `lucide-react@1.24.0`, following the calm light-first legal-workbench design system.
- Reason: Local primitives speed accessible implementation while keeping the product visually restrained and editable.
- Authority: `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`

### DEC-019: Test stack and accessibility target

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Use Vitest, Testing Library, Playwright, and `@axe-core/playwright`. Target WCAG 2.2 Level AA and require manual keyboard, VoiceOver, zoom, reflow, focus, and reduced-motion checks before making any conformance claim.
- Reason: Deterministic, component, browser, and manual checks cover different failure classes.
- Authority: `docs/TESTING_AND_EVALUATION.md`, `docs/DESIGN_SYSTEM.md`

## 5. Frozen provider decisions

### DEC-020: Provider-neutral architecture

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Use separate native server-only OpenAI, Gemini, and Mistral adapters behind one `ModelAnalysisProposal` contract. Do not use an aggregator, OpenAI-compatible shortcut for other providers, an agent framework, tool-calling loop, or Vercel AI SDK.
- Reason: Native adapters preserve provider-specific controls, errors, provenance, and disclosures while one narrow proposal contract keeps application behavior consistent.
- Authority: `docs/ARCHITECTURE.md`, `docs/MODEL_ROUTING.md`

### DEC-021: OpenAI quality baseline

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Define `openai-quality-v1` with provider ID `openai`, model `gpt-5.6-sol`, and reasoning effort `medium` as the initial quality baseline. Use the official SDK and Responses API with `store: false`, no tools, no background mode, and disabled hidden retries for one bounded attempt.
- Reason: It is the accuracy-first comparison baseline, not a permanent or unevaluated claim of superiority.
- Authority: `docs/MODEL_ROUTING.md`, `docs/CONTRACTS.md`

### DEC-022: Gemini cost-conscious alternative

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Define `gemini-quality-v1` with provider ID `google_gemini`, model `gemini-3.5-flash`, thinking level `medium`, and unpaid synthetic-only service terms. Use the official `@google/genai` SDK through a native stateless adapter.
- Reason: It provides a direct free-tier quality challenger and explicit operational recovery option subject to evaluation and changing project quota.
- Safety condition: Only the exact server-verified bundled fixture may be sent. The UI must disclose unpaid-service training and human-review conditions.
- Authority: `docs/MODEL_ROUTING.md`, `docs/SAFETY_AND_DATA.md`

### DEC-023: Mistral third live candidate

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Define `mistral-small-free-v1` with provider ID `mistral`, exact model `mistral-small-2603`, reasoning effort `medium`, and unpaid synthetic-only service terms. Use the official `@mistralai/mistralai` SDK in one stateless, non-streaming JSON Schema Chat Completions request with SDK retries disabled.
- Reason: It is a direct third provider candidate for explicit quota or outage recovery without an aggregator.
- Safety condition: It remains unselectable until the exact release passes the complete evaluation gate and is available to the deployed account. Only the exact server-verified bundled fixture may be sent. The disclosure must state the actual training opt-out state, possible training use when not opted out, up-to-30-day retention limitation, and lack of free zero data retention.
- Authority: `docs/MODEL_ROUTING.md`, `docs/SAFETY_AND_DATA.md`

### DEC-024: Deterministic replay

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Keep `prepared-replay-v1` as a separate local, version-matched deterministic path. Label it Bundled deterministic replay, not live AI. `DEMO-CHECKPOINT-REVIEW` may combine it with fixture-reviewer decisions while preserving replay and checkpoint provenance.
- Reason: This protects the public demonstration from provider availability without pretending frozen output is live AI.
- Authority: `docs/CONTRACTS.md`, `docs/DEMO_AND_FIXTURES.md`

### DEC-025: Explicit provider selection and recovery

- Date: 2026-07-15
- Status: Superseded by DEC-045 on 2026-07-17
- Decision: Display OpenAI, Gemini, Mistral, then replay. Never treat this order as an automatic chain. Every retry, provider switch, or replay action is explicit. A provider switch requires a fresh disclosure acknowledgement and creates a separate linked run. Outputs from separate runs are never merged.
- Reason: Provider choice changes data flow, terms, provenance, and cost. It must remain visible and controlled by the practitioner.
- Authority: `docs/MODEL_ROUTING.md`, `docs/CONTRACTS.md`

### DEC-026: Safety failures cannot be bypassed

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Offer cross-provider recovery only for approved operational availability failures. Do not offer provider switching as a way around refusal, privacy, citation, injection, prohibited-output, structured-response, or semantic-safety failures.
- Reason: Trying another model to obtain a different safety outcome would weaken the product's control boundary.
- Authority: `docs/SAFETY_AND_DATA.md`, `docs/MODEL_ROUTING.md`

### DEC-027: Credential and quota boundary

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Use at most one active project-owned server credential per provider in P0. Do not pool, share, round-robin, or rotate multiple personal, friend, college, or multi-account keys to expand free quota or evade limits. Do not accept browser-supplied keys.
- Reason: Shared-key pools create security, ownership, audit, terms, and suspension risks and conflict with the responsible provider-selection architecture.
- Approved resilience: Bounded evaluated-provider recovery under the managed-routing rules in DEC-045, safe retry delays, deterministic replay, synthetic-result caching where later approved, and legitimate provider quota or budget controls.
- Authority: `docs/MODEL_ROUTING.md`, `docs/SAFETY_AND_DATA.md`

### DEC-028: Public live-analysis default

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Keep public live analysis disabled until provider budgets and an appropriate Vercel firewall or rate control are reviewed and explicitly approved. Keep labelled replay available for the public demonstration.
- Reason: P0 has no production authentication, so an unrestricted public model route has cost-abuse risk.
- Authority: `docs/ARCHITECTURE.md`

### DEC-029: Provider admission and recommendation

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: A release becomes selectable only after its exact provider, model, adapter, settings, schema, prompt, tier, and fixture binding pass the development and fresh held-out gates. Cost and latency are considered only after all blocking safety gates pass.
- Reason: Provider marketing and general benchmarks cannot establish fitness for this evidence-processing task.
- Authority: `docs/TESTING_AND_EVALUATION.md`, `docs/MODEL_ROUTING.md`

### DEC-045: Managed analysis entry and server-side routing

- Date: 2026-07-17
- Status: Approved product direction; TASK-039 Ready and TASK-040 blocked on TASK-039
- Decision: Remove provider and model controls from the practitioner-facing flow. Present one plain-language Start analysis action. In the replay-only public deployment, bind exactly one selectable bundled deterministic replay; zero or multiple selectable services fail closed. Keep replay separate from live routing and preserve its `providerTransmission: false` provenance.
- Future live routing: After contract and architecture reconciliation, the server may attempt statically admitted releases in the frozen order OpenAI, Gemini, Mistral, then a separately evaluated and admitted fourth provider. Groq `openai/gpt-oss-120b` is only the current fourth-provider evaluation candidate and receives no runtime, credential, spend, provider-call, admission, or deployment approval from this decision.
- Eligible fallback: Only a classified operational failure—provider not configured, authentication failure before processing, quota exhausted, rate limited, confirmed temporary unavailability, or confirmed request not executed—may advance to another admitted live release.
- Forbidden fallback: Privacy or leak-scan failure, prohibited input, refusal, unsafe output, invalid citation, semantic failure, malformed output, injection propagation, timeout or transport failure with unknown remote execution, partial or accepted output, and every safety-bypass attempt stop routing.
- Routing guarantees: One canonical approved redacted input, one final accepted result, no cross-provider output merge, no multi-key quota evasion, safe attempt metadata only, exact final provider and release provenance, bounded attempts, immediate stop after acceptance, and fail-closed missing or stale admission. Provider details remain in Trust, safe audit, export provenance, and optional consolidated plain-language disclosure rather than developer controls.
- Public release boundary: `ENABLE_LIVE_ANALYSIS` remains authoritative and the public deployment remains replay-only until evaluation, reviewed static admission, credentials, spend approval, and separate production approval are all recorded.
- Supersession: This decision explicitly replaces DEC-025's practitioner-controlled provider selection and switching. DEC-024 replay separation, DEC-026 safety-failure prohibition, DEC-027 single-credential boundary, DEC-028 public-live default, and DEC-029 static admission remain in force.
- Authority: `PROJECT_BRIEF.md`, `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/SAFETY_AND_DATA.md`, `docs/MODEL_ROUTING.md`, `docs/TESTING_AND_EVALUATION.md`

## 6. Rejected or deferred decisions

### DEC-030: General legal RAG and agentic tools

- Date: 2026-07-15
- Status: Rejected for P0
- Decision: Do not add LangChain, LlamaIndex, agents, model tools, browsing, hosted file search, embeddings, or a vector database.
- Reason: They add capability and attack surface without improving the bounded synthetic demonstration.
- Authority: `docs/ARCHITECTURE.md`

### DEC-031: Prompt Guard as a required blocker

- Date: 2026-07-15
- Status: Rejected for P0
- Decision: Do not add Prompt Guard 2 or another injection classifier as a blocking control without fixture-specific evidence that it improves outcomes.
- Reason: An advisory classifier must not hide or delete legitimate evidence and cannot replace instruction separation, least capability, output validation, and tests.
- Authority: `docs/ARCHITECTURE.md`, `docs/SAFETY_AND_DATA.md`

### DEC-032: Additional live providers

- Date: 2026-07-15
- Status: Deferred
- Decision: Keep Cerebras GLM 4.7 as the first reserve research candidate. Do not implement or display it in P0 without a new approved release configuration and full evaluation.
- Reason: Its preview status and task-specific quote fidelity remain unverified.
- Authority: `docs/MODEL_ROUTING.md`, `docs/SOURCE_REGISTER.md`

### DEC-033: Real-data pilot features

- Date: 2026-07-15
- Status: Deferred
- Decision: Authentication, tenant isolation, durable encrypted storage, partner retention and deletion, incident response, domestic legal review, and lived-experience input belong to a separately governed pilot.
- Reason: The hackathon prototype does not satisfy the controls required for real case data.
- Authority: `docs/SAFETY_AND_DATA.md`, `docs/ARCHITECTURE.md`

## 7. Frozen implementation-contract decisions

### DEC-034: Browser-owned live-analysis lifecycle

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Keep `POST /api/analyze` stateless. It accepts no recovery-run identifier and returns one terminal execution result. The browser run controller dispatches central state commands, keeps a pending request in memory only, validates recovery against preserved failed runs, and lets the reducer attach recovery metadata during atomic run activation. A preflight rejection creates no run and preserves the prior active run.
- Reason: The server cannot safely validate browser-local case history, and pretending it can would create unverifiable provenance. Central browser state keeps retry, provider-switch, and replay history explicit without weakening the API boundary.
- Authority: `docs/CONTRACTS.md`, `docs/ARCHITECTURE.md`, `docs/SAFETY_AND_DATA.md`

### DEC-035: Canonical manual citation resolution

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Resolve an ambiguous citation only through the central `resolve_citation` command. The reducer verifies the active successful run, candidate, citation, selected canonical segment, and recomputed redacted range before recording one immutable decision and audit event. UI components wait for canonical state before enabling source access.
- Reason: A component-local selection could falsely make a citation appear valid, bypass audit history, or drift from support and export gates.
- Authority: `docs/CONTRACTS.md`, `docs/PRODUCT_SPEC.md`, `docs/SAFETY_AND_DATA.md`

### DEC-036: Reviewed static provider admission

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Evaluation produces versioned evidence reports and canonical digests but cannot promote a release. TASK-011 creates a fail-closed static admission record, TASK-016 produces evidence, and dependency-ordered TASK-026 reviews the evidence and records the version-controlled handoff. Runtime files, environment values, credentials, and provider responses cannot change admission. Mistral also requires coordinator-recorded deployed-account release availability.
- Reason: A separate reviewable handoff prevents test artifacts or mutable runtime configuration from silently enabling a provider and preserves exact release provenance.
- Authority: `docs/CONTRACTS.md`, `docs/MODEL_ROUTING.md`, `docs/TESTING_AND_EVALUATION.md`

### DEC-037: Unknown browser transport outcome

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: If the browser cannot obtain or parse a terminal response, record one safe transport-failure event, accept no output, create no run or recovery link, preserve the prior active run, and require any later attempt to be explicit and unlinked. Pause session writes while a request is pending and restore only the prior validated stable snapshot after refresh.
- Reason: A missing response cannot prove whether remote execution occurred, so inventing a failed run, resuming it, or linking a retry would create false provenance.
- Authority: `docs/CONTRACTS.md`, `docs/ARCHITECTURE.md`, `docs/SAFETY_AND_DATA.md`

### DEC-038: One canonical candidate collection

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Store all timeline events, Nexus rows, context gaps, and other candidate kinds in one discriminated `CaseCandidate[]` collection. Timeline, Nexus, and context-gap views are derived selectors and never independent mutable or persisted arrays.
- Reason: Parallel collections can drift during review, withdrawal, replay, checkpoint loading, dependency invalidation, and export evaluation.
- Authority: `docs/CONTRACTS.md`, `docs/ARCHITECTURE.md`

### DEC-039: Bounded exact-only citation ambiguity

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Manual citation resolution is available only when the exact quoted codepoints occur at multiple bounded ranges inside one known, available, allowlisted, candidate-eligible segment. Multiple normalized-only matches and every cross-segment or otherwise unsafe ambiguity are quarantined with no candidate or citation. A unique normalized lookup may still resolve an exact citation location.
- Reason: A practitioner may choose between repeated identical source locations, but must not be asked to repair a quote that differs from all exact source slices or to choose across uncertain source scope.
- Authority: `docs/CONTRACTS.md`, `docs/SAFETY_AND_DATA.md`, `docs/TESTING_AND_EVALUATION.md`

### DEC-040: Trusted versioned replay and checkpoint bundles

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Deterministic replay and the prepared checkpoint resolve fixed bundle IDs through a compile-time bundled registry. Each versioned bundle carries one successful replay run and only that run's candidates and citations. Both bind the exact selected segment order and approved-redacted-input digest, which is recomputed from canonical raw fixture text and effective reviewed masks before activation. A checkpoint bundle also carries its complete trusted purpose, fixture, approved masking, coverage, processing, and fixture-reviewer decisions. Counts, IDs, versions, fixture digest, prerequisite state, run ownership, citation outcomes, dependency targets, and source evidence nature must match before atomic loading. Ordered decisions must reproduce a versioned canonical post-decision outcome projection and lowercase SHA-256 hash that excludes only dynamic activation metadata.
- Reason: Run metadata and counts alone cannot reconstruct outputs, while accepting a browser-supplied arbitrary bundle would weaken fixture integrity and single-run provenance.
- Authority: `docs/CONTRACTS.md`, `docs/DEMO_AND_FIXTURES.md`

### DEC-041: Intent-derived review decisions

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Components submit a narrow review intent. Central review policy and the reducer derive the immutable decision, including prior and resulting status, revision, actor, timestamp, dependency snapshot, and supersession. `withdraw_candidate` is the only command input for withdrawal and derives its own review decision and audit effects.
- Reason: Accepting a fully formed decision from a component or exposing two withdrawal entry paths could bypass transition rules and create inconsistent invalidation or audit history.
- Authority: `docs/CONTRACTS.md`, `docs/PRODUCT_SPEC.md`, `docs/TESTING_AND_EVALUATION.md`

### DEC-042: Per-variant evaluation evidence and private bootstrap

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Every strict evaluation definition freezes its variant ID, split, checks, gates, execution requirement, repetitions, and any deterministic-control scenarios. Model-output variants require three genuine transmitted live runs for the exact release. Deterministic controls may use only their declared mock or local control scenario and cannot substitute for live model evidence. A private server-only evaluation entry may invoke the frozen adapter before runtime admission only after explicit spend approval, uses the exact bundled synthetic input and production post-validation path, is unreachable from browser and HTTP routes, and writes evidence only. It cannot change admission or public selectability.
- Reason: Safety-control fixtures need deterministic simulation, while model-quality evidence needs real provider execution. Separating the two prevents mock evidence from impersonating a live model and allows a fail-closed admission process to collect its required evidence without a public bypass.
- Authority: `docs/CONTRACTS.md`, `docs/ARCHITECTURE.md`, `docs/TESTING_AND_EVALUATION.md`

### DEC-043: Correlated safe provenance and preflight states

- Date: 2026-07-15
- Status: Frozen for P0
- Decision: Safe API and non-run records use correlated live provider-release pairs. Preflight rejections use only an explicit positive local-validation error-code set and never carry a started-execution error. Quarantine records use server-generated opaque IDs and proposal ordinals, never provider-owned proposal IDs. A Nexus row uses its `NEXUS-*` candidate ID as its only identity.
- Reason: Broad independent fields could encode impossible providers, releases, modes, error stages, or model-controlled strings in safe browser-visible state.
- Authority: `docs/CONTRACTS.md`, `docs/SAFETY_AND_DATA.md`, `docs/TESTING_AND_EVALUATION.md`

### DEC-044: Implementation SDK pins and Mistral advisory check

- Date: 2026-07-16
- Status: Approved for implementation
- Verified at: `2026-07-15T19:03:16Z`
- Decision: TASK-001 must pin `openai@6.47.0`, `@google/genai@2.11.0`, and `@mistralai/mistralai@2.4.1` exactly. These were the latest stable, non-prerelease versions consistently reported by the official release repositories and the npm registry at verification time.
- OpenAI evidence: Official release `v6.47.0`, published 2026-07-14, commit and npm `gitHead` `62554053803dea45bf949699c7ea9d1a414df615`; npm integrity `sha512-xYr+R9woSzWxVxeiqkkNbHhv89tZDEI6eBMbrdPnv3poh+mijHvbhS35a+3o6xHa411/ns8j5ENY3So9DCXWYw==`; npm tarball `https://registry.npmjs.org/openai/-/openai-6.47.0.tgz`; official releases `https://github.com/openai/openai-node/releases`; npm package `https://www.npmjs.com/package/openai/v/6.47.0`.
- Google evidence: Official release `v2.11.0`, published 2026-07-09, release commit `136ea26`; npm did not expose a `gitHead`; npm integrity `sha512-d2Csf29vS0GfHc52H0MG25ccY4FKvvbDgqDlEovLrPLF8sPegWr/GGO+LMOy85/1SnX0iV0zDAW7R8SsvWg8Vg==`; npm tarball `https://registry.npmjs.org/@google/genai/-/genai-2.11.0.tgz`; official library guidance `https://ai.google.dev/gemini-api/docs/libraries`; official releases `https://github.com/googleapis/js-genai/releases`; npm package `https://www.npmjs.com/package/@google/genai/v/2.11.0`.
- Mistral evidence: Official release `v2.4.1`, published 2026-07-03, commit and npm `gitHead` `47d69a6d5436102841e2035eec9c0451caa5d531`; npm integrity `sha512-vNpR2GR76aW7fK8Dcu1NRx3fdSPO1QruRDo4GbfXfkro2mvp194xIAvJ2BP4ZykzyWtJoDmBe+Qsk9D443aqlg==`; npm tarball `https://registry.npmjs.org/@mistralai/mistralai/-/mistralai-2.4.1.tgz`; official releases `https://github.com/mistralai/client-ts/releases`; npm package `https://www.npmjs.com/package/@mistralai/mistralai/v/2.4.1`.
- Node compatibility: The frozen project range is `>=22.13.0 <27`, the deployment target remains Node 24, and verification ran on local Node `v26.0.0`. `@google/genai@2.11.0` declares Node `>=20.0.0`; the OpenAI and Mistral npm metadata returned no stricter `engines` field. All three approved pins are compatible with the frozen project range.
- Advisory result: `GHSA-jgg6-4rpr-wfh7` identifies only `@mistralai/mistralai` versions `2.2.2`, `2.2.3`, and `2.2.4` as affected. Selected version `2.4.1` is later and is not affected by this advisory. Official advisory: `https://github.com/mistralai/client-ts/security/advisories/GHSA-jgg6-4rpr-wfh7`.
- Local advisory scan: `npm ls @mistralai/mistralai @mistralai/mistralai-azure @mistralai/mistralai-gcp` reported an empty installed tree. The approved advisory pattern produced no match in `package-lock.json`. No affected Mistral package is currently installed or locked in the repository.
- Limitation: This version and advisory decision does not replace TASK-001 lockfile review, `npm audit`, later dependency scanning, application-level security testing, or re-verification before deployment.
- Authority: `tasks/TASK-001.md`, `docs/ARCHITECTURE.md`, `docs/MODEL_ROUTING.md`, `docs/SOURCE_REGISTER.md`, official provider release repositories, npm registry metadata, and `GHSA-jgg6-4rpr-wfh7`.

## 8. Pending implementation-time records

These are not product-choice reopeners. They must be recorded before dependent implementation or deployment:

- Confirmation after TASK-001 that the installed SDK versions and lockfile exactly match the DEC-044 approved pins.
- Actual provider account tier, model availability, training-use setting, retention limitation, and region used by every enabled release.
- Canonical fixture and redacted-derivative digests.
- Measured development and held-out results for each exact live release configuration.
- Approved live-evaluation call count and estimated spend.
- Actual Vercel Node runtime and any approved public-route cost-abuse control.
- The base revision and integration order used for implementation worktrees.

These values must never include credentials, tokens, account identifiers, private URLs, or billing details.
