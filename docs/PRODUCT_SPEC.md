# Product Specification

## 1. Purpose and authority

This specification defines the expected behavior of the ContextFirst Nexus hackathon prototype. It describes user-facing requirements, states, and acceptance conditions. Engineering choices already frozen by the approved architecture and safety documents are summarized in Section 12. This specification does not independently redefine them.

The controlling order is:

1. docs/SAFETY_AND_DATA.md for safety and data rules.
2. PROJECT_BRIEF.md for product direction and scope.
3. This specification for user-facing behavior.
4. docs/DEMO_AND_FIXTURES.md for the deterministic demonstration.

Implementation must not present planned behavior as completed behavior.

## 2. Product statement

ContextFirst Nexus helps an authorized practitioner organize a synthetic trafficking-related forced-criminality case packet into a source-linked timeline, a Charge-Coercion Nexus, separated review lanes, and a reviewed redacted handoff.

It is an AI-assisted case-preparation workspace. It is not a legal decision-maker.

## 3. Users and access assumptions

### 3.1 Primary user

A qualified legal-aid, defence, public-defender, court-navigation, or NGO legal practitioner.

### 3.2 Secondary user

A trained supervisor or pilot evaluator who reviews the workflow and its audit history. A distinct supervisor permission model is P1.

### 3.3 Affected person

The person described in the packet is an affected stakeholder, not a direct prototype user. The product must not imply that they consented merely because a practitioner uses the tool.

### 3.4 Prototype access

The hackathon version may use a role-selection screen for demonstration. This is not authentication and must not be described as secure access control.

## 4. Primary user needs

The practitioner needs to:

- state the authorized purpose before processing;
- explicitly choose and acknowledge the analysis provider before processing;
- understand which pages and source types were processed;
- inspect and correct suggested masking;
- see events in chronological context;
- examine the relationship between alleged conduct and possible coercion;
- distinguish source text, reported accounts, AI suggestions, and human findings;
- preserve contradictions and unknowns;
- review every consequential candidate individually;
- understand why an export is blocked;
- create a reviewed, redacted, minimum-necessary handoff;
- see the system's providers, limitations, data flow, and measured synthetic results.

## 5. Product vocabulary

### Case packet

One permitted collection of source documents processed in isolation. The frozen P0 prototype enables only the bundled synthetic packet. Harmless authorized public material remains a future policy-permitted option that has no P0 upload path.

### Case Purpose Brief

A short pre-processing record of the user's role, purpose, authority, jurisdiction, language, supported handoff, prohibited decisions, selected analysis provider, and provider-specific data-flow acknowledgement.

### Analysis provider

The practitioner-selected external service used for one live analysis run. P0 defines exactly three registered live configurations in this order: OpenAI using the configured approved model, Google using `gemini-3.5-flash`, and Mistral AI using the exact `mistral-small-2603` release. Only configurations with matching passed reviewed static admission, current configuration, and explicit enablement are selectable. Mistral also requires coordinator-recorded deployed-account availability. Every provider execution that is verified to have started is recorded as its own run and is never silently or automatically replaced. A rejected preflight or unknown browser-transport outcome remains a typed non-run attempt and never becomes a fabricated run.

### Candidate item

An extracted event, entity, link, indicator, gap, contradiction, or urgency issue that has not yet been accepted by a human. Timeline events, Nexus relationships, and context gaps are specialized candidate kinds, not separate copies of the same item.

### Reviewed finding

A candidate item that a practitioner individually accepted or edited while preserving its provenance.

### Charge-Coercion Nexus

A source-linked view connecting an alleged offence or sanction with recruitment, movement, control or coercion, compelled conduct, timing, contrary evidence, gaps, and procedural urgency.

### Review lane

One of three separated areas:

1. Trafficking indicators for review.
2. Non-punishment relevance for review.
3. Protection, remedy, and procedural urgency.

The lanes may share cited evidence but must not collapse into one score or conclusion.

### Exact citation

A stable link to the processed source containing, at minimum, document ID, page or equivalent locator, segment ID, and an exact matching quote. Where available, it also includes character position or page coordinates.

### Coverage

The set of pages or source segments successfully processed, skipped, missing, unreadable, or manually excluded.

### Safe-share export

A minimum-necessary output containing only reviewed, redacted information selected for an authorized recipient.

## 6. Global interaction rules

### FR-G01: Visible status

Every case must display one current status:

