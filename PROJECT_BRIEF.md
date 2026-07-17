# ContextFirst Nexus

## Document status

This document defines the approved product direction for the hackathon prototype. It is product truth, not proof that every feature has been implemented.

If another document conflicts with this brief, implementation must stop and the conflict must be resolved before coding continues. Safety rules in docs/SAFETY_AND_DATA.md always take priority.

### Approved analysis-entry direction, 2026-07-17

The practitioner-facing product presents one plain-language **Start analysis** action, not provider or model controls. Provider details remain available in Trust, safe audit metadata, export provenance, and a consolidated plain-language data-flow disclosure.

The current public deployment remains replay-only. It automatically binds the one selectable bundled deterministic replay release; it never silently enables live AI. If no replay service or more than one service is selectable, analysis fails closed with a simple service-unavailable state.

Future live analysis is a server-managed capability, subject to a separate contract-and-architecture reconciliation. Its frozen candidate order is OpenAI, Gemini, Mistral, then a separately evaluated and admitted fourth provider. Groq `openai/gpt-oss-120b` is only the current fourth-provider evaluation candidate; it is not approved, admitted, configured, selectable, or callable. Every live release still requires evaluation, reviewed static admission, credentials, spend approval, and separate production approval. Bundled replay remains local and separate from live-provider routing.

This direction explicitly replaces practitioner-controlled provider selection and manual provider switching in DEC-025. It does not relax any privacy, safety, citation, review, admission, credential, spend, or production gate.

## One-sentence description

ContextFirst Nexus is a source-grounded case-preparation workspace that helps qualified practitioners organize evidence and examine the relationship between alleged offending and possible trafficking-related coercion, while keeping every consequential conclusion under human review.

## Challenge fit

- Challenge: Call for Code AI, Deploying Responsible AI to Combat Exploitation
- Track: Track 3, Accountability & Justice
- Official problem area: organize evidence, strengthen legal work, improve accountability, and protect affected people through legal processes
- Project focus: trafficking-related forced criminality
- Prototype data: fictional, synthetic adult case material only

The project adapts the official Evidence Timeline & Case Preparation Builder direction, then adds a focused hero artifact, a Charge-Coercion Nexus, to help a practitioner see what is documented, what is only reported, what conflicts, and what remains unknown.

## The problem

In forced-criminality matters, information can be scattered across job offers, messages, travel records, interview notes, task logs, arrest records, and support documents. Practitioners may have little time to:

- reconstruct when recruitment, movement, control, alleged offending, and legal action occurred;
- distinguish a source-supported fact from an allegation or AI interpretation;
- connect alleged offending to possible coercion without overstating the evidence;
- identify contradictions, missing pages, weak provenance, or urgent protection needs;
- prepare a minimum-necessary handoff without exposing unnecessary personal information.

Generic document chat and summarization tools can hide missingness, invent links, flatten contradictions, or produce polished conclusions that are difficult to audit. In this domain, those failures can harm the person described in the case.

## The proposed solution

ContextFirst Nexus turns one permitted case packet into a reviewable workspace containing:

1. A source-linked event timeline.
2. A Charge-Coercion Nexus that connects alleged conduct to recruitment, control or coercion, and timing.
3. Three separate review lanes:
   - trafficking indicators for practitioner review;
   - non-punishment relevance for practitioner review;
   - protection, remedy, and procedural urgency.
4. Contradictions, evidence gaps, unreadable pages, and unsupported claims.
5. Individual accept, edit, reject, or mark-uncertain decisions.
6. A reviewed, redacted practitioner handoff in PDF and structured JSON.
7. An audit history, system card, and synthetic evaluation view.
8. Transparent run provenance and data-flow disclosure without practitioner-facing provider or model controls; the public demo uses a separately labelled deterministic replay.

The system suggests and organizes. A qualified human decides what can be relied on.

## Primary user

A qualified legal-aid, defence, public-defender, court-navigation, or NGO legal practitioner who is authorized to work with the case packet.

