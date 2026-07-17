# Safety and Data Policy

## 1. Status and priority

This policy defines mandatory safety, privacy, human-rights, and public-claims boundaries for ContextFirst Nexus.

The words MUST, MUST NOT, SHOULD, and MAY are requirements:

- MUST and MUST NOT are mandatory for the prototype.
- SHOULD is expected unless a documented decision explains why it cannot be met.
- MAY is optional.

If this policy conflicts with another project document, this policy controls. A worker must not silently weaken it.

### 1.1 DEC-045 provider-control boundary

The practitioner MUST NOT choose a provider, model, release, credential, or fallback target. The public deployment remains replay-only and may auto-bind only one selectable local replay release. Zero or multiple selectable services MUST fail closed. Detailed provider provenance remains available in Trust, safe audit, and exports.

Future live routing is server-managed and remains disabled until TASK-040 reconciles the contracts and every evaluation, reviewed static admission, credential, spend, and production gate is separately approved. Managed fallback is limited to classified operational failures with confirmed safe retry semantics. Replay is never part of the live fallback chain. DEC-045 supersedes the manual-selection and manual-switching requirements previously stated in this document.

## 2. Product boundary

ContextFirst Nexus is a hackathon prototype for source-grounded case preparation in trafficking-related forced-criminality matters.

It supports qualified human review. It is not:

- a legal service or source of legal advice;
- a survivor chatbot or automated interview system;
- a crisis, reporting, referral, or emergency service;
- an evidence-admissibility or chain-of-custody system;
- a system for deciding victim status, credibility, guilt, eligibility, or case outcome;
- an autonomous investigative or law-enforcement tool.

The validated demonstration is limited to one clearly fictional synthetic adult case. Real case data, child cases, and public or direct-survivor access are outside the prototype's validated scope.

## 3. Intended users and intended use

### 3.1 Intended user

The primary user is a qualified legal-aid, defence, public-defender, court-navigation, or NGO legal practitioner who is authorized to work with the packet.

Trained case-preparation staff MAY use a future pilot under qualified legal supervision. Prototype role selection is not production identity or access control.

### 3.2 Intended purpose

The product MAY:

- organize one permitted packet, subject to the synthetic and public-data limits below;
- show page and source coverage;
- suggest human-approved masking;
- build a source-linked timeline;
- surface documented or reported coercion and control;
- relate alleged conduct to the timing of possible coercion for review;
- preserve supporting evidence, contrary evidence, conflicts, and gaps;
- suggest trafficking indicators, non-punishment relevance, and protection questions for qualified review;
- prepare a reviewed, redacted, minimum-necessary handoff.

### 3.3 Unsupported purpose

The product MUST NOT:

- interview or classify a survivor;
- create a general-purpose legal opinion;
- replace qualified domestic legal research;
- recommend arrest, surveillance, prosecution, sentence, or benefit denial;
- transmit a case to any external person or institution automatically;
- perform cross-case analytics or identity linking.

## 4. Case Purpose Brief and authority

Processing MUST remain blocked until the practitioner completes a Case Purpose Brief containing:

- practitioner role and organization type;
- authorized purpose;
- intended recipient or handoff;
- supported decision or workflow;
- decisions explicitly excluded from system support;
- stated country or jurisdiction;
- source language and translation status;
- data origin and authorization basis;
- consent status where applicable;
- consolidated analysis data-flow, data-use, and retention acknowledgement without provider controls;
- confirmation that cooperation with authorities is not a condition of analysis.

The interface MUST state that the system cannot verify the user's authority.

The P0 practitioner MUST attest that the selected material is the bundled synthetic fixture. A future harmless-public-material mode would require its own no-personal-data and no-live-investigation attestation. The hackathon prototype MUST reject real survivor, client, or private case material even when the user believes they are authorized to use it.

The Case Purpose Brief may record consent or another authority basis as a future-pilot design field. For the bundled synthetic demo, it is marked Not applicable, synthetic fixture. The product MUST NOT force a future practitioner to claim survivor consent when another lawful basis applies.

An attestation does not transfer accountability to the system. If authority is withdrawn or changes, the product MUST stop new processing or export where applicable.

## 5. Prototype data rule

### 5.1 Permitted data

The public demonstration and evaluation MUST use:

- bundled synthetic material;
- simulated fixture data; or
- clearly authorized public material that introduces no live investigation or personal-data risk.

The judged demo MUST use only the bundled synthetic adult fixture defined in docs/DEMO_AND_FIXTURES.md.

The frozen P0 architecture is narrower than the maximum permitted-data policy: it enables only the bundled synthetic fixture and exposes no arbitrary upload control.

Synthetic data MUST:

- use fictional names, organizations, proceedings, places, and identifiers;
- be clearly labelled synthetic;
- avoid copying a real person's narrative;
- record its fixture version and design provenance;
- avoid gratuitous or graphic detail.

### 5.2 Prohibited data and collection

The prototype MUST NOT:

- process real survivor or client files;
- scrape advertisements, social platforms, active criminal services, or private systems;
- interact with suspected traffickers or conduct a live investigation;
- import private NGO, judge, organizer, or practitioner data;
- train or fine-tune a model on case packets;
- pool packets for cross-case profiling;
- use biometrics, facial recognition, or re-identification;
- process child cases.

If arbitrary upload is implemented, it MUST be separate from the default demo path and MUST require a clear synthetic-or-harmless-public-data acknowledgement before file selection. It MUST reject real, private, client, or survivor material in the hackathon prototype.

## 6. Data classes and minimization

| Class | Description | Required handling |
|---|---|---|
| Raw packet | Original documents and page images | Highest sensitivity; keep an application-managed read-only source copy; never place in logs |
| Extracted material | OCR or parsed text and page locations | Keep linked to the read-only source copy; expose processing quality |
| Working derivative | Redacted or pseudonymized text used for analysis | Send only the minimum needed content |
| AI candidate | Unverified event, link, indicator, gap, or summary | Keep separate from human-reviewed findings |
| Reviewed output | Human-accepted or human-edited material | Export only after all gates pass |
| Fixture and test data | Synthetic packets and aggregate test results | Label clearly and report exact sample size |

The product MUST collect or retain only the fields needed for the stated case purpose.

The product MUST NOT request demographic, health, immigration, disability, or trauma information merely because it could be useful. Such data can be included only when present in a permitted synthetic or harmless public packet, relevant to the stated purpose, and handled with additional care.

The product MUST describe automated detection as suggested masking, redaction, or pseudonymization. It MUST NOT claim anonymization or guaranteed de-identification.

## 7. Redaction and sensitive presentation

### 7.1 Redaction

- Automated identifier detection is a suggestion only.
- The practitioner MUST preview, edit, and approve masking.
- The application-managed source copy MUST remain read-only. A source-content hash SHOULD detect accidental changes, but the prototype MUST NOT describe this as evidentiary immutability or chain of custody.
- The default workspace and exports SHOULD use the approved redacted derivative.
- The system card MUST list the identifier classes the prototype actually tests.
- Unsupported identifier classes MUST be disclosed.

### 7.2 Sensitive content

- The interface SHOULD use a redacted safe view by default.
- Revealing unmasked or sensitive content MUST require an intentional user action.
- The interface SHOULD warn before displaying potentially distressing content.
- The product MAY describe these choices as trauma-aware presentation safeguards.
- The project MUST NOT claim clinically validated trauma-informed design without appropriate validation and lived-experience involvement.

## 8. Data flow, providers, and retention

The P0 architecture uses browser-side PDF.js processing and permits exactly three live analysis providers for approved redacted text:

1. OpenAI using the configured approved model.
2. Google using the stable `gemini-3.5-flash` model.
3. Mistral AI using the exact `mistral-small-2603` release configuration only after its reviewed static admission record marks the exact release as passed, the coordinator records the deployed account release as available, and the configuration is explicitly enabled.

No practitioner-facing provider choice is permitted. Future server-managed live routing may consider only releases with reviewed, version-controlled static admission, in the order OpenAI, Google, Mistral, then a separately evaluated and admitted fourth provider. The public deployment remains replay-only.

The evaluation harness may produce a versioned evidence report and canonical digest, but it MUST NOT change provider selectability. A separate reviewed handoff updates the fail-closed static admission records in `lib/ai/server/admission.ts`. Environment variables, runtime evaluation files, provider responses, configured credentials, and account health MUST NOT promote an unevaluated release.