- Draft
- Processing
- Review required
- Blocked
- Ready to export
- Exported
- Processing failed

The interface must show the reason for Blocked or Processing failed.

### FR-G02: Separate information dimensions

Every consequential item must display separate applicable values for:

- Evidence nature: Documented in source, Reported or alleged in source, Reviewer-supplied context, or Unknown.
- Item origin: Source extraction, AI suggestion, or Human-created.
- Support status: Exact-source supported, Partially supported, Conflicting, Insufficient evidence, Citation unresolved, or Not processed.
- Review status: Pending, Human accepted, Human edited, Rejected, Uncertain, or Invalidated.

These values must not be collapsed into one label. For example, a candidate can remain Reported or alleged in source, have AI suggestion as its origin, and later have Human edited as its review status.

Evidence nature attaches to each supporting source dependency, so one candidate may visibly combine a reported statement with a separate documented record. Origin, support status, and review status remain separate item-level values.

Colors cannot be the only way these dimensions are communicated.

### FR-G03: No overall score

The product must not show an overall trafficking, victim, credibility, guilt, non-punishment, case-strength, dangerousness, or legal-outcome score.

### FR-G04: Human actions

Each candidate item must support:

- Accept
- Edit
- Reject
- Mark uncertain
- Open source

Accept must be disabled until required citation validation and coverage checks pass. Accept as a positive finding must also be disabled when support is Insufficient evidence. A practitioner may reject or mark an unsupported item uncertain. A practitioner may accept an explicit insufficient-evidence item only as a reviewed limitation or gap, never as a positive finding.

There must be no bulk approve action.

### FR-G05: Dependency awareness

When supporting evidence is rejected, withdrawn, replaced, or becomes invalid, every dependent candidate or reviewed finding must be recalculated and visibly reopened when appropriate.

The product keeps one canonical candidate record for each stable ID. Timeline, Nexus, context-gap, review-lane, queue, and blocker screens are views of those same records. A status, wording, dependency, or invalidation change must appear consistently everywhere without a second mutable or persisted candidate copy.

### FR-G06: Honest failures

The system must use explicit unknown, conflicting, insufficient evidence, manual review required, and not processed states. It must not create a prose fallback that hides a failed extraction or model response.

A failed provider run must remain visible with a safe failure category, provider, model, run mode, and time. Candidates from a failed or rejected run must not enter review or export.

## 7. End-to-end requirements

### 7.1 Landing and boundary screen

#### Purpose

Explain the product in plain language before data is loaded.

#### Required content

- One-sentence product description.
- Intended qualified user.
- Synthetic-only prototype label.
- Clear statement that the system does not determine trafficking, credibility, guilt, legal eligibility, or legal strategy.
- Clear statement that it is not a survivor chatbot, emergency service, or reporting channel.
- Link to the system card and data-use summary.
- Start demo button.

#### Acceptance

A first-time user can describe what the product does and does not do without opening another page.

### 7.2 Case workspace and demo chooser

#### Required behavior

- Offer the bundled synthetic packet as the primary demo path.
- Display case name, synthetic label, adult-case label, document count, and fixture version.
- If arbitrary upload is later enabled, show a separate warning that the prototype accepts only synthetic or harmless authorized public material.
- Never preselect or imply a real organization, real court, or real person.

#### Acceptance

The judged flow can start without external files or end-user accounts. Live analysis depends only on one of the three disclosed, configured, statically admitted providers selected by the practitioner. The bundled deterministic replay remains a separate final option after the three live choices. The prepared video checkpoint is a visibly loaded, trusted, versioned replay-based bundle with complete synthetic prerequisite state and fixture-reviewer decisions.

### 7.3 Case Purpose Brief

#### Required fields

- Practitioner role and organization type.
- Authorized purpose.
- Intended recipient or handoff.
- Supported decision or workflow.
- Decisions explicitly excluded from system support.
- Country or jurisdiction for later legal verification.
- Source language and translation status.
- Data origin: bundled synthetic. Harmless authorized public material remains a future option and is disabled in P0.
- Analysis mode: OpenAI using the configured approved model, Google using Gemini 3.5 Flash, Mistral AI using the exact statically admitted and deployed-account-available `mistral-small-2603` release, or the separately labelled bundled deterministic replay shown last.
- Consent or other lawful/organizational authority attestation, where applicable.
- Selected live-provider data-flow, service-tier, data-use, and retention disclosure acknowledgement, or acknowledgement that replay is frozen local output and not live AI.
- Confirmation that law-enforcement cooperation is not a condition of analysis.