The prototype may also be demonstrated to a supervisor or pilot evaluator. Role selection in the prototype is not production authentication.

## Affected stakeholder

The person described in the records is the primary affected stakeholder. They are not the direct user of this prototype.

The prototype is not a survivor chatbot, reporting hotline, emergency service, or automated interview tool. It does not ask a person to retell traumatic experiences to an AI system.

## Core user job

The practitioner needs to answer:

> What does this packet actually document about the relationship between the alleged conduct and possible coercion, what conflicts or remains unknown, and what needs qualified review before a safe legal handoff?

## Hero artifact: Charge-Coercion Nexus

The Charge-Coercion Nexus is a structured, source-linked view of:

- the alleged offence, charge, or sanction;
- recruitment and movement events;
- reported or documented control and coercion;
- compelled tasks or conduct;
- the timing and dependencies between those items;
- supporting evidence, contrary evidence, and missing evidence;
- protection or procedural urgency;
- the review status of every consequential item.

The Nexus is not a trafficking determination, guilt assessment, credibility score, legal eligibility decision, or legal opinion.

## End-to-end prototype flow

1. The landing page explains what the product does and does not do.
2. The practitioner completes a short Case Purpose Brief. The replay-only public demo automatically binds its one selectable bundled deterministic replay release and presents one plain-language Start analysis action; no live provider is silently enabled.
3. The practitioner loads the bundled synthetic case packet.
4. The system shows document coverage, suggested masking, and processing status.
5. The practitioner reviews and completes masking, including the deterministic leak scan.
6. The practitioner explicitly starts analysis. In the public demo this runs only the separately labelled deterministic replay.
7. The system presents active-run source-linked timeline, Charge-Coercion Nexus, and context-gap candidates.
8. The practitioner answers, defers, or preserves context gaps as unknown, opens exact source locations, and reviews candidate items.
9. An early export attempt is blocked because review, citation, privacy, or coverage gates are incomplete.
9. The practitioner rejects or withdraws a critical item, and dependent Nexus items return to unresolved.
10. After required review is complete, the practitioner creates a redacted full handoff or minimum-necessary safe-share export.
11. The demonstration closes with the audit history, system card, and measured synthetic evaluation.

## Information labels

The interface must keep four dimensions visually and semantically separate:

1. Evidence nature: documented in a source, reported or alleged in a source, reviewer-supplied context, or unknown.
2. Item origin: source extraction, AI suggestion, or human-created item.
3. Support status: exact-source supported, partially supported, conflicting, insufficient evidence, citation unresolved, or not processed.
4. Review status: pending, human accepted, human edited, rejected, uncertain, or invalidated.

Each supporting source dependency carries its own evidence nature. The item carries separate origin, support, and review values. Human acceptance must never erase that an item began as an allegation, report, or AI suggestion.

Grounding proves that text was found in the processed source. It does not prove that the source is true, authentic, complete, or legally sufficient.

## Prototype scope

### P0, required for the judged prototype

- Clear use and non-use boundaries.
- Case Purpose Brief and authorized-use attestation.
- One bundled, fictional adult case packet.
- Document coverage and missing-page visibility.
- Human-approved masking and a safe default view.
- Exact source citations with a source drawer.
- Source-linked timeline.
- Charge-Coercion Nexus.
- Three separate review lanes.
- Contradictions, gaps, abstention, and insufficient-evidence states.
- Individual accept, edit, reject, and mark-uncertain actions.
- Evidence withdrawal or rejection that recalculates dependent items.
- Export blocking for unresolved review, citations, coverage, jurisdiction, or privacy issues.
- Reviewed PDF and structured JSON handoffs.
- Minimum-necessary safe-share output.
- Audit history, system card, and a small synthetic Safety Lab.
- One plain-language Start analysis experience with no practitioner-facing provider or model controls.
- Fail-closed automatic binding of exactly one selectable bundled deterministic replay in the current public deployment, with no live provider transmission.
- Consolidated plain-language data-flow disclosure plus detailed provider provenance in Trust, audit, and exports.
- Unpaid Gemini and Mistral processing limited to the bundled synthetic fixture and prohibited for future real, private, client, or survivor material.
- Mistral release configuration `mistral-small-free-v1`, using `mistral-small-2603`, remains unavailable until that exact configuration has a matching passed reviewed static admission record and coordinator-recorded deployed-account availability.
- The unpaid Mistral disclosure conservatively states possible training use unless the account opts out, up to 30-day provider retention, and no zero-data-retention eligibility on the free tier.