Implementation and public copy MUST use conservative language and disclose the actual deployed provider, model, service tier, configuration, data flow, data-use terms, and retention limitation.

### 8.1 Prototype requirements

- Raw files SHOULD remain in browser or request-scoped memory where feasible.
- The original MUST never be modified.
- Only the minimum approved redacted text SHOULD leave the device for model analysis.
- API keys MUST remain server-side and MUST never enter the repository or browser bundle.
- P0 MUST use at most one credential per provider release configuration. It MUST NOT pool or rotate multiple accounts or keys to extend quota, bypass billing controls, or evade provider limits.
- The interface and browser response MUST NOT expose API keys, key fragments, secret names, project identifiers, billing identifiers, or raw provider error bodies.
- Raw text, quotes, identities, prompts, and secrets MUST NOT enter application logs, analytics, or error telemetry.
- The prototype SHOULD avoid a durable server-side case database.
- If local browser save or resume is added, it MUST be disclosed and a Reset Case action MUST clear that saved case state. A pending live-analysis request and its recovery metadata MUST remain in browser memory only and MUST NOT enter `sessionStorage` or another durable store.
- Session writes MUST pause while a live request is pending. Refresh MUST restore the prior validated stable snapshot, re-derive case status, and MUST NOT resume or retry the request. The interface MUST NOT infer whether remote processing completed.
- Server processing SHOULD be request-scoped and discard derived content after the response.
- Exports MUST be user-initiated local downloads.
- The product MUST NOT automatically email, upload, file, report, refer, or transmit an output.

### 8.2 Provider disclosure

The system card MUST name, when applicable:

- every provider actually attempted and the provider/release of the final accepted result;
- model name and version or snapshot, exact release configuration, static admission status, and evaluation-report identity when available;
- service tier, including whether Gemini or Mistral is using unpaid or paid service terms;
- content categories sent;
- known processing region if available;
- provider retention setting and known limitation;
- whether provider content is used for model training under the selected service terms;
- for free Mistral, whether training use is enabled or opted out for the actual account, the up-to-30-day abuse-monitoring retention limitation, and the fact that free zero data retention is not enabled or claimed;
- run outcome and a safe failure category for each failed attempt;
- any deterministic replay used during the demo.
- active prepared-checkpoint ID, checkpoint version, replay version, and fixture-reviewer provenance.

The team MAY use a no-store setting where supported, but MUST NOT describe it as zero retention unless the actual provider configuration and terms establish that claim.

The Case Purpose Brief MUST show one consolidated plain-language data-flow disclosure without developer controls. Detailed provider-specific terms and actual attempt provenance remain available in Trust, audit, and exports. TASK-040 must reconcile the exact acknowledgement contract before live routing is implemented.

### 8.3 Gemini unpaid-service boundary

Gemini under unpaid service terms MAY process only the bundled synthetic fixture. The server MUST verify the bundled fixture identity and permitted data origin before sending any content to unpaid Gemini. A client assertion alone is insufficient.

The disclosure for unpaid Gemini MUST state that submitted content and generated responses may be used to improve Google products and may be reviewed by humans under the applicable terms. It MUST state that the option is for the bundled synthetic demonstration only.

Unpaid Gemini MUST NOT process harmless public material, real case material, survivor or client material, private material, or user-entered narrative. Enabling a paid Gemini account in the future does not automatically authorize real-data use or remove the future-pilot requirements below.

### 8.4 Mistral free-service boundary

Free Mistral MAY process only the exact bundled synthetic fixture and only through the exact `mistral-small-2603` release configuration after its reviewed static admission record matches a passed evaluation report and contains a coordinator-recorded `available` deployed-account release status. The server MUST verify the bundled fixture identity, fixture digest, permitted data origin, and static admission before sending any content to free Mistral. A client assertion alone is insufficient.

The disclosure for free Mistral MUST state whether provider training use is enabled or opted out for the actual account. It MUST state that inputs and outputs may be retained for up to 30 days for abuse monitoring, that free zero data retention is not available or claimed for P0, and that the option is limited to the bundled synthetic demonstration.

Free Mistral MUST NOT process harmless public material, real case material, survivor or client material, private material, or user-entered narrative. Enabling a paid Mistral tier in the future does not authorize real-data use and does not remove the future-pilot requirements below.