#### Rules

- The system cannot verify the practitioner's authority and must say so.
- The system must not force a false claim of survivor consent when another lawful basis is used.
- The bundled synthetic fixture records consent or authority basis as Not applicable, synthetic fixture.
- Real survivor, client, or private case material is rejected in the hackathon prototype even if a user claims authorization.
- No live provider or replay is silently preselected. The practitioner must choose one analysis mode.
- The provider choice must show the provider, model, service tier, content categories sent, data-use terms, retention limitation, and known limitations in plain language.
- Acknowledgement is release-specific. Changing a live provider or moving between live analysis and replay clears the earlier acknowledgement and invalidates export readiness.
- Unpaid Gemini is available only for the verified bundled synthetic fixture and is blocked for every other data origin.
- Free Mistral is available only for the exact verified bundled synthetic fixture and is blocked for every other data origin. Its disclosure must state whether training use is enabled or opted out for the actual account, that inputs and outputs may be retained for up to 30 days for abuse monitoring, and that free Mistral has no zero-data-retention claim or dependency in P0.
- A future paid Mistral tier does not authorize real, private, client, or survivor data and does not remove future-pilot requirements.
- Provider credentials remain server-side and are never shown in the form, browser, URL, error text, or downloadable output.
- Processing or replay loading is blocked until required fields, authorization attestation, release selection, and its matching acknowledgement are complete.

#### Acceptance

The saved brief appears in the audit history and is referenced by every export.

### 7.4 Document intake, masking, and coverage

#### Required behavior

- Show each source document, type, page count, language, and processing status.
- Preserve an application-managed read-only source copy and create a separate working derivative.
- Suggest masking for declared supported identifier classes.
- Require human preview and approval of masking.
- Show processed, unreadable, missing, skipped, and manually excluded pages.
- Treat embedded document instructions as untrusted source content.
- Provide sensitive-content warnings and a redacted view by default.
- Allow the user to open the original only through an intentional reveal action.
- After purpose, coverage, masking, and leak-scan prerequisites pass, show one explicit Start analysis action for the already acknowledged live release or replay choice.

#### Acceptance

The user can identify exactly what the system did not process. A missing or unreadable critical page blocks dependent findings and export.

### 7.5 Processing progress

#### Required stages

- Intake validation.
- Text extraction.
- Coverage calculation.
- Identifier masking.
- Candidate extraction.
- Citation validation.
- Timeline and Nexus assembly.
- Safety and export-gate checks.

#### Rules

- Each stage shows pending, active, completed, warning, or failed.
- A retry targets only the failed stage where safe.
- A model timeout or invalid structured response must not be presented as a completed analysis.
- The original packet remains available after a recoverable failure.
- Every live response passes the same canonical schema, citation, coverage, privacy, prompt-injection, prohibited-inference, and semantic-validation gates regardless of provider.
- The active provider and live or replay mode remain visible throughout processing and review.
- A browser run controller builds only the strict ID-and-mask request, dispatches the central start command, makes one selected live request or invokes local replay, and sends the terminal result back through the matching reducer command.
- The stateless live route does not receive or verify browser recovery history. A pending request is kept in memory only, and the reducer activates a terminal result only when its start command and source case revision still match.
- Starting a request does not increment the source case revision. Other material changes remain blocked until the matching response, safe preflight rejection, transport failure, or Reset Case clears the pending request.
- If the browser receives no parseable response, it records a safe transport failure, states that the remote outcome is unknown and no output was accepted, clears pending state, preserves the prior active run, and creates no run or recovery link.
- Browser persistence pauses while a live request is pending. Refresh restores the prior validated stable snapshot, re-derives case status, and never resumes or retries the request. The interface warns that the remote outcome cannot be inferred after refresh.

#### Provider failure recovery