### P1, valuable after the core flow works

- A simple actor and organization map.
- Broader run-to-run comparison beyond evidence withdrawal.
- Configurable jurisdiction or guidance packs.
- Multilingual source and translation metadata.
- Supervisor review workflow.
- Non-identifying pilot metrics.
- Durable authenticated case workspaces.

### Explicit non-goals

- Direct survivor self-service.
- Crisis response, hotline, or emergency reporting.
- Live investigations or contact with suspected traffickers.
- Scraping advertisements, social platforms, criminal networks, or private NGO systems.
- Facial recognition, biometrics, identity resolution, or re-identification.
- Cross-case profiling, hotspot detection, or prediction.
- Victim, trafficker, credibility, guilt, legal eligibility, case priority, or risk scoring.
- Automated trafficking or non-punishment decisions.
- Domestic legal advice, filing strategy, or court-ready legal documents.
- Automatic referral, reporting, transmission, or law-enforcement contact.
- Training or fine-tuning models on case data.
- Real case data or child cases in the hackathon prototype.

## Product principles

1. Context before conclusion.
2. Exact sources before fluent summaries.
3. Unknown is a valid and useful result.
4. Contradictions stay visible.
5. Review is an action, not a disclaimer.
6. Cooperation with authorities must not influence evidence analysis.
7. Minimum necessary data by default.
8. No consequential export without completed gates.
9. International guidance informs review but does not replace domestic legal verification.
10. Public claims must match measured prototype evidence.
11. Managed routing is bounded, auditable, admission-gated, and never used to bypass a safety decision; replay is never represented as a live fallback.

## Strongest demo moment

The practitioner rejects or withdraws evidence that supported a key coercion link. The system immediately marks the dependent Nexus item unresolved and blocks export until the practitioner reviews the changed record. This demonstrates source dependency, meaningful human control, and safe abstention in one visible interaction.

## Success criteria

The prototype is successful when a judge can see, in one short flow, that it:

- transforms a messy synthetic packet into a useful case-preparation workspace;
- reveals exact source locations, contrary evidence, and missingness;
- helps a practitioner inspect an alleged-offence-to-coercion relationship without deciding the case;
- prevents unreviewed or unsupported content from entering an export;
- reduces exposure through a redacted, minimum-necessary handoff;
- reports what was measured on synthetic fixtures and is honest about what remains unvalidated;
- remains usable in the public demo through clearly labelled bundled replay with zero provider transmission.

The project must not claim that it identifies victims, proves trafficking, guarantees legal outcomes, or is production ready.

## Pilot direction

A responsible pilot would begin as a supervised shadow workflow with a qualified legal-aid or survivor-serving organization. It would require partner governance, domestic legal review, privacy and security review, provider assessment, authenticated access, retention and deletion rules, incident response, and lived-experience input before any real case data is processed.

## Related product-truth documents

- docs/PRODUCT_SPEC.md
- docs/ARCHITECTURE.md
- docs/CONTRACTS.md
- docs/SAFETY_AND_DATA.md
- docs/DESIGN_SYSTEM.md
- docs/DEMO_AND_FIXTURES.md
- docs/TESTING_AND_EVALUATION.md
- docs/SOURCE_REGISTER.md
- docs/MODEL_ROUTING.md