### 8.5 Managed provider routing and failure recovery

`POST /api/analyze` is a stateless execution route. Its strict `AnalyzeRequest` MUST NOT contain `recoveryOfRunId`, and the route MUST NOT receive, verify, echo, or log recovery linkage. The browser dispatches `start_live_analysis`, validates the current prerequisites, and stores the request plus locally derived recovery metadata as a memory-only pending record before the network call.

The central browser reducer accepts a terminal live response only when it matches the pending start command and unchanged source case revision. Starting a request does not increment that revision, and other material mutations remain blocked while it is pending. The reducer locally validates any recovery relationship against the preserved failed-run history, attaches the recovery metadata to the terminal execution, and appends a separate run without merging outputs. A preflight rejection clears the pending request, creates no run, records only a safe `analysis_preflight_rejected` audit event, and preserves the previously active run.

If the browser receives no parseable response, it MUST dispatch `record_live_analysis_transport_failure` with a fixed safe reason. The reducer MUST clear only the matching pending request, append `analysis_transport_failed`, state that the remote outcome is unknown and no output was accepted, preserve the previously active run, and create no run or recovery link. A later attempt MUST be explicit and unlinked because no verified terminal execution exists.

The System Card MUST keep real runs separate from typed non-run attempt projections. A preflight rejection records not transmitted and not started. A browser transport failure records unknown transmission and unknown remote outcome. Both record `outputAccepted: false`, safe registry and start-command linkage, and no fabricated run.

- Replay MUST never be silently or automatically substituted for live analysis. In the replay-only public deployment it is the declared local service and records `providerTransmission: false`.
- Future live provider changes occur only inside the bounded server-managed policy after TASK-040 contract reconciliation; the practitioner cannot direct them.
- Every attempted provider and the final accepted provider/release MUST retain safe provenance. Outputs from separate attempts MUST NOT be merged.
- A configuration or release rejection before transmission MUST return `run: null`, create no run, and MUST retain only a safe preflight audit event.
- Only provider not configured, authentication failure before processing, quota exhausted, rate limited, confirmed temporary provider unavailability, or confirmed request not executed MAY advance to the next admitted live release.
- The live routing order MUST be OpenAI, Gemini, Mistral, then a separately evaluated and admitted fourth provider, with a hard maximum attempt count. Replay is not in this order.
- Same-provider retry MUST NOT be offered for not-configured, disabled, or authentication failures until the deployment configuration changes.
- Privacy or leak-scan failure, prohibited input, provider refusal, unsafe output, invalid citation, semantic failure, malformed structured output, injection propagation, timeout or transport failure with unknown remote execution, partial or accepted output, and any safety-bypass attempt MUST stop routing.
- Every provider response MUST pass the same canonical schema validation, citation validation, coverage gates, prompt-injection boundary, prohibited-inference checks, privacy checks, and human-review workflow.
- Candidates from a failed or rejected run MUST NOT enter the review workspace or export.
- Error messages MUST use a safe category and local reference ID. They MUST NOT reveal credentials, account state, internal request contents, or raw provider diagnostics.

The deterministic replay is a separate, version-matched local demo mode. It MUST remain visibly labelled replay and MUST never appear as a successful live provider response, fallback result, or fourth live attempt. Replay and checkpoint commands MUST supply only their fixed trusted registry IDs and MUST NOT accept a browser-supplied bundle, URL, persisted artifact, environment-selected artifact, or provider output. The prepared video checkpoint MAY package complete trusted synthetic prerequisite state, one replay run, and ordered fixture-reviewer decisions, but it MUST validate digest, versions, exact counts, single-run ownership, zero quarantined output, decision attribution, and the versioned canonical post-decision outcome hash atomically before mutation. It MUST show both replay provenance and prepared-checkpoint provenance.

### 8.6 Future pilot requirements

A real-data pilot requires, before processing begins:

- authenticated role-based access;
- organization and tenant isolation;
- encryption in transit and at rest;
- partner-approved retention and deletion;
- vendor and data-processing review;
- access and administrative audit logs;
- incident response and breach procedures;
- domestic legal and privacy review;
- secure backup and recovery decisions;
- an approved policy for data-subject access, correction, and withdrawal.