- A provider is never replaced silently or automatically.
- Provider not configured, provider disabled, service tier unavailable, authentication failure, rate limiting, quota exhaustion, timeout, or transient provider unavailability may offer only the applicable Retry selected provider, Choose another provider, and Use labelled replay actions.
- The recovery interface lists remaining eligible live providers in OpenAI, Gemini 3.5 Flash, and Mistral Small 4 order, with Bundled deterministic replay, not live AI shown last. This is display order only and never an automatic attempt chain.
- Choosing another eligible live provider opens its disclosure, requires a fresh provider-specific acknowledgement, and starts a new run that the browser reducer links to the preserved failed run after local validation.
- If a valid run began, the earlier failed run remains in audit history and run status. It is not converted into the new run.
- If provider configuration or release validation rejects the request before a run begins, the interface records a safe preflight audit event and does not invent a failed run.
- If the browser transport fails or the response envelope cannot be parsed, the interface records a separate safe transport-failure event, creates no run, and treats any later attempt as a new explicit unlinked attempt.
- A refusal, safety block, privacy block, invalid structured response, failed citation, or semantic-policy failure does not offer provider switching as a bypass.
- Replay is a separate, version-matched mode selected by the practitioner, shown after all eligible live-provider choices, and always labelled Bundled deterministic replay, not live AI.
- `DEMO-CHECKPOINT-REVIEW` resolves only its fixed trusted registry ID and atomically loads the exact versioned synthetic purpose, fixture, approved masking, coverage, completed processing, replay run, candidates, citations, and ordered fixture-reviewer decisions after digest, count, ownership, and canonical outcome-hash checks pass. It accepts no browser-supplied bundle and is not an additional analysis mode, a live-provider result, or a prior user session.
- Error messages identify a safe category and next action without showing keys, key fragments, secret names, billing details, project details, request content, or raw provider responses.

### 7.6 Context Gap review

#### Required behavior

- Present questions created by missing or conflicting source information.
- Derive every context-gap view from canonical candidates whose kind is Context Gap; do not maintain a separate review-state copy.
- Let the practitioner answer, defer, mark unknown, or state that the question is outside scope.
- Label practitioner-added context separately from source evidence.
- Never make completion of every gap mandatory.

#### Examples

- Which arrival date is supported by the original travel record?
- Is the task log's provenance known?
- Is an interpreter arranged for the upcoming proceeding?
- Is document custody independently supported?

#### Acceptance

Unknown remains visible and does not become a negative inference.

### 7.7 Source-linked timeline

#### Required behavior

- Order documented, reported, alleged, and procedural events by supported date or date range.
- Derive the timeline from canonical Timeline Event candidates so review and dependency changes appear without synchronizing a second collection.
- Display uncertainty for approximate or conflicting dates.
- Group or filter by recruitment, movement, control, alleged conduct, legal process, and protection.
- Open the exact source location from every event.
- Show contrary evidence and unresolved conflicts beside the affected event.
- Never silently select one version of a conflicting date.

#### Acceptance

Every displayed source event resolves to a valid citation or is clearly labelled reviewer-authored.

### 7.8 Charge-Coercion Nexus

#### Required sections

- Alleged offence, charge, or sanction.
- Recruitment and represented work conditions.
- Movement or transfer.
- Control or coercion.
- Compelled tasks or conduct.
- Temporal overlap and dependencies.
- Supporting evidence.
- Contrary evidence and alternative explanations.
- Missing evidence and unresolved conflicts.
- Protection or procedural urgency.

#### Rules

- Nexus links are candidate relationships for human review.
- Derive Nexus rows from canonical Nexus Relationship candidates and never mirror their review or support state in a separate collection.
- Every link must expose its source dependencies and current review status.
- The Nexus must support abstention when the relationship is not sufficiently documented.
- Initial consent, delayed disclosure, inconsistent memory, silence, or non-cooperation must not be treated as decisive adverse evidence.
- Rejected or withdrawn evidence must weaken or reopen only the affected links.

#### Acceptance

The interface never states that trafficking occurred or that a person qualifies for non-punishment.

### 7.9 Three review lanes

#### Lane A: Trafficking indicators for review

May organize source-supported indications relating to recruitment, movement, deception, document control, threats, debt, restriction, and compelled service.

It must say that indicators prompt further practitioner assessment and do not determine status.

#### Lane B: Non-punishment relevance for review

May organize the timing and relationship between possible exploitation and alleged offending, together with contrary evidence, gaps, and international guidance.

It must require domestic legal verification and must not present eligibility or a legal conclusion.

#### Lane C: Protection, remedy, and procedural urgency

May surface hearing dates, interpreter status, counsel status, immediate safety questions, detention or return status, privacy concerns, and other time-sensitive gaps.

It must not contact a service, court, police agency, or other recipient automatically.

#### Shared review behavior