None of these controls may be claimed merely because the hackathon prototype exists.

## 9. Untrusted document and prompt-injection boundary

Every uploaded byte, OCR result, quote, comment, and embedded instruction MUST be treated as untrusted evidence content.

The system MUST:

- keep application instructions separate from document text;
- ignore embedded instructions as commands;
- preserve an embedded instruction as evidence when it is relevant to the case;
- provide models no credentials, browsing, email, filing, or external-action tools;
- request strict structured output;
- validate every returned field before it enters the interface;
- quarantine or flag likely instruction-like content without deleting evidence;
- test quoted exploiter commands, fake system messages, and legitimate legal text that may resemble an attack.

A prompt-injection detector MAY provide an advisory signal. It MUST NOT decide that evidence should be hidden, deleted, or excluded. A product such as Prompt Guard MUST be benchmarked on the actual fixtures before adoption and must not be added merely for brand recognition.

No prompt-injection control may be described as perfect protection.

## 10. Source grounding and epistemic integrity

### 10.1 Citation requirements

Every source-supported candidate MUST carry:

- document ID and display title;
- source type;
- page or equivalent locator;
- stable segment ID;
- exact quote;
- character interval or page coordinates when available;
- original language and translation status;
- extraction or OCR status;
- speaker or source authority when supported;
- date or date range when supported;
- current epistemic and reviewer state.

The system MUST deterministically resolve the quote against the extracted source. Only multiple bounded exact-codepoint occurrences of the quoted text inside one known, available, allowlisted, candidate-eligible canonical segment MAY enter case state as a pending candidate with `supportStatus: citation_unresolved` and a range-null `ambiguous_match` citation. It MUST remain blocked until the practitioner resolves it through the typed `resolve_citation` command or rejects the candidate. Multiple normalized-only matches, cross-segment ambiguity, unknown or unavailable sources, non-candidate-eligible segments, and unbounded ambiguity MUST be quarantined and MUST NOT enter case state. A normalized lookup may validate an exact citation only when it produces one unique mapped range.

The citation component MUST NOT set validity, support, or review status directly. The central reducer MUST confirm that the citation is currently ambiguous in the active successful run, recompute the selected range with the pure resolver, update canonical case state, append a `CitationResolutionDecision` and safe audit event, stale the export gate, and recalculate affected support without automatically accepting the candidate.

### 10.2 Required information separation

The product MUST visually and semantically separate:

- source-supported text;
- reported or alleged statements;
- official allegations;
- AI suggestions;
- human-accepted or human-edited findings;
- unknown, conflicting, or insufficient evidence.

A human edit without a source citation MUST be labelled reviewer-authored interpretation.

Grounding establishes that quoted text exists in the processed source. It does not establish truth, authenticity, admissibility, legal sufficiency, or credibility.

### 10.3 Coverage

The product MUST show unreadable, missing, skipped, excluded, and failed pages.

It MUST NOT state or imply that the full packet was reviewed when coverage is incomplete. Critical coverage failure MUST block dependent findings and export.

### 10.4 Legal and guidance material

Every guidance card MUST show:

- issuing body;
- document title;
- jurisdiction or scope;
- publication or version date;
- binding law, treaty, guidance, indicator, report, or framework label;
- exact passage and source link;
- last verified date;
- local legal verification required notice when appropriate.

International guidance MUST NOT be presented as automatic domestic law or an individual legal conclusion. Stale, mismatched, or unverified jurisdiction material MUST block domestic legal claims.

## 11. Meaningful human review

AI MAY extract, organize, link, summarize, suggest, and surface gaps. A qualified practitioner controls every consequential finding and export.

The product MUST:

- require individual accept, edit, reject, or mark-uncertain action;
- provide no bulk approve action;
- show supporting evidence, contrary evidence, timing, unknowns, and dependencies together;
- preserve the original suggestion when a human edits it;
- record reviewer action, reason, time, run, and version metadata;
- retain failed run records with provider, model, service tier, run mode, safe failure category, acknowledgement version, and attempt time;
- invalidate or reopen dependent items when evidence changes;
- block export while required review is incomplete;
- provide a report-unsafe-or-misleading-output action.

Human review is not satisfied by a disclaimer, a checkbox at the end, or a hidden approval default.

Prototype role selection MUST NOT be described as production authentication or proof of reviewer qualification.

## 12. Prohibited decisions, inferences, and uses

The system MUST NOT decide, classify, predict, recommend, or score:

- trafficking or victim status;
- trafficker identity;
- guilt, innocence, intent, or liability;
- credibility, truthfulness, or reliability of a person;
- legal eligibility or entitlement;
- non-punishment outcome;
- prosecution, arrest, surveillance, sentence, or case priority;
- dangerousness, recidivism, or future conduct;
- resource priority based on an individual risk score.

The system MUST NOT infer adverse credibility or voluntariness from:

- silence;
- inconsistent memory;
- delayed disclosure;
- incomplete records;
- initial consent to work or travel;
- refusal to report;
- non-cooperation with authorities;
- trauma, disability, or mental-health information.

The system MUST NOT convert poverty, nationality, race, ethnicity, sex, gender, disability, migration status, health, religion, or trauma into risk or credibility scores.

The system MUST NOT:

- identify or accuse a suspected trafficker;
- recommend arrest, surveillance, prosecution, or public exposure;
- link identities across cases;
- condition analysis, assistance, or export on testimony or cooperation;
- automatically contact authorities, legal aid, NGOs, courts, or services;
- file a document or replace jurisdiction-specific legal advice;
- generate public survivor stories, sensational content, or persuasive rewrites of testimony.

## 13. Safe failure and abstention

Valid outcomes include:

- Unknown
- Conflicting
- Insufficient evidence
- Manual review required
- Not processed
- Citation unresolved
- Coverage incomplete

### Failure behavior

| Failure | Required response |
|---|---|
| OCR or parsing failure | Preserve original, identify exact page and failed stage, permit targeted retry, block affected findings |
| Model timeout | Preserve completed safe work, show failure, retry only the failed stage |
| Invalid structured response | Reject the response; do not use a prose fallback or partial brief |
| Provider rate limit, quota, or confirmed transient outage | Retain safe attempt provenance and advance only within the bounded admitted managed order; never enter replay |
| Provider not configured before a run | Record a safe non-run attempt and advance only when the next live release is currently admitted; never fabricate a run |
| Provider service tier unavailable | Fail closed unless the failure is classified as confirmed temporary unavailability under the reconciled managed-routing contract |
| Provider authentication failed | Advance only when failure is confirmed before processing; otherwise stop with unknown remote outcome |
| Provider refusal, safety block, or semantic-policy failure | Preserve the failed or rejected run; do not offer provider switching as a bypass |
| Missing or ambiguous citation | Block candidate acceptance and export until resolved or rejected |
| Unsupported indicator | Reject or mark insufficient evidence and record the reason |
| PII leak | Block provider transmission or export and show the affected check |
| Unauthorized use | Block processing |
| Reviewer-gate bypass | Block action and record a safety event |
| Service outage | Preserve local work where safe; never fabricate completion |
| Negative-control packet | Abstain; do not force a trafficking or non-punishment relationship |

A deterministic bundled replay MAY protect the public demonstration as its declared local replay-only service. It is clearly labelled and never presented as live AI. It MUST NOT start as a fallback after a live-provider failure and does not erase, replace, or convert a failed live attempt.

## 14. Evidence change and dependency rules

Each timeline event, Nexus relationship, review-lane item, and export statement MUST retain its evidence dependency IDs.

When a source or evidence item is:

- rejected;
- withdrawn;
- replaced;
- found unreadable;
- found to have an invalid citation; or
- excluded under changed authority,

the system MUST:

1. recalculate only affected dependencies;
2. preserve unaffected reviewer decisions;
3. mark newly unsupported items unresolved or insufficient;
4. revoke export readiness;
5. show the practitioner what changed and why;
6. require renewed review before export.

## 15. Export and sharing policy

### 15.1 Export gate

Export MUST remain blocked for:

- incomplete Case Purpose Brief;
- incomplete consequential review;
- unresolved citation;
- critical missing or unreadable coverage;
- stale or wrong-jurisdiction guidance used for a domestic claim;
- unresolved dependency after evidence change;
- failed redaction or PII check;
- failed processing or safety validation;
- content outside the stated purpose or minimum necessity.

There MUST be no critical-gate override in the hackathon prototype.