- Each candidate is reviewed separately.
- Open source is always available.
- Editing preserves the original suggestion and records the new wording.
- Rejection records a short reason.
- Mark uncertain preserves the candidate but prevents it from becoming a final finding.
- Cooperation status does not change evidence, Nexus, or protection analysis.

### 7.10 Source drawer

#### Required behavior

- Open the exact cited page and segment.
- Highlight the exact quote used.
- Display document type, page, source authority, language, translation status, and extraction quality.
- Distinguish source quote from AI paraphrase and reviewer wording.
- Show citation validation status.
- When the same quoted text has multiple bounded exact-codepoint occurrences in the existing canonical segment, allow the practitioner to choose one of those recomputed ranges. The segment remains fixed; normalized-only or cross-segment ambiguity is quarantined and offers no manual choice.
- Route that choice through the central citation-resolution command. The component may provide only the candidate ID, citation ID, existing segment ID, and selected redacted range; it cannot mark a citation valid itself.

#### Acceptance

A candidate with no exact or manually resolved citation cannot enter the reviewed export. A manual choice becomes eligible only after updated canonical state records the resolution decision, audit event, support recalculation, and stale export gate.

### 7.11 Review queue and audit history

#### Required behavior

- Filter by pending, accepted, edited, rejected, uncertain, conflict, citation problem, and export blocker.
- Filters and blocker destinations must project from the canonical candidate collection rather than create mutable queue copies.
- Show the dependencies affected by each decision.
- Record actor label, action, reason, time, case run, selected provider, attempted provider, model, service tier, run mode, and model or ruleset version.
- Retain operationally failed runs and validation-rejected runs with safe failure categories and provider-acknowledgement provenance.
- Preserve the original candidate when a human edits it.
- Provide an obvious report-unsafe-or-misleading-output action.

#### Acceptance

The audit view makes it possible to explain how the current handoff was produced without exposing raw case text in application logs.

### 7.12 Evidence withdrawal and run comparison

#### Required P0 behavior

- Allow a practitioner to withdraw or reject one critical source or evidence item.
- Recalculate affected timeline and Nexus dependencies.
- Preserve unaffected human decisions.
- Mark newly unsupported findings unresolved.
- Block export until the reopened items are reviewed.
- Show a concise before-and-after explanation.

#### P1 extension

Compare two complete analysis runs after new documents, corrected OCR, updated guidance, or a changed model.

### 7.13 Export gate

#### Blocking conditions

Export must be blocked when any applicable condition exists:

- required Case Purpose Brief fields are incomplete;
- critical document coverage is incomplete;
- a consequential item remains unreviewed;
- a citation is missing, ambiguous, or invalid;
- a dependent item became unresolved;
- a masking or PII-leak check failed;
- stale or mismatched guidance is being used to make a domestic legal claim;
- the selected output exceeds the stated purpose or minimum necessity;
- a processing or safety validation failed.

#### Required blocked state

- State that export is blocked.
- List each reason in plain language.
- Link directly to the place where the issue can be reviewed.
- Do not offer an override that bypasses a critical gate.

### 7.14 Exports

#### Full practitioner handoff

Contains only accepted or human-edited, redacted material needed for the stated purpose:

- case-purpose summary;
- reviewed timeline;
- reviewed Nexus items;
- supporting and contrary evidence;
- unresolved gaps and coverage limits;
- protection or procedural urgency;
- exact citations;
- guidance issuer, version, scope, and verification warning;
- reviewer decisions;
- run and model metadata;
- limitations and synthetic-case label.

#### Safe-share handoff

Contains the minimum reviewed information selected for an authorized recipient. Raw documents and unnecessary identifiers are excluded by default.

#### Formats and purpose binding

The current Case Purpose Brief selects one handoff kind: full practitioner or minimum-necessary safe-share. That handoff is available in PDF and structured JSON formats generated from the same reviewed manifest. JSON uses stable IDs and pseudonyms and preserves allowed provenance, review status, dependencies, and audit metadata.

Changing the handoff kind returns the user to Purpose and invalidates export readiness. The prototype demonstrates both capabilities in separate flows rather than silently broadening one approved purpose.

#### Labels

Every demo export must state:

- Synthetic case.
- AI-assisted, human-reviewed case-preparation draft.
- Not legal advice.
- Local legal verification required.

#### Transmission

Exports are user-initiated downloads. The prototype must not automatically email, upload, file, report, or transmit them.