### 15.2 Export contents

Exports MUST include only accepted or human-edited, redacted material needed for the stated purpose.

They MUST include:

- exact source references;
- supporting and contrary evidence;
- unresolved gaps and coverage limits;
- guidance versions and scope;
- reviewer decisions;
- selected provider, model, service tier, run mode, and validation provenance;
- limitations;
- synthetic case and not-legal-advice labels.

They MUST exclude by default:

- raw full documents;
- unreviewed or rejected candidates;
- hidden prompts;
- provider or API logs;
- unnecessary identifiers;
- sensitive details not required for the recipient.

### 15.3 Export labels and downstream control

Every demo PDF MUST state:

- AI-assisted, human-reviewed case-preparation draft.
- Synthetic case.
- Not legal advice.
- Local legal verification required.

Exports are local downloads. The interface SHOULD warn that deleting a local export cannot delete downstream copies already shared outside the application.

## 16. Threat and control register

| Threat | Primary affected party | Required prevention | Required detection or test | Stop condition |
|---|---|---|---|---|
| Unauthorized or over-broad use | Person described in packet | Purpose brief and authorization attestation | Missing-attestation fixture | Block processing |
| PII leakage or re-identification | Person and related people | Minimum data, human-approved masking, no raw logs | Seeded identifier fixture and export scan | Block provider call or export |
| Malicious document instructions | Practitioner and affected person | Untrusted-document boundary and no model tools | Embedded-instruction fixture | Reject unsafe output |
| Hallucinated fact or law | Practitioner and affected person | Structured output, exact citations, guidance metadata | Fabricated-quote and stale-guidance fixtures | Block candidate or export |
| Hidden missingness | Practitioner and affected person | Page-level coverage manifest | Missing and unreadable page fixture | Block affected finding |
| Wrong jurisdiction | Affected person | Scope labels and local-verification warning | Mismatched-jurisdiction fixture | Block domestic legal claim |
| Human-review bypass | Affected person and recipient | Individual review and no bulk approve | Early export and bypass tests | Block export |
| Dependency drift | Affected person and recipient | Stable dependency IDs and recalculation | Evidence-withdrawal fixture | Reopen review |
| Sensitive logging | Person described in packet | Content-free logs and server-side secrets | Log inspection test | Fail release gate |
| Provider retention or outage | Person and practitioner | Minimal redacted payload, provider-specific acknowledgement, free-Mistral fixture restriction, and honest disclosure | Three-provider configuration review, free-Mistral data-control check, manual recovery test, and outage fixture | Disable or label affected feature |
| Sensitive-content exposure | Practitioner and affected person | Safe default view and reveal warning | Manual UI check | Hide until intentional reveal |

## 17. Trust boundaries

The architecture and threat model MUST explicitly cover:

- browser to application server;
- application server to model or OCR provider;
- application-managed read-only source copy to redacted working derivative;
- AI candidate to human-reviewed finding;
- reviewed case to exported handoff.

The following are outside prototype assurance and are future pilot gates:

- production authentication and authorization;
- secure multi-tenant storage;
- malware and digital-forensics handling;
- evidentiary chain of custody and admissibility;
- a compromised end-user device;
- a malicious authorized practitioner;
- child-specific safeguards;
- guaranteed provider deletion;
- broad multilingual or cross-jurisdiction validity.

These limitations MUST be disclosed rather than hidden.

## 18. Public claims policy

### 18.1 Permitted when true

The project MAY say:

- working hackathon prototype;
- uses synthetic fixtures;
- AI-assisted and source-linked;
- human-reviewed;
- exact fixture count and measured result;
- observed prototype latency and cost;
- designed with reference to published international guidance.

### 18.2 Prohibited or conditional

The project MUST NOT claim:

- victims identified or traffickers caught;
- trafficking detected or proved;
- legal advice or guaranteed legal outcome;
- universal accuracy, safety, or jurisdictional validity;
- production readiness;
- guaranteed anonymity or zero retention;
- perfect prompt-injection protection;
- compliance certification that was not independently established;
- clinically validated trauma-informed design;
- endorsement, partnership, validation, co-design, or approval by the UN, OHCHR, OSCE, ILO, NIST, OWASP, Austin AI Hub, Call for Code, a judge, or an NGO without written evidence.

Use:

- designed with reference to published UN and human-rights guidance;
- deterministically matched to extracted source text;
- suggests identifiers for human-approved masking;
- suggests issues for qualified practitioner review.

Do not use:

- UN-approved;
- verified true evidence;
- automatically anonymized;
- determines victim status;
- legally validated.

## 19. Required safety acceptance checks

Before the prototype can be called demo-ready:

1. Missing authorization attestation blocks processing.
2. Synthetic-only and no-real-data labels are visible.
3. An embedded prompt is ignored as a command and retained safely as source content.
4. A fabricated quote, multiple normalized-only matches, or any other unsafe ambiguity cannot enter case state. Repeated exact-codepoint text at bounded ranges within one eligible segment may enter only as a pending `citation_unresolved` item and cannot be accepted or exported before canonical resolution.
5. A missing critical page is visible and blocks affected export.
6. A negative packet causes abstention.
7. Silence or non-cooperation creates no adverse inference.
8. Incomplete human review blocks export.
9. No bulk approve control exists.
10. Rejecting evidence recalculates dependent Nexus items.
11. Export contains only reviewed, redacted content and required provenance.
12. Supported seeded identifiers are absent from the safe-share export.
13. Reset Case clears any disclosed local case state.
14. Application logs contain no raw packet text, prompts, quotes, identifiers, or secrets.
15. The system card accurately describes attempted providers, the final accepted provider/model/release when applicable, service tier, data flow, data-use terms, retention limitation, run mode, fixture count, and known limitations.
16. The practitioner interface exposes no provider or model selector. The public deployment binds only the sole selectable local replay and reports zero provider transmission.
17. Future managed routing follows the admitted OpenAI, Gemini, Mistral, then separately evaluated fourth-provider order and records safe attempt provenance without merging outputs.
18. Refusal, safety, privacy, citation, schema, and semantic-validation failures stop managed routing and cannot be bypassed by another provider.
19. Unpaid Gemini is blocked for every data origin except the verified bundled synthetic fixture.
20. Free Mistral is blocked until exact release `mistral-small-2603` has a matching passed static admission and coordinator-recorded deployed-account availability, is blocked for every data origin except the exact verified bundled synthetic fixture, and discloses its training-use or opt-out state, up-to-30-day retention limitation, and lack of free zero data retention.
21. The live-analysis request contains no recovery link, the memory-only pending request is never persisted, and the central reducer alone validates and attaches local recovery metadata.
22. A preflight rejection creates no run and preserves the previously active run.
23. Manual citation resolution changes validity only through `resolve_citation`, canonical state, a resolution decision, and a safe audit event.
24. Evaluation output alone cannot enable a provider. Selectability comes only from the reviewed, fail-closed static admission handoff, never from environment values, runtime files, provider responses, or pooled keys.
25. A missing or unparseable browser response clears pending state through the safe transport-failure command, records unknown remote outcome and no accepted output, preserves the prior active run, and creates no run or recovery link.
26. Replay and checkpoint commands accept only fixed trusted IDs. A bundle mismatch, foreign run record, corrupted prerequisite, wrong decision order, or canonical outcome-hash mismatch is rejected atomically without changing case state.
27. Review components submit only narrow non-withdraw intent. Central policy derives immutable decisions, and withdrawal enters only through the dedicated command.

## 20. Source basis

This policy is informed by the official challenge rules and published human-rights, anti-trafficking, data-governance, AI-risk, and application-security material registered in docs/SOURCE_REGISTER.md.

Key traceability:

- HACK-001 through HACK-003 inform the synthetic-data, privacy, human-oversight, and prohibited-surveillance boundaries.
- INT-002 and INT-004 inform the non-punishment review boundary and the rule that cooperation cannot control analysis.
- IND-001 informs transparent indicator categories for further inquiry, not classification.
- FC-002 informs the known, unknown, conflicting, and overlooked-information workflow.
- HR-002 informs data minimization, transparency, participation, and accountability.
- RAI-001 and RAI-002 inform the risk register, testing, provenance, and public limitations.
- SEC-001 informs the untrusted-document and prompt-injection boundary.

The sources guide product design. They do not establish domestic law, certification, endorsement, or an individual case conclusion.