### 7.15 Trust and Safety Lab

#### System card

Must disclose:

- intended and prohibited uses;
- prototype data rule;
- selected provider, every attempted provider, exact release configuration and evaluation status, requested and returned model identifiers when known, service tier, and run mode;
- separate run history from typed `SystemCard.nonRunAttempts`: a preflight rejection is visibly not transmitted and not started, while a browser transport failure has unknown transmission and unknown remote outcome; both accept no output and neither has a run ID or appears in attempted-run history;
- static provider-admission status, matched evaluation-report identity and digest, and the safe deployed-account availability status where required;
- what content is sent to external providers;
- the provider-specific data-use terms and acknowledgement version;
- actual provider storage or retention setting plus its limitation, without unsupported zero-retention claims;
- for free Mistral, the actual training-use or opt-out state, the up-to-30-day abuse-monitoring retention limitation, and the fact that free zero data retention is not enabled or claimed;
- prepared-checkpoint ID, checkpoint version, replay version, and fixture-reviewer provenance when a checkpoint is active;
- safe failure categories and any explicit provider switch;
- human-review requirements;
- known failure modes;
- fixture count and measured results;
- unsupported languages, jurisdictions, document types, and user groups;
- report-unsafe-output mechanism.

#### Evaluation view

Must show raw results for the approved synthetic fixtures. It may report citation validation, abstention, injection containment, declared-PII masking, cooperation parity, review-gate blocking, and processing failures.

It must not invent an overall accuracy score or imply real-world effectiveness. Evaluation reports are evidence only; runtime admission changes only through the separate reviewed static handoff.

## 8. Product screens

The prototype may combine screens to keep the judged flow focused, but it must provide these capabilities:

1. Landing and boundaries.
2. Synthetic case chooser and case workspace.
3. Case Purpose Brief with analysis-provider selection and disclosure.
4. Documents, masking, processing, coverage, and explicit analysis launch.
5. Main workspace with timeline, Nexus, and source drawer.
6. Review queue and protection or urgency lane.
7. Export gate and export preview.
8. Audit history, system card, and Safety Lab.

## 9. Required interface states

Every asynchronous or data-dependent area must define:

- loading;
- empty;
- partial or warning;
- blocked;
- error with safe retry;
- successful;
- unknown or insufficient evidence.

No blank panel may imply that analysis succeeded.

Provider-dependent areas must also define:

- analysis mode not selected;
- selected provider not configured;
- provider disabled or authentication failed;
- provider rate limited, quota exhausted, timed out, or temporarily unavailable;
- provider response rejected by shared validation;
- Mistral exact release admission evidence pending or failed, or deployed-account availability unverified or unavailable, and therefore not selectable;
- explicit switch awaiting acknowledgement;
- failed prior run retained;
- preflight rejection shown with no invented run;
- bundled replay selected and visibly labelled.
- prepared checkpoint backed by bundled replay and loaded with fixture-reviewer provenance.

## 10. P0 acceptance criteria

The P0 prototype is accepted only when:

1. The entire judged flow works with the bundled synthetic packet.
2. The Case Purpose Brief blocks processing until required authorization fields are completed.
3. Missing and unreadable coverage is visible.
4. Supported identifier classes are suggested for masking and require human approval.
5. Embedded prompt instructions are ignored as commands and surfaced safely.
6. Every source-supported candidate opens an exact or centrally manually resolved source location, and a reviewable repeated-exact range selection is persisted through the canonical command.
7. The timeline preserves uncertain and conflicting dates.
8. The Nexus shows support, contrary evidence, gaps, and dependencies without a case conclusion.
9. All three review lanes remain separate, and every timeline, Nexus, context-gap, lane, queue, and blocker view derives from one canonical candidate collection with no mutable or persisted candidate mirror.
10. There is no bulk approve action.
11. A negative or ambiguous fixture produces abstention.
12. Cooperation status does not alter evidence analysis.
13. Rejecting or withdrawing evidence reopens dependent items.
14. Early export is blocked with actionable reasons.
15. Final outputs contain only reviewed, redacted content and required limitations.
16. The audit history explains practitioner changes.
17. The system card and Safety Lab report only measured synthetic results, keep attempted runs separate from typed non-run attempts, and never fabricate a run for preflight or unknown-transport outcomes.
18. The product makes none of the prohibited claims or inferences in docs/SAFETY_AND_DATA.md.
19. The provider selector offers exactly three live choices in this order: OpenAI, Gemini 3.5 Flash, and Mistral Small 4, followed by bundled replay last.
20. Each provider requires its own disclosure acknowledgement, and changing provider starts a new run.
21. Provider failure recovery lists remaining eligible providers in the approved order, requires an explicit choice, preserves failed runs, and never silently or automatically substitutes a provider or replay.
22. Refusal, safety, privacy, citation, schema, and semantic-validation failures cannot be bypassed by switching providers.
23. Unpaid Gemini is unavailable unless the server verifies the bundled synthetic fixture.
24. Free Mistral is unavailable unless the exact `mistral-small-2603` release passes evaluation, the reviewed static admission record confirms that evidence, coordinator-recorded deployed-account release availability is `available`, and the server verifies the exact bundled synthetic fixture; its disclosure reports training-use or opt-out state, up-to-30-day retention, and no free zero data retention.
25. Provider errors and UI states expose no credentials, account identifiers, billing details, project details, or raw provider diagnostics.
26. Bundled replay and the prepared checkpoint backed by it show local replay provenance, no provider transmission, and no live-AI claim.
27. The stateless API never claims recovery linkage; the browser reducer validates and records it before atomic run activation. A missing or unparseable response clears pending state through a safe transport-failure event and creates no run or recovery link.
28. Runtime evaluation admission cannot be changed by an environment value, runtime report file, or provider response.
29. Replay and checkpoint actions accept only fixed trusted IDs. Exact bundle versions, fixture digest, counts, one-run ownership, checkpoint prerequisites, decision order, and canonical outcome hash must pass before one atomic state change.
30. Review controls submit only narrow non-withdraw intent. Immutable decision fields are derived centrally, and withdrawal has one dedicated command path.

## 11. Scope controls

The following work must not enter P0 until the core workflow passes all acceptance criteria:

- cross-case analytics;
- real-time collaboration;
- public or direct-survivor accounts;
- general legal research across many jurisdictions;
- broad entity graphs;
- automated referrals;
- full production authentication;
- durable multi-tenant storage;
- mobile applications;
- native audio or video forensics;
- live social or web data collection.

## 12. Resolved engineering decisions

The engineering-document phase resolves the earlier open decisions as follows:

| Area | P0 decision | Controlling document |
|---|---|---|
| Screens | Six focused routes combine the eight required capabilities | `docs/ARCHITECTURE.md` |
| Case state | Typed in-memory state plus a disclosed, versioned, redacted synthetic-demo projection in `sessionStorage` | `docs/ARCHITECTURE.md` and `docs/CONTRACTS.md` |
| Input | Bundled synthetic, machine-readable text PDFs only | `docs/ARCHITECTURE.md` |
| Source locations | Stable document, page, segment, exact quote, and character location; PDF positions when reliable | `docs/CONTRACTS.md` |
| Scanned or image-only material | No P0 OCR; mark unavailable and block affected conclusions | `docs/ARCHITECTURE.md` |
| Export | One canonical reviewed manifest rendered as local PDF and structured JSON | `docs/CONTRACTS.md` |
| Live providers | Exactly three registered configurations shown in order: OpenAI using the configured approved model, Google Gemini 3.5 Flash, and Mistral Small 4 using exact release `mistral-small-2603`; only statically admitted, configured, and enabled entries are selectable | `docs/ARCHITECTURE.md` and `docs/SAFETY_AND_DATA.md` |
| Provider failure recovery | Explicit same-provider retry or an acknowledged new run with a remaining eligible provider for operational failures only; choices remain in OpenAI, Gemini, Mistral, replay order, no choice is automatic, failed runs remain visible, and linkage is verified in browser state | `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, and `docs/SAFETY_AND_DATA.md` |
| Provider outage replay | A version-matched deterministic replay, separately selected, always visibly labelled, and never silently substituted for live analysis | `docs/ARCHITECTURE.md` |
| Guidance | A small versioned local pack of reviewed source-register excerpts, not general legal RAG | `docs/ARCHITECTURE.md` |
| Accessibility | WCAG 2.2 Level AA target with automated and manual testing, without a conformance claim until evaluated | `docs/DESIGN_SYSTEM.md` and `docs/TESTING_AND_EVALUATION.md` |

Parallel implementation must not reopen these choices without coordinator approval and a recorded decision change.
