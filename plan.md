# Synthetic packet chooser and PDF removal, 2026-07-27

## 1. Goal

Give judges one-click access to the real synthetic PDF packet and let users
remove individual PDFs from browser-created cases.

## 2. Problem

The current Add PDFs action opens the local picker directly, and processed
documents can be replaced but not removed.

## 3. Proposed solution

- Open a compact two-choice modal from Add PDFs: local upload or bundled
  synthetic packet.
- Fetch the bundled PDFs as browser `File` objects and run the unchanged real
  extraction, masking, coverage, persistence, and analysis-input pipeline.
- Require confirmation before replacing an existing packet with the bundle.
- Add a confirmed Remove PDF action that reprocesses and persists the remaining
  files, or returns the case to an empty packet when the final PDF is removed.
- Keep the single-file Remove PDF action and add a compact adjacent menu for
  selecting multiple PDFs or clearing the complete packet.

## 4. Files to change

- Browser-created Documents workspace and document-card actions
- Browser-case packet persistence helper
- Bundled synthetic public PDF assets
- Focused browser-created Documents tests

## 5. Step by step tasks

1. [x] Bundle the generated PDFs as immutable public demonstration assets.
2. [x] Add the Add PDFs source-choice modal and real bundle loader.
3. [x] Add confirmed per-document removal and empty-packet handling.
4. [x] Add focused chooser, loading, replacement, and removal tests.
5. [x] Run focused tests, typecheck, build, and diff check.
6. [x] Add selective multi-PDF and confirmed remove-all actions.

## 6. Acceptance criteria

- Add PDFs presents local upload and synthetic packet choices.
- Synthetic loading processes actual PDF bytes and injects no analysis result.
- Existing packets are never silently mixed with or replaced by the bundle.
- Removing a source updates files, packet state, digest, coverage, masking, and
  analysis freshness through existing canonical behavior.
- Selective removal reprocesses only the retained packet; remove-all clears
  browser-stored files only after explicit confirmation.
- Removing the last source restores the polished empty state.

## 7. Testing plan

- Focused browser-created Documents component tests.
- Typecheck, production build, and `git diff --check`.

## 8. Open questions

- None. This slice remains browser-local and adds no server file storage.

# Synthetic judge packet for dynamic analysis, 2026-07-27

## 1. Goal

Create a polished, fully fictional PDF packet that exercises real document
ingestion, masking, Structured Analysis, Evidence Gaps, the Charge-Coercion
Nexus, and Timeline without preloading application results.

## 2. Problem

The demo needs internally consistent source material with explicit dates,
cross-document anchors, controlled conflicts, and honest missing information.
Random PDFs cannot reliably demonstrate the source-grounded workflow.

## 3. Proposed solution

Freeze one non-graphic fictional case blueprint, then generate 14 descriptive
PDFs plus three generic-filename PDFs. Every page will visibly state that it is
a synthetic training record. Results must still be discovered from extracted
PDF text by the selected analysis mode.

## 4. Files to change

- `docs/SYNTHETIC_DEMO_PACKET_BLUEPRINT.md`
- `scripts/generate-synthetic-judge-packet.py`
- Generated files under `output/pdf/cfn-nila-verin-packet/`

## 5. Step by step tasks

1. [x] Freeze identities, chronology, source anchors, contradictions, and gaps.
2. [x] Generate 17 searchable, visibly synthetic PDFs.
3. [x] Extract and validate the generated text and page counts.
4. [x] Render representative pages and inspect visual quality.

## 6. Acceptance criteria

- All files are fictional, non-graphic, searchable, and visibly synthetic.
- The packet covers all six Nexus categories without stating a legal conclusion.
- Timeline sources include exact, range, approximate, conflicting, and unknown
  date conditions.
- Supported identifier patterns exist for the real masking workflow.
- Generic filenames remain classifiable from their contents.

## 7. Testing plan

- Programmatic PDF open, page-count, text-layer, disclaimer, and anchor checks.
- Render and inspect representative recruitment, message, ledger, police,
  intake, and generic-filename pages.

## 8. Open questions

- None for packet generation. Browser-local and live-AI application runs remain
  separate manual verification steps after the packet is reviewed.

# OpenAI GPT-5.6 model switchboard, 2026-07-27

## 1. Goal

Allow the OpenAI analysis model to switch safely between GPT-5.6 Sol, Terra,
and Luna through one server-side environment setting.

## 2. Problem

`OPENAI_MODEL` is documented but the runtime release, contracts, provenance,
and admission binding are currently frozen to Sol, so changing the environment
value alone does nothing.

## 3. Proposed solution

- Add one canonical allowlist for the three approved GPT-5.6 model IDs.
- Resolve `OPENAI_MODEL` server-side, default to Sol, and fail closed for an
  unsupported value.
- Use the resolved model consistently in the registry, adapter, provenance,
  admission digest, and truthful display name.
- Preserve the existing prompt, reasoning effort, schema, safety gates, and
  provider behavior.

## 4. Files to change

- OpenAI model configuration and shared provider contract
- Provider registry, admission binding, and fallback provenance
- Focused contract, registry, and OpenAI adapter tests
- `.env.example`

## 5. Step by step tasks

1. [x] Add the canonical GPT-5.6 model allowlist and resolver.
2. [x] Connect the resolved model across runtime and provenance.
3. [x] Add focused valid/default/invalid configuration tests.
4. [x] Run focused tests, typecheck, build, and `git diff --check`.

## 6. Acceptance criteria

- `OPENAI_MODEL=gpt-5.6-sol`, `gpt-5.6-terra`, or `gpt-5.6-luna` selects that
  exact model after restart.
- Unsupported model values fail closed before any provider call.
- Canonical provenance and UI disclosure show the exact selected model.
- Switching does not weaken admission, structured output, citation, or privacy
  validation.

## 7. Testing plan

- Focused OpenAI adapter, registry/admission, and provider-contract tests.
- Typecheck, production build, and `git diff --check`.

## 8. Open questions

- None. Production environment changes and live paid calls remain separate,
  explicitly approved actions.

# Gemini dynamic analysis and explicit mode choice, 2026-07-27

## 1. Goal

Connect Gemini to the existing browser-created-case live-analysis pipeline and
make the existing private-browser versus live-AI choice explicit, without
changing or enabling Mistral.

## 2. Problem

OpenAI and Groq already have dynamic browser-packet executors, while Gemini is
still restricted to the bundled fixture. The Analysis screen exposes separate
actions but does not present one clear two-mode choice.

## 3. Proposed solution

- Reuse the existing Gemini structured-output transport for approved redacted
  browser-case input.
- Keep server-managed provider order in `ANALYSIS_PROVIDER_ORDER`; disabled or
  unconfigured Mistral remains skipped.
- Add a compact Browser analysis / Live AI selector to Structured Analysis.
- Preserve consent, admission, privacy, citation, schema, and canonical
  post-validation gates.

## 4. Files to change

- Gemini adapter and dynamic orchestrator
- Browser-created Structured Analysis workspace
- Focused Gemini, routing, and Structured Analysis tests
- Environment documentation only where needed

## 5. Step by step tasks

1. [x] Add the browser-packet Gemini executor without weakening fixture checks.
2. [x] Connect Gemini to managed routing and provider provenance.
3. [x] Add the explicit two-mode selector.
4. [x] Add focused adapter, routing, and UI regressions.
5. [x] Run focused tests, typecheck, build, and diff check.

## 6. Acceptance criteria

- Browser analysis never calls a provider.
- Live AI sends only the approved redacted canonical projection.
- Gemini can participate in the configured chain for eligible admitted input.
- Provider order changes require configuration only, not code changes.
- Mistral code and release policy are unchanged.

## 7. Testing plan

- Focused Gemini adapter, managed routing, dynamic orchestrator, and browser
  Structured Analysis component tests.
- Typecheck, production build, and `git diff --check`.

## 8. Open questions

- A real Gemini key and approved live evaluation are still required before
  static admission or public enablement.

# Offline browser-pipeline quality evaluation, 2026-07-26

## 1. Goal

Create a repeatable, credit-free evaluation that exercises the real
browser-created-case pipeline from approved redacted source text through
analysis and canonical downstream consequences.

## 2. Problem

The repository has focused unit/component coverage and a separate
provider-admission harness, but it lacks one readable quality report for the
arbitrary-packet deterministic pipeline. Route rendering alone cannot prove
source grounding, abstention, privacy blocking, freshness, or downstream
state integrity.

## 3. Proposed solution

- Run frozen synthetic scenarios with expectations written before execution.
- Exercise the real corpus preparation, deterministic analysis, canonical case
  state, commands, freshness checks, persistence projection, and export gate.
- Measure exact citations, required lane coverage, correct abstention,
  privacy/stale blocking, audit consequences, and planning-data separation.
- Emit deterministic JSON and Markdown reports with zero provider calls.
- Keep the scenario/check format reusable for later admitted-provider
  comparisons without treating this local run as provider admission.

## 4. Files to change

- Offline evaluation runner under `lib/evaluation`
- Evaluation command and focused unit tests
- Frozen safe result artifacts and testing documentation

## 5. Step by step tasks

1. [x] Inspect the existing evaluation and canonical pipeline.
2. [x] Define frozen relevant, irrelevant, mixed, blocked, stale, and
   downstream scenarios.
3. [x] Implement the reusable runner and readable report.
4. [x] Add focused regression assertions and documentation.
5. [x] Run the evaluation, focused tests, typecheck, build, and diff check.

## 6. Acceptance criteria

- The suite makes no network or provider call.
- Relevant synthetic text produces expected source-grounded review structures.
- Unrelated and advisory material produces no fabricated candidates.
- Privacy-incomplete and stale inputs fail closed.
- Canonical commands create audit-backed downstream state without changing
  evidence or leaking planning text into export projections.
- Output is deterministic, safe to commit, and honest about its limitations.

## 7. Testing plan

- Run the new offline pipeline evaluation twice and compare canonical digests.
- Run its focused unit test, TypeScript, production build, and
  `git diff --check`.

## 8. Open questions

- None for this credit-free deterministic suite. Live-provider quality runs
  remain separately approved, metered, and admission-gated.

# Packet-wide masking review, 2026-07-26

## 1. Goal

Let a practitioner review every detected identifier across a multi-PDF packet
quickly, while keeping the existing deterministic privacy gate fail closed.

## 2. Problem

Mask suggestions are currently reviewed one document at a time. A practitioner
must manually locate each page, and there is no guarded packet-wide approval
action for already detected suggestions.

## 3. Proposed solution

- Add one packet review queue grouped by document and page, with reviewed
  progress and previous/next unresolved navigation.
- Jump from a queue item to its exact PDF page and highlighted overlay.
- Add an explicitly confirmed `Apply all detected masks` action that approves
  only current pending automatic detections.
- Immediately run the existing deterministic leak scan after bulk approval.
- Keep all masks individually editable or removable and invalidate the privacy
  result whenever a later decision changes.

## 4. Files to change

- Documents packet workspace and document-card navigation
- Masked PDF preview
- A compact packet masking queue component
- Focused Documents and redaction tests

## 5. Step by step tasks

1. [x] Build the canonical packet-wide queue and progress projection.
2. [x] Connect queue navigation to the selected document, page, and overlay.
3. [x] Add guarded bulk approval for current automatic detections.
4. [x] Run and persist the deterministic leak scan after bulk approval.
5. [x] Verify individual correction/removal still invalidates the saved result.

## 6. Acceptance criteria

- Every current suggestion appears under its real document and page.
- Previous/next unresolved controls and queue rows open the exact highlighted
  location.
- The bulk action states its limitations and requires explicit confirmation.
- Manual selections and already reviewed items are not silently bulk changed.
- Approved overlays become black and remain individually editable/removable.
- Analysis stays blocked whenever review is unresolved or the leak scan fails.

## 7. Testing plan

- Focused packet queue, visual navigation, bulk approval, and privacy-gate tests.
- Typecheck, production build, and `git diff --check`.

## 8. Open questions

- None for this browser-local slice. OCR and semantic name detection retain
  their existing explicit limitations.

# Source-grounded review prioritization, 2026-07-26

## 1. Goal

Make browser-local Structured Analysis results more useful by reducing repeated
review prompts and placing the clearest source-grounded items first.

## 2. Problem

The hardened deterministic engine now suppresses unrelated technical material,
but repeated language across pages or documents can still create a noisy queue.
The current order also does not explain which items deserve earlier human
attention.

## 3. Proposed solution

- Consolidate genuinely repeated rule matches without losing any exact source
  locations.
- Order candidates using transparent deterministic review signals such as an
  explicit phrase, nearby case context, and multiple independent source
  locations.
- Show a plain-language review-order reason. This is not a confidence,
  credibility, truth, risk, or legal-strength score.
- Preserve zero-result behavior, exact citations, canonical review commands,
  dependency recalculation, and the three separate lanes.

## 4. Files to change

- Browser-local deterministic analysis builder and candidate contract
- Structured Analysis candidate presentation
- Focused deterministic-analysis and Structured Analysis tests

## 5. Step by step tasks

1. [x] Collect, consolidate, and deterministically order rule matches.
2. [x] Preserve every exact citation and source dependency after consolidation.
3. [x] Display transparent review-order labels and reasons.
4. [x] Verify relevant, irrelevant, duplicate, and mixed packets.

## 6. Acceptance criteria

- Repeated matching text does not create redundant candidate cards.
- Consolidated candidates retain each distinct exact source location.
- Explicit, context-rich, or independently repeated source language appears
  earlier with a truthful reason.
- The UI states that review order is not evidence strength or a legal finding.
- Unrelated packets still produce zero candidates.
- No canonical review, gap, Nexus, Timeline, Export, or Audit behavior weakens.

## 7. Testing plan

- Focused deterministic-analysis and Structured Analysis tests.
- Typecheck, production build, and `git diff --check`.

## 8. Open questions

- None. Live-provider quality evaluation and admission remain separate.

# Analysis precision hardening, 2026-07-26

## 1. Goal

Prevent unrelated uploaded material from producing misleading Structured
Analysis candidates while preserving source-grounded review of relevant case
material.

## 2. Problem

The browser-local fallback currently treats broad single-word matches such as
technical uses of `border` as case-review signals. This can create a
source-grounded but contextually incorrect candidate from technical,
hackathon, source-code, or résumé PDFs.

## 3. Proposed solution

- Screen each document and segment for strong unrelated-material signals.
- Require contextual combinations for broad review terms and remove standalone
  false-positive rules.
- State the exact matched phrase and the deterministic reason on every local
  candidate.
- Present an admitted live provider as the preferred semantic option only
  after explicit transmission consent, with the hardened browser-local engine
  retained as a private fallback.

## 4. Files to change

- Browser-local deterministic analysis builder and freshness binding
- Browser-created Structured Analysis start experience
- Focused deterministic and Structured Analysis tests

## 5. Step by step tasks

1. [x] Add document and segment scope assessment.
2. [x] Replace broad matches with contextual review rules.
3. [x] Add exact trigger phrase and rule rationale to local candidates.
4. [x] Prefer admitted live analysis without bypassing explicit consent.
5. [x] Verify unrelated, mixed, and representative synthetic inputs.
6. [x] Run the representative judge path and release checks.

## 6. Acceptance criteria

- Technical, hackathon, source-code, résumé, and similar unrelated material can
  truthfully complete with zero candidates.
- Standalone CSS/security `border` never creates a movement candidate.
- Broad terms require relevant person, event, location, transport, proceeding,
  safety, or support context.
- Every local candidate displays its exact matched phrase and why the rule
  triggered.
- Live analysis is the preferred admitted option after explicit consent;
  browser-local analysis remains available and sends nothing.
- A representative synthetic case still produces source-grounded candidates
  across the appropriate lanes.

## 7. Testing plan

- Focused deterministic-analysis and browser-created Structured Analysis tests.
- Typecheck, production build, `git diff --check`, and one representative
  browser smoke before release.

## 8. Open questions

- None. Provider availability remains an external runtime condition and must
  continue to fail closed.

# Truthful minimum-necessary candidate selection, 2026-07-26

## 1. Goal

Keep the safe-share selection aligned with the canonical export projection.

## 2. Problem

Informational Nexus rows are intentionally non-reviewable and are not included
by the canonical reviewed-candidate export projection, but the UI currently
tells users to complete an impossible individual review for those rows.

## 3. Proposed solution

Exclude optional informational rows from the selectable evidence list and
label derived summaries according to dependency review rather than individual
review. Keep every export gate and manifest rule unchanged.

## 4. Files to change

- Export workspace
- Focused Export workspace test

## 5. Step by step tasks

1. [x] Align visible selection rows with exportable canonical records.
2. [x] Add truthful copy for excluded informational rows and derived summaries.
3. [x] Verify the gate still fails closed.

## 6. Acceptance criteria

- No impossible review instruction appears for optional Nexus rows.
- Individual evidence still requires accepted or edited review.
- Rejected evidence remains visibly excluded.
- Canonical gate, dependency closure, and manifest behavior are unchanged.

## 7. Testing plan

- Focused Export workspace test, typecheck, and `git diff --check`.

## 8. Open questions

- None.

# Structured Analysis review queue, 2026-07-26

## 1. Goal

Make source-grounded candidate review faster without weakening individual
human decisions or changing canonical evidence logic.

## 2. Problem

The current analysis can produce many legitimate review candidates, but the
reviewer must manually find the next pending item after every decision.

## 3. Proposed solution

Add compact previous/next pending-candidate controls to the existing Lovable
master-detail review panel. The controls change only local selection; every
decision still uses the existing canonical review command.

## 4. Files to change

- Structured Analysis workspace
- Focused Structured Analysis component test

## 5. Step by step tasks

1. [x] Derive the pending queue from the current visible canonical projection.
2. [x] Add accessible compact previous/next controls.
3. [x] Verify navigation does not record or skip a review decision.

## 6. Acceptance criteria

- Queue counts come from current canonical candidates.
- Navigation never changes review state.
- Hidden candidates are never displayed.
- Review decisions remain one-at-a-time canonical commands.

## 7. Testing plan

- Focused Structured Analysis test, typecheck, and `git diff --check`.

## 8. Open questions

- None.

# Submission verification hardening, 2026-07-26

## 1. Goal

Make the repository's official verification command evaluate first-party code
cleanly without treating copied PDF/OCR runtime assets as application source.

## 2. Problem

Unit, contract, and component tests pass, but lint scans generated vendor
runtimes under `public/vendor` and reports their minified internals. Four small
first-party test/application lint findings also remain.

## 3. Proposed solution

- Exclude immutable copied browser runtimes from lint.
- Fix the small first-party navigation and unused-binding findings.
- Keep the live-evaluation test's intentionally dynamic SDK fixtures explicitly
  scoped instead of weakening application lint rules.

## 4. Files to change

- ESLint configuration
- The affected shell/state files
- The three affected focused test files

## 5. Step by step tasks

1. [x] Exclude copied vendor runtimes.
2. [x] Resolve all first-party lint findings.
3. [x] Run lint, typecheck, focused/full regression checks, build, and diff check.

## 6. Acceptance criteria

- `npm run lint` passes.
- Generated PDF/OCR runtime files remain unchanged.
- No application behavior, canonical state, or Lovable presentation changes.

## 7. Testing plan

- Lint, typecheck, existing unit/contract/component suites, build, and
  `git diff --check`.

## 8. Open questions

- None.

# Minimum-necessary safe-share completion, 2026-07-26

## 1. Goal

Complete the browser-created-case handoff path without weakening the existing
human-review, source-grounding, privacy, or dependency safeguards.

## 2. Problem

Browser-created analysis currently gives every candidate an empty safe-share
recipient list, so an otherwise reviewed case can never complete the
minimum-necessary handoff selected in Purpose.

## 3. Proposed solution

- Bind the Purpose recipient category into the immutable analysis input.
- Make eligible source-grounded candidates shareable only with that exact
  recipient category.
- Keep gaps and unresolved dependency chains fail-closed.
- Require explicit selection and confirmation before creating one canonical
  manifest.

## 4. Files to change

- Browser analysis intent and candidate builders
- Live-result post-validation
- Export selection and dependency validation
- Focused analysis/export tests and contract notes

## 5. Step by step tasks

1. [x] Bind the intended recipient category to the analysis run.
2. [x] Derive exact-category candidate eligibility.
3. [x] Enforce dependency closure for minimum-necessary selection.
4. [x] Verify selection, persistence, gate readiness, and handoff projections.
5. [x] Run focused checks and a short browser-created-case handoff smoke.

## 6. Acceptance criteria

- Eligibility never expands beyond the Purpose recipient.
- Context gaps remain excluded from minimum-necessary evidence selection.
- A selected dependency-bearing candidate cannot omit required active sources.
- Purpose or analysis-input changes invalidate old eligibility and readiness.
- A fully reviewed eligible selection can create the same canonical handoff
  across Semantic, JSON, and PDF projections.

## 7. Testing plan

- Focused analysis intent, deterministic/live candidate, export-core, and
  Export workspace tests; typecheck; production build; `git diff --check`;
  one browser-created safe-share smoke.

## 8. Open questions

- None for this bounded slice. Provider priority and server persistence remain
  separately configurable concerns.

# Browser-created case export contract migration, 2026-07-26

## 1. Goal

Allow a fully reviewed browser-created case to produce a truthful local
handoff when its packet is explicitly attested as synthetic test material or
authorized public material.

## 2. Problem

The current canonical export contract hard-codes every handoff as a bundled
synthetic case and blocks every browser-local document. Reusing that label for
uploaded public material would be false, while keeping every upload blocked
prevents the completed dynamic workflow from reaching a real handoff.

## 3. Proposed solution

- Add one canonical source-material classification to Purpose.
- Require explicit synthetic-test or authorized-public attestation.
- Keep unclassified, mismatched, private, or confidential packets fail-closed.
- Derive Export Gate readiness, the canonical manifest, and Semantic/JSON/PDF
  labels from that same classification.
- Preserve human review, freshness, masking, minimum-necessary, audit, and
  dependency rules.

## 4. Files to change

- Purpose and shared contracts
- Browser-case persistence migration
- Export core, renderers, and presentation copy
- Focused Purpose, export, persistence, and renderer tests
- Decision log and contract documentation only where the rule changed

## 5. Step by step tasks

1. [x] Trace Purpose classification, persistence, gate, manifest, and renderers.
2. [x] Add the canonical classification and backward-compatible restore rules.
3. [x] Connect Purpose selection and fail-closed export eligibility.
4. [x] Make every export projection state the correct material classification.
5. [x] Verify ready and blocked dynamic-case paths plus the legacy demo.

## 6. Acceptance criteria

- Browser-created synthetic or authorized-public packets can become export
  ready only after all existing canonical gates pass.
- Every output states its actual attested classification and never calls public
  material synthetic.
- Unclassified, mismatched, private, or confidential material remains blocked.
- Existing browser cases restore safely without losing their Purpose.
- The bundled demonstration preserves its current behavior.
- Raw PDFs, unmasked text, planning records, notes, referrals, and provider
  details remain excluded.

## 7. Testing plan

- Focused Purpose, persistence, export-core, renderer, and Export Gate tests;
  typecheck; one production build; `git diff --check`; short browser-created
  case handoff smoke.

## 8. Open questions

- None for this bounded migration. Live provider choice and server persistence
  remain separate later decisions.

# Review to safe handoff completion, 2026-07-26

## 1. Goal

Complete the browser-created-case review journey so every outstanding candidate
can be found, decided, traced to its source, and followed through the canonical
Export Gate and Audit Trail.

## 2. Problem

Structured Analysis, Evidence Gaps, Timeline, Nexus, Export, and Audit are
connected, but the Export Gate currently sends every incomplete-review blocker
back to Structured Analysis even when the affected records belong to another
review destination. Browser-uploaded packets also remain intentionally
non-exportable under the current synthetic-only manifest contract.

## 3. Proposed solution

- Derive review progress and remediation destinations from current canonical
  candidates.
- Link each incomplete candidate to the correct Lovable review screen.
- Preserve individual human decisions, source citations, dependency
  recalculation, freshness, Audit events, and fail-closed Export behavior.
- Keep browser-uploaded packets blocked from handoff until their export
  classification and manifest labels can be generalized truthfully.

## 4. Files to change

- Export Gate presentation and focused tests
- Dynamic current-analysis workspace only if a shared review-progress
  projection is required
- Plan checkpoint

## 5. Step by step tasks

1. [x] Trace canonical review requirements and current Export Gate blocker output.
2. [x] Add exact record-kind remediation links for incomplete review items.
3. [x] Verify decisions persist and immediately update readiness and Audit.
4. [x] Verify withdrawal and dependency invalidation remain fail-closed.
5. [x] Verify the canonical manifest remains unavailable for browser-local uploads
   instead of mislabelling them.
6. [x] Correct exact Evidence Gap remediation links so they select and reveal
   the requested canonical gap, matching Analysis, Timeline, and Nexus.

## 6. Acceptance criteria

- Every pending individual-review candidate is visible from Export Gate.
- Each remediation link opens the correct case-specific destination and record.
- Review decisions use canonical commands and survive reload.
- Dependency or freshness changes revoke old readiness.
- Export remains blocked with truthful data-origin copy for browser uploads.
- The legacy bundled fixture can still create its existing canonical handoff.

## 7. Testing plan

- Focused Export Gate, review-action, dynamic routing, dependency, and Audit
  tests; typecheck; build; `git diff --check`; short browser check.

## 8. Open questions

- A later explicit contract migration is required before an uploaded packet can
  be exported without falsely labelling authorized public material as a
  synthetic case.

# Evidence Gap to planning completion, 2026-07-26

## 1. Goal

Complete the judge-visible workflow from a real Evidence Gap into Interview
Planner and Case Tasks, then prove Urgent Needs and Services & Referrals remain
canonical, persistent, consent-safe, and consequential.

## 2. Problem

Gap actions already create canonical records, but the success links open only
the destination screen. They do not reliably focus the exact record or expose
an obvious path back to the source gap. The surrounding planning workflows also
need an end-to-end runtime check using a browser-created case.

## 3. Proposed solution

- Link successful gap actions to the exact created question or task.
- Preserve a visible return link from planning records to their source gap.
- Keep Urgent Needs practitioner-confirmed and separate from AI observations.
- Keep referral plans consent-confirmed, browser-local, not contacted, and not
  transmitted.
- Verify persistence, Dashboard counts, Audit events, and Export invalidation.

## 4. Files to change

- Evidence Gap action presentation
- Interview Planner and Case Tasks presentation
- Dynamic planning workspace wiring
- Focused planning and browser-created-case tests

## 5. Step by step tasks

1. Trace the current commands, reducer, storage, selectors, and export policy.
2. Add exact-record navigation and source-gap traceability.
3. Verify Urgent Needs creation and lifecycle.
4. Verify provider switching, consent, referral status, and no transmission.
5. Run focused automated checks and a real browser-created-case journey.

## 6. Acceptance criteria

- A successful gap action uses the real created record ID.
- Interview Planner opens that question and shows its gap/source provenance.
- Case Tasks scrolls to the created task and preserves its source gap.
- Reload preserves all created records and lifecycle state.
- Dashboard, Audit, and Export consequences derive from canonical state.
- AI suggestions never become practitioner-confirmed needs automatically.
- Referral plans require both confirmations and never imply contact or
  transmission.

## 7. Testing plan

- Focused gap, planning-state, dynamic workspace, Dashboard, Audit, and Export
  tests; typecheck; production build; diff check; browser smoke.

## 8. Open questions

- None. Existing canonical contracts determine the implementation.

# Evidence Gaps completion and live-analysis parity, 2026-07-26

## 1. Goal

Make Evidence Gaps reliably populate from the user’s current approved PDF
packet for both live-provider and browser-local analysis paths, without static
or fixture-only gap rows.

## 2. Problem

The browser-local deterministic path now creates source-linked gaps, but a
successful live-provider result can legitimately contain lane candidates while
returning no `context_gap` candidates. The Evidence Gaps destination then looks
empty even when its source candidates expose unresolved context.

## 3. Proposed solution

- Trace the current seven-document result and every admitted analysis path.
- Preserve model-proposed gaps when they pass canonical validation.
- Deterministically derive bounded, source-cited gap projections from the
  current run’s accepted candidate/citation output when the provider omitted
  necessary gap records.
- Never infer an answer, allegation, adverse fact, or negative conclusion.
- Preserve canonical review, response, planning-action, persistence, freshness,
  audit, dependency, and export behavior.

## 4. Files to change

- Analysis post-validation or canonical result assembly
- Evidence-gap selectors/presentation only if an empty-state defect exists
- Focused provider, deterministic-analysis, dynamic-workspace, and gap tests

## 5. Step by step tasks

1. Re-read the Evidence Gaps contract and reproduce the current empty state.
2. Identify whether the provider omitted gaps or canonical assembly discarded
   them.
3. Add one shared bounded source-grounded gap completion rule.
4. Verify human actions and rerun freshness against the completed output.
5. Inspect the rendered seven-document experience.

## 6. Acceptance criteria

- Relevant analyzed PDFs produce useful current-run context gaps even when the
  provider returns only lane candidates.
- Neutral or irrelevant PDFs do not receive invented gaps.
- Every gap has a current-run exact citation and active source dependency.
- Gap wording is neutral, specific, actionable, and clearly not a finding.
- Gap responses/actions persist and stale runs cannot create new planning work.
- Zero gaps remains an honest explicit state when no source-grounded unresolved
  question exists.

## 7. Testing plan

- Focused post-validation/orchestration, deterministic analysis, Evidence Gaps,
  dynamic persistence, typecheck, build, `git diff --check`, and one browser
  smoke using the current case.

## 8. Open questions

- None. The current stored analysis and canonical contracts determine the
  implementation; no new provider or dependency is required.

# Source-grounded planning and real U.S. resource discovery, 2026-07-26

## 1. Goal

Make arbitrary-PDF analysis produce useful, neutral Evidence Gaps and connect
human-confirmed planning needs to real U.S. service-resource directories.

## 2. Problem

The current gap wording is generic and the Services catalog is fictional.
Urgent Needs and Interview Planner are canonical and persistent, but their
human-controlled role is not clear enough.

## 3. Proposed solution

- Create balanced, rule-specific gaps from exact approved source citations.
- Keep all questions neutral, non-leading, and draft until human review.
- Replace fictional providers with vetted official U.S. resource finders.
- Match resources only to practitioner-confirmed active Urgent Needs.
- Preserve consent, no-contact/no-transmission, local persistence, audit, and
  export separation.

## 4. Files to change

- Deterministic analysis and focused tests
- Planning contracts, directory, Services UI, and focused tests
- Source-register metadata if needed for official-resource provenance

## 5. Step by step tasks

1. Verify official resource sources and limitations.
2. Strengthen gaps and neutral gap-to-interview wording.
3. Add source-verified resource records and deterministic need matching.
4. Connect the existing Lovable Services master-detail UI to those records.
5. Verify persistence, audit, consent, provider switching, and no transmission.

## 6. Acceptance criteria

- Relevant PDFs create useful source-linked gaps; neutral PDFs invent none.
- Gaps remain questions, not findings or adverse inference.
- Services contains no fictional organization or fake availability.
- Every listing exposes its official source and verification date.
- Tailoring uses only active practitioner-confirmed Urgent Needs.
- Saving a plan never contacts or transmits data to a resource.

## 7. Testing plan

- Focused deterministic-analysis, gap-action, planning-state, Services, and
  dynamic persistence tests; then typecheck, build, and `git diff --check`.

## 8. Open questions

- Live provider admission and live provider availability lookup remain separate
  future work; neither is required for this safe browser-local slice.

# Source-grounded downstream continuity, 2026-07-26

## 1. Goal

Make arbitrary browser-uploaded PDFs drive the dedicated Evidence Gaps,
Timeline, and Evidence Integrity Map screens without requiring live-provider
credits.

## 2. Problem

The deterministic browser analysis created only lane review prompts. When no
admitted live provider was available, the remaining canonical destinations
were functional but legitimately empty.

## 3. Proposed solution

Extend the existing deterministic analysis with conservative, source-cited
context gaps, explicitly dated timeline events, and organizational Nexus
relationships. Keep each record type in its dedicated Lovable destination and
never infer a legal conclusion, missing date, or unsupported fact.

## 4. Files to change

- Deterministic analysis, Structured Analysis projection, and focused tests

## 5. Step by step tasks

1. Derive only from readable approved redacted segments.
2. Require an explicit valid full date for every timeline event.
3. Build Nexus rows only from matched source-grounded review rules.
4. Keep gaps, timeline events, and Nexus records out of lane review UI.
5. Verify citations, persistence, and downstream route projections.

## 6. Acceptance criteria

- Arbitrary readable PDFs can populate all three dedicated destinations.
- Every derived record has an exact source dependency and citation.
- Neutral source text produces no invented candidate, date, or relationship.
- Structured Analysis remains lane-only.

## 7. Testing plan

- Focused deterministic, Structured Analysis, destination, and persistence
  tests; typecheck, build, `git diff --check`, and route smoke.

## 8. Open questions

- None. Live providers remain optional enhancements behind the same canonical
  contracts.

# Browser-created Export Gate and Audit Trail, 2026-07-26

## 1. Goal

Complete the browser-created case journey with a canonical fail-closed Export
Gate and the real case audit history.

## 2. Problem

The export and audit components already use canonical state, but only the
legacy demo routes expose them and their remediation links point at
`/case/demo`.

## 3. Proposed solution

- Reuse the current case-scoped state wrapper and existing export/audit UI.
- Add dynamic routes, stage links, and case-aware export remediation links.
- Persist readiness evaluation and manifest creation in the same browser case.

## 4. Files to change

- Dynamic Export/Audit routes, shared workspace, shell, export links, and
  focused tests

## 5. Step by step tasks

1. Add both destinations to the canonical case wrapper.
2. Enable Export-stage navigation for current successful analyses.
3. Keep every remediation link inside the current case.
4. Verify fail-closed readiness, persistence, audit events, and reload.

## 6. Acceptance criteria

- Export cannot bypass canonical blockers and never jumps to the demo fixture.
- Audit shows the case's real safe canonical events.
- Refresh preserves evaluated gate and any created manifest.

## 7. Testing plan

- Focused dynamic Export/Audit and existing export tests.
- Typecheck, build, `git diff --check`, and browser smoke.

## 8. Open questions

- None.

# Browser-created Nexus and Timeline, 2026-07-26

## 1. Goal

Connect the approved Evidence Integrity Map and Timeline to each
browser-created case's current canonical analysis.

## 2. Problem

Both review destinations already project canonical candidates and handle
withdrawal, citations, source reveal, qualified dates, and empty/stale states,
but dynamic case routes are disabled.

## 3. Proposed solution

- Reuse the current case-scoped state wrapper and existing review components.
- Add dynamic Nexus and Timeline routes and enable Review navigation.
- Preserve zero-result states when an analysis legitimately produces no Nexus
  or timeline candidates; never synthesize legal relationships or dates.

## 4. Files to change

- Dynamic review routes, shared case workspace, shell, and focused tests

## 5. Step by step tasks

1. Add both destinations to the canonical wrapper.
2. Add dynamic routes and Review-stage links.
3. Verify canonical nodes/events, source actions, stale/empty states, and reload.

## 6. Acceptance criteria

- Current canonical Nexus and timeline records render without fixture copying.
- Withdrawal and review actions persist to the same case state.
- Zero-result and stale states remain explicit and fail closed.

## 7. Testing plan

- Focused dynamic Nexus/Timeline and existing canonical review tests.
- Typecheck, build, `git diff --check`, and browser smoke.

## 8. Open questions

- None. Export Gate and Audit Trail follow.

# Browser-created Services and Notes, 2026-07-26

## 1. Goal

Connect the approved Lovable Services & Referrals and Notes & Journal screens
to each browser-created case's canonical browser state.

## 2. Problem

The canonical consent-gated referral and practitioner-note commands work in the
legacy fixture, but their dynamic case routes remain disabled.

## 3. Proposed solution

- Reuse the current case-scoped state wrapper and existing canonical commands.
- Add dynamic Services and Notes routes and enable their Planning links.
- Preserve consent, safe-contact, no-contact/no-transmission, note separation,
  audit events, export exclusion, and reload persistence.
- Keep the fictional provider directory explicitly unverified; do not imply
  real availability or provider contact.

## 4. Files to change

- Dynamic case planning routes, shared state workspace, and case shell
- Focused dynamic referral/note persistence and routing tests
- Dashboard truth copy only

## 5. Step by step tasks

1. Add the two destinations to the shared canonical wrapper.
2. Add dynamic routes and shell links.
3. Verify referral consent and immutable contact/transmission status.
4. Verify note create/edit/archive persistence and evidence/export separation.

## 6. Acceptance criteria

- Referral plans and notes remain isolated by case and survive reload.
- Provider switches reset confirmations; saves require both confirmations.
- Referral records never imply contact or transmission.
- Notes remain commentary, not evidence, and are excluded from export.
- Unknown and stale cases fail closed.

## 7. Testing plan

- Focused dynamic destination, referral, note, shell, and persistence tests.
- Typecheck, production build, `git diff --check`, and browser smoke.

## 8. Open questions

- None. Evidence Integrity Map and Timeline follow this slice.

# Browser-created Interview Planner and Case Tasks, 2026-07-26

## 1. Goal

Connect the approved Lovable Interview Planner and Case Tasks screens to each
browser-created case's current canonical state.

## 2. Problem

Canonical interview and task commands already exist, and Evidence Gaps can
create both record types, but their dynamic destinations are still disabled.

## 3. Proposed solution

- Reuse the current case-scoped IndexedDB state wrapper and canonical commands.
- Add dynamic Interview Planner and Case Tasks routes.
- Enable only those Planning links after a fresh successful analysis.
- Preserve case-specific ownership and make gap-action success links navigable.
- Keep Services, Notes, Review, and Export destinations unavailable.

## 4. Files to change

- Dynamic case planning routes and the shared current-state workspace
- Browser-created case shell and narrow planning component props
- Evidence Gaps destination links and focused persistence/routing tests

## 5. Step by step tasks

1. Extend the shared dynamic workspace to render Interview Planner and Tasks.
2. Add case-specific routes and shell links.
3. Pass the assigned practitioner into canonical task creation and filtering.
4. Point canonical gap actions to the new case-specific destinations.
5. Verify creation, edits, status changes, reload persistence, and safe failures.

## 6. Acceptance criteria

- Interview setup/questions and Case Tasks persist independently per case.
- Gap-created questions/tasks open their real case-specific destination.
- Task ownership uses the case's assigned practitioner.
- Unknown or stale cases fail closed.
- Later unimplemented destinations remain visibly disabled.

## 7. Testing plan

- Focused dynamic workspace, Interview Planner, Tasks, gap-link, and shell tests.
- Typecheck, production build, `git diff --check`, and a short browser smoke.

## 8. Open questions

- None for this slice. Services & Referrals and Notes & Journal remain next.

# Browser-created Urgent Needs and Evidence Gaps, 2026-07-26

## 1. Goal

Connect the approved Lovable Urgent Needs and Evidence Gaps screens to each
browser-created case's current canonical analysis state.

## 2. Problem

Browser-created cases can complete Purpose, Documents, masking, and Structured
Analysis, but the next two Analysis destinations are still disabled. Their
canonical reducers and presentation already work for the bundled demo.

## 3. Proposed solution

- Load only the current, fresh case-scoped analysis snapshot from IndexedDB.
- Reuse the canonical Urgent Need and context-gap commands and persist every
  successful update back to that same case snapshot.
- Enable case-specific Urgent Needs and Evidence Gaps routes after a successful
  current analysis, keeping missing, stale, and unknown cases fail-closed.
- Derive Dashboard counts and shell availability from current canonical state.
- Keep planning destinations that are not generalized yet visibly unavailable.

## 4. Files to change

- Dynamic case routes and one small shared case-state workspace wrapper
- Browser-created case shell and Dashboard projections
- Existing Urgent Needs and Evidence Gaps components via narrow props
- Focused shell, planning, gap-action, routing, persistence, and Dashboard tests

## 5. Step by step tasks

1. Add the safe current-analysis state loader/provider.
2. Add dynamic Urgent Needs and Evidence Gaps routes.
3. Preserve case-specific owners, links, audit events, and persistence.
4. Enable only the newly functional shell destinations.
5. Derive Dashboard planning/gap projections from current snapshots.

## 6. Acceptance criteria

- Current cases can open both routes; stale, missing, or unknown cases fail
  closed.
- Urgent Need creation/status and gap response/review/action commands persist
  independently per case and create canonical audit events.
- No fixture planning records are copied into browser-created cases.
- Dashboard counts update after navigation/reload.
- Unimplemented planning routes remain disabled and truthful.

## 7. Testing plan

- Focused dynamic workspace, shell, Dashboard, Urgent Needs, and Evidence Gaps
  tests.
- Typecheck, production build, and `git diff --check`.
- One short browser smoke on a synthetic browser-created case.

## 8. Open questions

- None for this bounded slice. Interview Planner and Case Tasks remain the next
  destination pass.

# Structured Analysis Lovable UX correction, 2026-07-26

## 1. Goal

Restore the approved compact Lovable Structured Analysis experience while
preserving the browser-local deterministic run, canonical review commands,
citations, reveal audit, dependency recalculation, persistence, and safety.

## 2. Problem

The lane selector and toolbar are close to Lovable, but opening exact source,
editing a decision, or requesting withdrawal changes the whole page geometry.
The source drawer compresses the master-detail workspace into narrow columns;
reasoned-action forms expand inside the detail card; withdrawal appears far
below the selected candidate; and the page becomes a long scroll instead of a
focused review workspace.

## 3. Proposed solution

- Keep the Lovable header, single-row lanes, compact toolbar, 380px candidate
  list, editorial tokens, typography, badges, and master-detail structure.
- Give the candidate list and candidate detail their own bounded desktop
  scrolling region so the header, lanes, filters, selection, and review actions
  remain spatially stable.
- Present exact source as a focused right-side overlay rather than shrinking
  the workspace.
- Present reason-required review forms and withdrawal confirmation as compact,
  keyboard-safe overlays anchored to the selected candidate workflow.
- Keep all canonical controls, source reveal warnings, command validation,
  error states, focus restoration, and responsive stacking.

## 4. Files to change

- `features/analysis/structured/structured-analysis-workspace.tsx`
- `features/review/source/source-drawer.tsx`
- `features/review/candidate/candidate-review-card.tsx`
- `features/review/dependency/dependency-change-panel.tsx` only if a small
  presentation prop is required
- focused Structured Analysis, source-drawer, review-action, and dependency
  tests

## 5. Step by step tasks

1. Bound the desktop master-detail height and enable independent list/detail
   scrolling without changing mobile stacking.
2. Add a Structured Analysis overlay presentation for the canonical source
   drawer, including Escape, focus containment, and focus restoration.
3. Move compact reasoned-action forms into a focused dialog without changing
   review commands or validation.
4. Move withdrawal preview into a focused dialog and remove the permanent
   below-workspace dependency panel from this route.
5. Compare the same selected-candidate, source-open, edit-open, and withdrawal
   states against the Lovable structure and the supplied screenshots.

## 6. Acceptance criteria

- At a typical laptop viewport, lanes and filters stay compact and the
  candidate list/detail begin high on the screen.
- Opening source never narrows the list or candidate detail.
- Exact source, edit/reject/uncertain reasons, and withdrawal remain fully
  canonical but no longer create a multi-screen vertical scroll.
- The selected candidate and review actions remain visible and readable.
- Mobile remains stacked and overlays fit without horizontal overflow.
- No canonical logic, provider routing, document processing, analysis output,
  audit, persistence, or export behavior changes.

## 7. Testing plan

- Focused Structured Analysis interaction and layout assertions.
- Focused source drawer keyboard/focus tests.
- Focused canonical review-action and withdrawal tests.
- Typecheck, production build, and `git diff --check`.
- Same-state laptop browser smoke for candidate selection, source, edit, and
  withdrawal.

## 8. Open questions

- None. The supplied screenshots, current canonical behavior, and existing
  Lovable source establish the required target.

# Browser-created case Structured Analysis, 2026-07-26

### Browser-local deterministic analysis continuity

Add a zero-provider analysis option for browser-created cases so the judge
journey does not depend on live API quota. It must consume only the current
approved redacted analysis corpus, use deterministic transparent indicator
rules, quote exact canonical segments, create cautious review proposals rather
than conclusions, and persist through the existing browser-case analysis
state. It must never claim to be AI, legal advice, a trafficking
determination, or evidence validation. Purpose, document, masking, and corpus
changes must invalidate it through the existing freshness contract.

Reuse the current Structured Analysis Lovable presentation, canonical review
actions, citation resolver, and downstream state shape. Add no dependency and
do not weaken the live-provider evaluation or admission boundary.

**Acceptance:** an approved browser-created packet can start deterministic
analysis with zero network calls; results contain only exact current-corpus
citations; unmatched packets show a truthful zero-result state; results survive
reload; stale inputs require rerun; and focused analysis, routing, persistence,
typecheck, build, and diff checks pass.

### Groq 20B free-development candidate

Use Groq `openai/gpt-oss-20b` as a separately versioned free-development
candidate so work can continue without rotating accounts or spending OpenAI
credits. Reuse the existing strict JSON Schema boundary, source-citation
validation, ZDR requirement, canonical review workflow, and fail-closed
admission rules. Preserve the 120B attempts as historical evidence; the 20B
candidate must use a new release identity, adapter version, evaluated
configuration digest, and fresh report. Run one bundled-fictional canary first.
Do not enable production selection, send browser-uploaded data, or run a broad
evaluation unless the exact 20B candidate passes that canary.

**Acceptance:** the new candidate is represented truthfully, deterministic
tests and typecheck pass, one live canary uses only the bundled fictional
redacted fixture, and a failure stops without fallback or additional calls.

The first 20B canary was rejected as `provider_rate_limited`. A one-token
synthetic diagnostic then succeeded and reported 7,925 of 8,000 tokens
remaining, proving the account quota was available and the analysis request
envelope itself exceeded the free TPM window. V2 therefore reduces the
completion ceiling and proposal bounds while keeping strict schema and
canonical citation validation unchanged.

V2's first bundled-fictional canary passed with two candidates and six exact
citations. The report remains incomplete and non-admitting with twenty-six
required live repetitions still not run. No browser-uploaded document was
sent, and runtime selection remains disabled.

Three additional paced repetitions passed. The next paced batch recorded one
more pass, then `EVAL-002` repetition 3 returned
`invalid_structured_response`. The runner stopped immediately and did not
attempt the remaining twenty-one repetitions. V2 is non-admitting: five live
repetitions passed, one failed, and six bundled-fictional transmissions
occurred in total.

### Groq v8 bounded-output correction

The v7 request is permanently non-admitting after one required repetition
returned `invalid_structured_response`. The next candidate keeps Groq strict
JSON Schema mode but adds provider-specific output budgets: at most ten
candidates, at most three citations and five unknowns per candidate, concise
non-empty text fields, and a 4,096 completion-token ceiling. Safe diagnostics
may record only the rejection stage and finish reason—never provider content.
The adapter version and evaluated-configuration digest must change, and v8
must begin a fresh evaluation with no inherited v7 passes.

The single v8 canary failed closed with safe diagnostic
`finish_reason: length`; no content was logged. This proves the 4,096-token
ceiling is too small for medium reasoning. V8 is non-admitting. V9 will retain
the proposal-count bounds but raise only the completion ceiling to 8,192
tokens, then start another fresh exact-version canary.

V9's first canary passed with four candidates and nine exact citations. Its
next repetition received Groq `HTTP 413` with safe provider code
`rate_limit_exceeded`. The adapter incorrectly mapped that operational
condition to `internal_safe_failure`; v9 is therefore non-admitting. V10 must
classify that exact status/code pair as `provider_rate_limited`, preserve the
same request configuration, and begin fresh evidence after the free-tier limit
resets.

V10 now implements that exact classification, keeps unrelated 413 responses
fail-closed, and has a fresh zero-transmission baseline. Focused adapter,
routing, admission, evaluation, contract, and Trust tests plus typecheck and
the production build pass. Live v10 evaluation has not started because the
Groq free-tier limit is still active.

**Status:** Dynamic Structured Analysis implementation and focused verification
are complete. The Groq boundary now uses the provider's strict structured-output
path. Ten bounded repetitions passed using only the bundled fictional redacted
fixture, but one required repetition returned a non-resumable
`invalid_structured_response`. The exact v7 adapter therefore cannot be
admitted. Runtime start remains fail-closed. No production setting or
deployment was changed.

### Development evaluation outcome, 2026-07-26

- The provider-neutral dynamic-case route, canonical analysis snapshot,
  current-run citation validation, canonical review actions, managed routing,
  and Lovable Structured Analysis presentation are implemented.
- Groq ZDR was confirmed by the user for the configured project. Thirteen
  earlier beta-adapter calls and sixteen bounded strict-adapter calls were
  attempted; only bundled fictional redacted segments were sent. No Mistral,
  Gemini, or OpenAI call occurred and no paid OpenAI credit was used.
- The earlier beta Responses API adapter produced intermittent empty or invalid
  structured outputs. It is retained only as historical evidence and is
  superseded by a separately versioned Chat Completions adapter using Groq's
  officially supported `strict: true` JSON Schema mode for GPT-OSS 120B.
- The replacement strict boundary returned substantive source-grounded
  candidates with exact citations in ten repetitions. One required repetition
  failed locally as `invalid_structured_response`; the runner stopped before
  spending the remaining quota. Sixteen live runs remain `not_run`; provider
  selectability stays fail-closed.
- Dynamic browser packets now send only candidate-eligible approved redacted
  segments. Evidence-only or instruction-advisory segments remain bound into
  the packet digest for freshness but are marked `not_sent` at the provider
  boundary and cannot be cited as if the provider saw them.
- The checked-in Groq report is intentionally non-admitting: it binds ten
  passed strict-boundary repetitions, one non-resumable structured-response
  failure with its real provider-attempt provenance, and leaves all unexecuted
  evidence as `not_run`. Static admission remains `not_evaluated`; the provider is not
  selectable.
- Evaluation evidence now distinguishes operational `interrupted` attempts
  from quality or safety `failed` evidence. Rate limits, quota exhaustion,
  timeouts, and temporary unavailability keep gates incomplete, preserve every
  attempted transmission in order, and may be resumed explicitly. Malformed
  output, unsafe conclusions, bad citations, and refusals remain failures and
  cannot be resumed as if they were transient.
- The live evaluation harness now checkpoints every call and computes the
  report digest after schema normalization so an interruption cannot silently
  discard later evidence or write a self-inconsistent artifact.

## 1. Goal

Connect the current browser-created-case Documents pipeline to a real,
source-grounded Structured Analysis workflow while preserving the exact
approved Lovable presentation and the existing canonical review, dependency,
audit, freshness, and safety behavior.

Routine automated testing uses mocked transports and frozen responses, so it
makes no provider calls and consumes no API credits. When live development
evaluation is separately approved, the cost-conscious default candidate order
is Mistral, Gemini, Groq, then OpenAI. A strict server-only setting may reorder
all four exact providers. Ordering does not admit an unevaluated
release, bypass a provider's data policy, merge outputs, or continue after a
privacy, citation, schema, refusal, or safety failure. The final production
recommendation remains evidence-based: only an exact release that passes the
same task-specific blocking gates may be selected.

## 2. Problem

Browser-created cases now have real local PDF extraction, English OCR with
human verification, source classification, masking, leak scanning, packet
integrity, and an inspectable approved-redacted analysis corpus. They still
cannot open Structured Analysis or produce real source-grounded candidates.

The existing live route and citation resolver are deliberately bound to the
bundled `CFN-DEMO-001` fixture. Reusing them unchanged for arbitrary PDFs would
either reject every dynamic case or falsely treat browser-supplied segment IDs
as trusted fixture data. The dynamic browser registry also does not yet own a
canonical analysis run, candidates, citations, review decisions, or audit
history.

## 3. Proposed solution

Build one narrow dynamic-case analysis boundary beside the unchanged demo
boundary.

### Canonical browser case state

- Add a case-scoped canonical analysis snapshot for each browser-created case,
  validated with shared `CaseState`, run, candidate, citation, review, and audit
  contracts rather than a second mock model.
- Hydrate Purpose and the current verified document packet into canonical
  state. Rebuild source content from the case's IndexedDB PDF files after
  reload and accept a stored analysis snapshot only when case ID, Purpose
  revision, document-set digest, masking revision, selected segment IDs, and
  approved-redacted-input digest still match.
- Keep raw PDF bytes, extracted text, OCR text, prompts, and provider payloads
  out of localStorage. Store only the minimum safe case index there. Use the
  existing browser file store and a separately validated IndexedDB record for
  any case-scoped analysis snapshot that must survive reload.
- Reuse canonical commands for start, terminal success/failure, candidate
  review, withdrawal, citation resolution, dependency invalidation, audit, and
  export staleness. Do not create component-local review state.

### Dynamic provider boundary

- Add a strict versioned dynamic-analysis request that contains only Purpose
  enums, packet and redacted-input digests, and the current approved redacted
  segments with stable document/page/segment IDs and source classification.
- Require the existing synthetic-or-authorized-public-data acknowledgement,
  approved masking, a passed deterministic leak scan, complete source mapping,
  current file digests, and a bounded request size.
- Re-scan the serialized redacted payload on the server and reject malformed,
  duplicate, stale, oversized, unapproved, or identifier-bearing input before
  provider transmission.
- The browser does not choose a provider, model, effort, endpoint, or key. The
  server considers only statically enabled, data-eligible, admitted releases
  in a strict server-managed order that defaults to Mistral, Gemini, Groq,
  then OpenAI.
- Each attempt is one stateless native provider request with strict structured
  output, no tools, files, browsing, retrieval, agents, conversation memory,
  background work, or provider-SDK retry.
- Progression is bounded and allowed only for confirmed pre-processing
  operational failures such as missing configuration, exhausted quota, rate
  limiting, or confirmed temporary unavailability. Unknown transmission,
  timeout, refusal, privacy, citation, schema, semantic-safety, prohibited
  output, or prompt-injection failure stops the run. No outputs are merged.
- The existing unpaid Mistral and Gemini configurations remain restricted to
  the exact bundled synthetic fixture until a separately reviewed data-policy
  configuration permits a broader synthetic or authorized-public origin.
- Keep the bundled `/case/demo` request, replay, checkpoint, and compatibility
  routes unchanged.

### Deterministic grounding and review

- Extract the citation resolver's source lookup so it validates against the
  exact canonical sanitized segments supplied to the selected run, while the
  existing fixture path continues using the frozen manifest.
- Store and display only exact canonical source slices. Quarantine fabricated,
  wrong-page, unknown, evidence-only, prohibited, injection-propagating, or
  otherwise unsafe proposals.
- Model output remains a proposal. Deterministic code derives support and
  dependencies; the practitioner performs every consequential review action.
- Render successful output through the existing Lovable Structured Analysis
  lanes, filters, master-detail panel, citations, source drawer, and review
  controls at `/case/{caseId}/analysis`.
- Preserve explicit blocked, running, failed, stale, zero-result, quarantined,
  coverage-warning, and service-unavailable states.

### Quality selection

- First verify the provider-neutral router and exact Mistral, Gemini, Groq, and
  OpenAI adapters end to end with mocked transports and deterministic tests.
- With the required provider keys and approved live-call ceilings, evaluate
  Mistral first, Gemini second, Groq third, and OpenAI fourth against the same
  frozen task.
- Freeze the strongest configuration before inspecting held-out assurance
  results. A changed prompt or inference setting creates a new release
  configuration and fresh report.
- Admit only a configuration that passes every blocking gate. Keep deterministic
  replay for the bundled demonstration and do not invent replay output for
  arbitrary PDFs.
- Admit every provider separately. Never merge providers or use another
  provider to bypass a safety failure. The cheapest passing release may become
  the default only if it satisfies the same quality and safety gates.

## 4. Files to change

- `plan.md` and, after approval, the relevant entry in `decision-log.md`
- shared analysis request/run contracts under `lib/contracts/`
- browser-case registry and IndexedDB storage under `lib/cases/`
- a small browser-case canonical-state hydration/persistence helper
- a dynamic canonical-input builder and route under `lib/ai/server/` and
  `app/api/`
- the existing provider-neutral orchestrator, OpenAI adapter, and deterministic
  citation post-validator only where source lookup must become input-scoped
- `app/case/[caseId]/analysis/page.tsx`
- `components/shell/browser-case-shell.tsx`
- one browser-created Structured Analysis workspace that reuses the existing
  Lovable analysis components
- focused contracts, state, provider-boundary, citation, persistence,
  Structured Analysis, and routing tests

No new dependency, vector database, RAG framework, agent framework, provider
aggregator, authentication system, server database, or production setting is
part of this slice.

## 5. Step by step tasks

1. Freeze the dynamic request, provenance, freshness, and persistence contracts.
2. Add fail-closed per-case canonical analysis hydration and safe IndexedDB
   snapshot handling.
3. Generalize deterministic citation lookup to the current run's canonical
   sanitized source map without weakening the bundled-fixture path.
4. Implement the dynamic server preflight, bounded managed routing, and native
   Mistral, Gemini, Groq, and OpenAI execution paths with mocked adapter
   verification.
5. Add `/case/[caseId]/analysis`, enable the shell stage only when canonical
   prerequisites pass, and reuse the Lovable Structured Analysis UI.
6. Connect canonical review, citation reveal, withdrawal, dependency
   invalidation, audit, freshness, and reload behavior.
7. Run focused zero-network verification, typecheck, build, and a synthetic PDF
   browser smoke.
8. Stop before any live call. Estimate the exact evaluation call count and
   current cost, then obtain explicit API-key and spend approval.
9. Run development evaluation, freeze the candidate, run held-out assurance,
   and update static admission only after a separate reviewed handoff.
10. Keep production live analysis disabled until public cost-abuse controls,
    credentials, and production enablement are explicitly approved.

## 6. Acceptance criteria

- A browser-created case with complete Purpose, current verified PDFs, approved
  masks, passed leak scan, and a ready corpus can open its own Structured
  Analysis route and start one real admitted analysis.
- No raw PDF bytes or unmasked extracted/OCR text are sent to the provider.
- The provider receives only the current approved redacted corpus and cannot
  choose commands, tools, routes, exports, or review outcomes.
- Every displayed consequential proposal has an exact current-run citation or
  remains visibly unresolved/insufficient; invalid proposals are quarantined.
- Review, edit, rejection, uncertainty, withdrawal, citation resolution,
  dependency changes, freshness, audit, and Dashboard consequences use
  canonical state and survive navigation and supported reload.
- Changing Purpose, documents, OCR verification, source classification,
  selected segments, or masking makes the prior run stale and blocks it from
  being presented as current.
- Unknown/deleted case IDs, missing browser files, storage failure, provider
  refusal, malformed output, timeout, and transport uncertainty fail visibly
  without partial candidates.
- `/case/demo` retains its deterministic judge workflow unchanged.
- The existing Lovable layout, density, typography, lanes, filters, and
  master-detail behavior remain visually unchanged.
- No provider is called or described as best until its exact configuration
  passes the frozen task-specific evaluation and static admission.

## 7. Testing plan

- Contract tests for strict dynamic requests, origin acknowledgement, size,
  digests, duplicate IDs, unsupported content, and forbidden fields.
- Unit tests for canonical source-map citation resolution, exact quotes,
  ambiguity, wrong pages, evidence-only segments, injection propagation,
  prohibited conclusions, and quarantine.
- State tests for case isolation, current-run activation, stale inputs,
  canonical review, withdrawal/dependencies, audit, safe reload, corrupted
  snapshots, and missing IndexedDB files.
- Component tests for routing, prerequisites, loading, failed, stale,
  zero-result, quarantine, filters, selection, citations, and canonical review.
- Mocked OpenAI adapter and route tests with zero network transmission.
- `npm run typecheck`, focused tests, one `npm run build`, and
  `git diff --check`.
- One Chrome smoke using synthetic PDFs only:
  Documents → privacy approval → Start analysis → Structured Analysis →
  citation reveal → review decision → reload.
- Live development and held-out evaluation only after separate key and spend
  approval; production remains disabled during this implementation slice.

## 8. Open questions

- Provider keys and explicit per-provider live-call ceilings are required
  before real evaluation. They are not required for the zero-network
  implementation and tests. OpenAI remains last in the live evaluation order
  to preserve its paid credits.
- Public enablement requires a separate decision about Vercel rate/firewall
  controls and provider budget limits because the application has no
  production authentication.
- “Arbitrary PDF” means technically varied synthetic or authorized public
  material. The hackathon application must continue rejecting or warning
  against confidential client, survivor, or private case data.
- The final reasoning effort and use of pro mode will be selected by measured
  development and held-out performance, not by assumption.

# Lovable Documents density correction, 2026-07-25

**Implementation status:** Complete locally and uncommitted. The two packet
tools now live as compact Source Quality disclosures; focused tests, typecheck,
production build, diff check, and same-state 1440 × 900 design QA passed.

## 1. Goal

Restore the approved Lovable Documents composition after adding the new
packet-integrity and analysis-input capabilities.

## 2. Problem

Packet Integrity and Analysis Input Preview currently render as two large
permanent cards below the Lovable document list/detail composition. They add
excessive height, duplicate stat-card styling, and visually turn the page into
a dashboard.

## 3. Proposed solution

- Keep the default Documents view ending with Lovable’s packet/detail card.
- Move both packet-level tools into compact, discoverable disclosures inside
  the existing Source Quality tab.
- Preserve every metric, search, download, state, and canonical calculation.
- Match existing Lovable borders, typography, spacing, icons, and responsive
  behavior; change presentation only.

## 4. Files to change

- `features/documents/browser-case-documents-workspace.tsx`
- `features/documents/document-cards.tsx`
- the two packet-tool presentation components and focused tests
- `design-qa.md`

## 5. Step by step tasks

1. Add a Source Quality extension slot to the existing document card.
2. Convert Packet Integrity and Analysis Input Preview to compact embedded
   disclosures.
3. Remove their permanent full-width placement below the document card.
4. Capture the same 1440×900 Documents state and compare it with the approved
   Lovable reference.

## 6. Acceptance criteria

- Default Document Health composition matches Lovable’s hierarchy and density.
- Packet tools do not occupy permanent page height.
- Both tools remain keyboard-accessible and fully functional.
- No document, masking, OCR, integrity, analysis-input, or persistence logic
  changes.

## 7. Testing plan

- Focused Documents component tests, typecheck, build, and diff check.
- Same-state 1440×900 Chrome capture and blocking design QA.

## 8. Open questions

- None. The approved Lovable Documents reference is available locally and is
  the visual source of truth.

# Documents ingestion hardening program, 2026-07-25

**Implementation status:** Complete locally and uncommitted. Focused Documents
and browser-case tests, typecheck, production build, diff check, and Chrome
smokes for real image-only OCR, human verification, reload recovery, final
privacy approval, and visual sanitized-PDF generation passed on 2026-07-25.

## 1. Goal

Turn browser-created case ingestion into a robust, inspectable local pipeline:

- deterministic packet/file/page integrity and duplicate diagnostics;
- PDF metadata and encryption/password diagnostics;
- bounded page-level retry instead of unnecessary full-packet replacement;
- real browser-worker OCR for image-only English pages;
- a downloadable technical integrity report;
- a visually flattened sanitized PDF built from approved mask geometry.

## 2. Problem

The current flow has real PDF.js extraction, health, masking, source
classification, approved-corpus inspection, and a sanitized text derivative.
It still cannot OCR scans, distinguish duplicate evidence, expose useful
embedded PDF metadata, retry one page, download a reproducibility report, or
produce a visual sanitized copy with irreversible raster masks.

These are related ingestion concerns. Implementing them as independent local
widgets would duplicate PDF loading and create inconsistent readiness rules.

## 3. Proposed solution

Build one session-local `DocumentIngestionManifest` projection over the
current packet, runtime files, PDF.js extraction result, OCR results, metadata,
and approved masking state.

### Integrity and duplicates

- Reuse saved SHA-256 file fingerprints for exact-file duplicates.
- Hash normalized extracted page text for exact repeated-page diagnostics.
- Add deterministic token-shingle similarity for advisory near-duplicate
  pages, with a conservative threshold and no automatic deletion.
- Keep every record visible; diagnostics never decide evidentiary weight.

### Metadata and encryption

- Use PDF.js `getMetadata`, `getPermissions`, and document loading state.
- Display sanitized technical metadata fields as unverified embedded metadata.
- Detect password-required documents and offer a session-only password retry.
- Never persist, log, or transmit passwords.

### OCR and page recovery

- Pin `tesseract.js@7.0.0` and `@tesseract.js-data/eng@1.0.0`.
- Self-host the browser worker, LSTM core variants, and English trained data.
- Rasterize only selected image-only/failed pages with PDF.js, reuse one OCR
  worker per job, and terminate it after the bounded job.
- Mark OCR output provisional, show confidence, and require explicit human
  verification before it becomes an available segment.
- Retry a selected page while preserving successful page results.
- Do not claim handwriting, table structure, language coverage beyond English,
  or accuracy guarantees.

### Integrity report

- Generate a JSON technical report entirely in the browser from safe metadata,
  fingerprints, page states, duplicate relations, OCR status, masking
  revision, and processing versions.
- Exclude extracted text, OCR text, passwords, PDF bytes, blob URLs, and user
  search terms.

### Flattened visual sanitized PDF

- Reload the real local PDF with PDF.js.
- Render each page to a canvas, calculate masks from the same canonical
  character ranges and indexed PDF text geometry used by Masked Preview, and
  paint opaque masks directly onto the raster canvas.
- Build a new image-only PDF with the existing `@react-pdf/renderer`.
- Fail closed unless the current packet’s masking review and leak scan pass
  and every approved mask can be placed.
- State that rasterization removes selectable source text but does not prove
  that the human reviewer found every personal detail.

## 4. Files to change

- `package.json`, `package-lock.json`
- `plan.md`, `decision-log.md`
- local OCR asset-copy script and pinned public runtime assets
- focused helpers under `lib/documents/` for manifest, duplicate analysis,
  metadata, OCR, report, page recovery, and flattened export
- current dynamic Documents workspace/cards/masked-preview components
- browser-case packet schema only for safe retry/OCR verification metadata
  that must survive reload; never persist extracted/OCR text
- focused unit/component/browser tests

## 5. Step by step tasks

1. Freeze shared manifest contracts and safe failure states.
2. Add exact and advisory duplicate diagnostics with deterministic tests.
3. Add PDF metadata/password diagnostics and session-only unlock handling.
4. Add bounded page retry and OCR worker pipeline with provisional/human-
   verified states.
5. Feed verified OCR segments through the existing mask invalidation and
   analysis-input preparation boundaries.
6. Add the safe integrity-report download.
7. Extract shared mask-geometry helpers and add flattened visual export.
8. Integrate compactly into Document Health, Source Quality, Masking Status,
   and packet-level controls without redesigning the Lovable layout.
9. Verify leakage, cleanup, reload, failure, duplicate, OCR, and export paths.

## 6. Acceptance criteria

- Exact duplicates are detected from current fingerprints; repeated pages are
  derived from current normalized text and never invented.
- Near-duplicate warnings are advisory and explain their deterministic basis.
- Metadata is labelled embedded/unverified and passwords never persist.
- One failed or image-only page can be retried without discarding successful
  pages.
- OCR performs real English recognition in a browser worker, shows confidence,
  remains provisional until human verification, and never leaves the browser.
- The integrity report contains no source/OCR text or secrets.
- Flattened export contains original page imagery plus approved opaque masks,
  has no selectable source-text layer, and refuses incomplete placement.
- Existing extraction, original preview, masking, sanitized text derivative,
  source classification, persistence, and legacy demo behavior continue.

## 7. Testing plan

- Focused manifest/duplicate/metadata/report/OCR/page-retry/mask-geometry unit
  tests.
- Focused dynamic Documents interaction, persistence, password, and cleanup
  component tests.
- Typecheck, one production build, `git diff --check`.
- Chrome smoke with text-native, duplicate, image-only, and approved-mask
  PDFs; no real personal data.

## 8. Open questions

- OCR is English-only in this slice. Other languages require separately pinned
  trained data and explicit UI selection.
- Encrypted PDFs can be unlocked only for the current session; passwords are
  intentionally never retained.
- Near-duplicate similarity is a navigation warning, not a credibility,
  authenticity, or evidentiary-weight conclusion.

# Persistent source classification, 2026-07-25

## 1. Goal

Let a practitioner classify each uploaded PDF using the existing canonical
document source types so later analysis can distinguish communications,
travel records, practitioner notes, proceedings, financial records, and other
source roles.

## 2. Problem

Every browser-created PDF currently remains `other` / “Uploaded PDF” even when
the practitioner knows its source role. Extraction quality is real, but the
packet loses useful human-supplied source context that Structured Analysis
will need.

## 3. Proposed solution

- Add a compact source-classification control to each dynamic document’s
  Source Quality tab.
- Persist the selected value through the existing validated browser-case
  document packet; add no new domain field or parallel local state.
- Keep classification explicitly practitioner-supplied and separate from
  authenticity, credibility, or legal-strength claims.
- Surface the current source type and classified-document count in the
  Analysis Input Preview and its exact search results.
- Preserve extraction, masking, privacy approval, PDF bytes, and legacy demo
  behavior.

## 4. Files to change

- `plan.md`
- `features/documents/document-cards.tsx`
- `features/documents/browser-case-documents-workspace.tsx`
- `features/documents/analysis-input-preview.tsx`
- `lib/documents/analysis-corpus.ts`
- focused Documents, persistence, and corpus tests

## 5. Step by step tasks

1. Add a dynamic-only source-type selector using the existing contract enum.
2. Save the selected type through the current validated packet persistence.
3. Reset the edit buffer when the selected document changes.
4. Add source-type context to the approved analysis corpus and search results.
5. Verify case isolation, reload persistence, failed saves, and unchanged
   legacy behavior.

## 6. Acceptance criteria

- Saving a source classification updates only the selected current-case
  document.
- The classification survives navigation and reload.
- Switching documents never carries an unsaved classification draft across
  records.
- Analysis Input Preview uses the current persisted classification.
- The UI never implies that classification proves provenance or credibility.

## 7. Testing plan

- Focused DocumentCards selector and cross-record-buffer tests.
- Focused browser-case persistence and analysis-corpus tests.
- Typecheck, production build, `git diff --check`, and one Chrome smoke.

## 8. Open questions

- No decision is required. `other` remains the truthful default until a
  practitioner explicitly supplies a more specific source role.

# Browser-local Analysis Input Preview, 2026-07-25

## 1. Goal

Let the practitioner inspect the exact sanitized browser-local corpus that is
ready to become Structured Analysis input, before dynamic-case analysis is
connected.

## 2. Problem

Documents currently proves extraction, masking, and privacy readiness, but it
does not summarize what usable redacted material exists across the packet.
The practitioner cannot search the approved corpus by exact document/page
citation or see which extracted segments are evidence-eligible versus
instruction-like advisory material.

## 3. Proposed solution

- Build a fail-closed analysis-corpus projection from the current extracted
  segments and canonical approved masking state.
- Reuse the existing redaction/transmission-readiness checks; never create a
  weaker competing definition.
- Show real document, page, segment, word, character, eligibility, and
  instruction-advisory counts.
- Add local search over sanitized text with exact document/page/segment
  citations and bounded snippets.
- Keep raw text, extracted text, search queries, and results out of persistent
  browser metadata.
- State clearly that this is an input preview and that Structured Analysis for
  browser-created cases is still unavailable.

## 4. Files to change

- `plan.md`
- one pure analysis-corpus helper under `lib/documents/`
- one compact Documents component under `features/documents/`
- `features/documents/browser-case-documents-workspace.tsx`
- focused corpus and Documents component tests

## 5. Step by step tasks

1. Build and test a canonical redacted corpus model with fail-closed source
   mapping and deterministic metrics.
2. Add deterministic bounded full-text search over that safe model.
3. Render a compact Lovable-style packet summary and expandable search.
4. Connect it only when current runtime files and the saved privacy result
   match.
5. Verify invalidation, privacy blocking, citation accuracy, and no raw-value
   leakage.

## 6. Acceptance criteria

- No corpus text appears before the current masking review and leak scan pass.
- Every displayed snippet is redacted text derived from a current canonical
  segment.
- Every result has its real document, page, and segment citation.
- Metrics derive from current packet data and never use fixture counts.
- Instruction-like and evidence-only material is visibly distinguished.
- The UI does not claim that dynamic Structured Analysis can start.

## 7. Testing plan

- Focused unit tests for readiness, redaction, metrics, citations, search, and
  source mismatch.
- Focused component tests for blocked, ready, search-empty, and result states.
- Typecheck, production build, `git diff --check`, and one Chrome smoke.

## 8. Open questions

- No decision is required for this slice. The preview is session-only because
  persisting extracted or redacted source text in localStorage would weaken
  the current privacy boundary.

# Browser-local sanitized derivative and detector hardening, 2026-07-25

## 1. Goal

Add one real post-review outcome to Documents: after the current packet passes
the canonical masking review and deterministic leak scan, the practitioner can
download a new browser-local PDF containing only the approved redacted
extracted text.

## 2. Problem

The working masked preview is useful for review, but the original PDF remains
unchanged and there is no downloadable sanitized artifact. The current local
identifier detector is deliberately limited and should recognize a few more
common labelled formats without pretending to provide OCR or comprehensive
PII detection.

## 3. Proposed solution

- Reuse the installed PDF renderer to create a clearly labelled **sanitized
  text derivative** from canonical redacted segments only.
- Fail closed unless the current masking review is approved, the current leak
  scan passed, and every effective mask validates against the current
  extracted segments.
- Generate and download the PDF only in the browser; do not persist, upload,
  log, or transmit the generated bytes or object URL.
- State truthfully that this derivative does not preserve the original visual
  layout and may omit pages that had no extractable text.
- Extend only conservative deterministic patterns such as labelled
  passport/account variants, IBAN-like values, and labelled written-form dates
  of birth. All findings remain pending human review.

## 4. Files to change

- `plan.md`
- `features/documents/browser-case-documents-workspace.tsx`
- `features/documents/masking-review-panel.tsx`
- one small sanitized-PDF renderer/model under `features/documents/` or
  `lib/documents/`
- `lib/redaction/index.ts`
- focused Documents and redaction tests

## 5. Step by step tasks

1. Build and test a fail-closed sanitized-document model from current
   canonical segments and masking state.
2. Render that safe model as a PDF with the existing pinned renderer.
3. Add a compact post-pass download action to the final privacy-check row.
4. Revoke the temporary download URL immediately after use.
5. Harden conservative deterministic patterns and add focused tests.

## 6. Acceptance criteria

- No download is available before the current privacy review and leak scan
  pass.
- The generated PDF contains approved replacement labels and never contains
  the corresponding raw masked values.
- The UI calls it a sanitized text derivative and explains its layout/OCR
  limitations.
- Generated bytes and object URLs remain browser-session-only.
- Detector additions remain deterministic, conservative, and human-reviewed.

## 7. Testing plan

- Focused sanitized-model, renderer, Documents UI, and redaction tests.
- `npm run typecheck`, one production build, and `git diff --check`.
- One Chrome smoke: approved masks → passed privacy check → download sanitized
  text PDF.

## 8. Open questions

- OCR, a shared database, and a visually flattened copy of original page
  artwork remain separate future work; this slice will not misrepresent the
  text derivative as any of those features.

# Interactive browser-local masked preview, 2026-07-25

## Approved layout and detector correction

- Give the masked PDF the full available document width so a normal page is
  visible without the permanent review sidebar squeezing it.
- Move the compact **Review visible text** controls below the PDF, with the
  active selection/review actions and accessible mask list arranged
  responsively.
- Replace fixture-shaped passport, account, and date detection with
  label-aware deterministic patterns that work on arbitrary embedded-text
  PDFs. Keep automatic findings pending until a human approves them.
- Keep names and ambiguous identifiers manually selectable; never claim
  complete PII detection, OCR support, or irreversible PDF sanitization.

## Approved compact privacy-gate correction

- Preserve the real browser-local approval path: validate every mask decision,
  build redacted text, run the deterministic leak scan, and persist the
  resulting review/scan state in the independent case packet.
- Replace the oversized generic **Approve privacy masks** card with a compact
  Lovable-style final-check row using the existing editorial tokens, chips,
  status icons, concise blocked/ready copy, and one clear action.
- Fail visibly when browser persistence fails; never show a successful privacy
  result unless the updated packet was actually saved.
- Add focused dynamic-case tests for blocked pending masks, passed zero-result
  scans, failed leak scans, persistence across remount, and storage failure.

## 1. Goal

Turn Masking Status into a clear, judge-ready visual workflow for any
browser-local PDF that contains extractable text:

- show the selected PDF as a scrollable masked preview;
- place real overlays over detected or manually selected text;
- let the practitioner review masks directly from the preview;
- preserve the original PDF unchanged and separately revealable;
- keep all PDF bytes, text, and masking work inside the browser.

## 2. Problem

The current masking engine can detect narrow deterministic patterns, store
canonical character-range decisions, build redacted extracted text, and run a
local leak scan. Its UI exposes segment IDs and numeric character offsets,
however, and Document View only shows the original PDF. A practitioner cannot
see where masks land on a page or select missed text naturally.

Selecting an identifier class currently changes only the replacement token; it
does not find or visually hide matching content. Person names cannot be
reliably inferred from arbitrary documents without a human decision or a
separate named-entity model. Scanned/image-only pages contain no selectable
text and require OCR, which this demonstration intentionally does not provide.

## 3. Proposed solution

Use the already installed and pinned PDF.js display API. For every readable
page, render the PDF canvas plus a coordinate-aligned text/interaction layer.
Build a deterministic index that maps the same normalized page text used by
the canonical masking engine to PDF.js text items and page rectangles.

Render canonical masking suggestions as visual overlays:

- pending suggestions use a review color;
- approved/edited masks use an opaque privacy overlay and readable label;
- rejected items remain clearly unresolved;
- selecting an overlay opens compact approve, edit-type, or remove actions.

Replace the primary numeric-offset workflow with direct visible-text
selection. The selected page text and its exact canonical range become a
normal `MaskSuggestion`; all approvals, invalidation, leak scanning, and
redacted-text generation continue through the existing masking model.
Retain the offset form only as a collapsed advanced fallback if needed.

Improve deterministic detection for common international email, telephone,
date, passport-like, and account-like formats without claiming comprehensive
PII recognition or credibility. Names and ambiguous addresses remain
human-selected unless a known sensitive-term list is explicitly available.
No live AI, server upload, OCR, permanent PDF rewriting, or new dependency is
introduced.

## 4. Files to change

- `features/documents/document-cards.tsx`
- `features/documents/masking-review-panel.tsx`
- `features/documents/browser-case-documents-workspace.tsx`
- A small focused browser-local PDF mask-preview helper under
  `features/documents/` or `lib/documents/`
- `lib/documents/pdf-source-service.ts` only if a shared text-index utility is
  required to guarantee canonical offset parity
- `lib/redaction/index.ts` only for carefully tested deterministic-pattern
  coverage improvements
- Focused Documents, redaction, masking, preview, and cleanup tests

The existing dirty multi-case and Documents worktree must be preserved. No
legacy `/case/demo` behavior, Masking contracts, downstream safety rule, or
unrelated route will be redesigned.

## 5. Step by step tasks

1. Extract one shared page-text indexing rule so PDF text, character offsets,
   and visual PDF.js items cannot silently disagree.
2. Add a scrollable Masked Preview using the existing session/IndexedDB-backed
   `File`, PDF.js canvas rendering, and coordinate-aligned overlay layer.
3. Display pending, approved, edited, rejected, and selected mask states with
   deterministic styling, page labels, counts, and an accessible textual
   equivalent.
4. Add mouse and keyboard selection of visible extracted text, followed by a
   compact identifier-class and replacement confirmation.
5. Connect visual approve/edit/remove/add actions to the existing canonical
   masking mutations; never create parallel preview-only decisions.
6. Keep Original PDF as an explicit separate view and clearly explain that
   Masked Preview is a browser-local working projection, not a permanently
   sanitized PDF.
7. Show safe per-page limitations for image-only, failed, or unsupported text
   geometry, and never draw a mask where placement cannot be verified.
8. Verify multiple PDFs, reload restoration, mask invalidation, privacy scan,
   responsive layout, keyboard operation, and object/render-task cleanup.

## 6. Acceptance criteria

- Every successfully opened embedded-text PDF can render a scrollable masked
  preview from its real browser-local bytes.
- Every visible overlay is derived from a canonical current-document mask
  range; no fixture boxes or invented content appear.
- Selecting visible text can create a pending mask without entering segment
  IDs or numeric offsets.
- Approve, edit, remove, and final privacy-check actions update the existing
  masking state and survive navigation/reload according to current browser
  persistence.
- Multiple packet documents show only their own pages and masks.
- Approved masks visibly obscure the selected text; Original PDF remains
  available separately and unchanged.
- Automatic detection is explicitly described as limited and deterministic.
  The UI never claims that all names or identifiers were found.
- Image-only/scanned pages say that OCR is required and unavailable; they do
  not show fabricated text or overlays.
- PDF bytes and extracted text never enter localStorage, logs, a provider, or
  the network.
- Existing Lovable layout, four-tab structure, responsive behavior, canonical
  leak scan, `/case/demo` workflow, and safety rules remain intact.

## 7. Testing plan

- Focused unit tests for text-item-to-canonical-range mapping, coordinate
  conversion, multi-item masks, overlap, and expanded deterministic patterns.
- Focused component tests for masked rendering states, visible-text selection,
  canonical actions, document switching, keyboard operation, limitations, and
  cleanup.
- Existing focused Documents and masking regression tests.
- `npm run typecheck`, one `npm run build`, and `git diff --check`.
- One Chrome judge smoke with at least two real PDFs:
  upload → Masking Status → inspect automatic overlays → select missed text →
  approve → run privacy check → reload → reopen masked preview.

## 8. Open questions

- No user decision is required for the first slice: approved masks will use an
  opaque dark overlay with a short category label, while pending suggestions
  remain visibly highlighted.
- “Works with any random PDF” means any valid PDF that PDF.js can open and
  whose pages contain an embedded text layer. Scanned/image-only, encrypted,
  corrupt, or unusually encoded PDFs must fail visibly and safely rather than
  pretending masking succeeded.
- This is a visual and text-projection masking workflow, not irreversible PDF
  sanitization. Generating a downloadable permanently redacted PDF and adding
  OCR remain separate, higher-risk phases.

# Real case entry and multi-case foundation, 2026-07-25

## 1. Goal

Make the first judge-facing flow genuinely usable:

- show exactly one centered **Start Demonstration** action on the landing page;
- route it to the Case Dashboard;
- show every available case on the Dashboard;
- make existing cases open a ContextFirst Nexus workspace;
- make **New case** create an independent case and open its Purpose Brief.

## 2. Problem

The landing page currently exposes several duplicate Dashboard/demo actions.
The Dashboard also presents two cases as non-interactive fixtures and its
**New case** control only opens an unavailable-message modal.

The deeper application is currently built around one canonical internal case,
`CFN-DEMO-001`, one `/case/demo/*` route family, and one session-storage
record. M. Chen, A. Okafor, and R. Salazar are static demonstration cards, not
real case records. They must be removed from the live Dashboard rather than
being converted into misleading clickable cases.

## 3. Proposed solution

Implement the smallest truthful multi-case foundation while preserving the
approved Lovable presentation:

- Add a small browser-persistent case registry with independent case IDs,
  display references, person aliases, assigned practitioners, and timestamps.
- Do not seed M. Chen, A. Okafor, R. Salazar, or any other static case card.
  A fresh browser starts with a truthful empty Dashboard.
- Turn **New case** into a compact creation dialog. Creating a case writes a
  real local record and immediately routes to its Purpose Brief.
- Give every created case an independent, editable Purpose Brief using the
  existing Lovable workspace presentation. Do not copy any fixture documents,
  analysis, audit, or planning data into it.
- Keep downstream stages for a new case visibly unavailable until their
  canonical multi-case contracts are connected in later slices.

The old bundled fixture and `/case/demo/*` implementation may remain
temporarily as unlinked compatibility code while the real multi-case workflow
is built. Do not delete those source files during this slice: first remove all
visible fixture data, migrate required behavior, and prove the real flow works.
Physical fixture-code deletion is a separate cleanup after it is demonstrably
unused.

This is a real per-browser workflow: records survive refreshes and browser
restarts on that device. It is not yet a shared multi-user database; durable
cross-device accounts and collaboration remain a later backend slice.

## 4. Files to change

- `components/marketing/marketing-shell.tsx`
- `app/page.tsx`
- `features/dashboard/case-dashboard.tsx`
- A small case-registry module under `lib/cases/`
- Dynamic case Purpose route and bounded workspace components under
  `app/case/[caseId]/` and `features/purpose/`
- Focused Landing, Dashboard, case-registry, routing, and Purpose tests

Existing canonical reducer, fixture, replay, PDF, review, export, and audit
code should not be rewritten in this slice.

## 5. Step by step tasks

1. Remove all duplicate Start Demonstration/Enter Demonstration actions.
2. Place one Start Demonstration action in a full-width centered hero row and
   keep Trust & Safety as secondary navigation.
3. Add a validated, versioned local case registry with safe defaults and
   fail-closed parsing.
4. Render only user-created cases from the registry on the Dashboard, with a
   clear first-run empty state.
5. Replace the unavailable New Case modal with a minimal validated creation
   form.
6. Create the record, close the modal, and navigate directly to its Purpose
   Brief.
7. Make every created case card a keyboard-operable link to its correct
   independent workspace.
8. Keep legacy demo routes unlinked and isolated while the replacement is
   completed; never copy legacy fixture data into a created case.

## 6. Acceptance criteria

- Exactly one landing-page action is labelled Start Demonstration.
- That action opens `/dashboard`.
- Dashboard is the single case-selection and case-creation entry point.
- No M. Chen, A. Okafor, R. Salazar, or other static fixture card appears.
- A fresh browser shows an intentional empty state and a working New Case
  action.
- New Case validates required fields, creates a unique record, and opens its
  Purpose Brief.
- Newly entered Purpose information survives reload and never appears in a
  different case.
- Every Dashboard card represents a case actually created through the product.
- Unsupported downstream actions for new cases are explicit and disabled,
  never fake or dead.
- The Lovable layout, typography, spacing, and responsive behavior are
  preserved.

## 7. Testing plan

- Focused unit tests for registry creation, persistence, invalid storage, and
  case isolation.
- Component tests for exactly one landing CTA, Dashboard case links, validation,
  creation, and routing.
- Purpose Brief persistence and cross-case isolation tests.
- Focused legacy-isolation checks proving fixture data cannot enter created
  cases.
- `npm run typecheck`, focused Vitest, `npm run build`, and
  `git diff --check`.
- One desktop and mobile browser smoke:
  Landing → Dashboard → existing case, and
  Landing → Dashboard → New Case → Purpose Brief → reload.

## 8. Open questions

- “Open a new window” is interpreted as opening the compact New Case dialog
  inside the current browser tab, then navigating to the workspace after
  submission. It will not open a separate browser tab.
- All case names and records in this hackathon deployment remain synthetic.
- Database, authentication, live collaboration, and cross-device persistence
  are intentionally outside this first slice and will be selected only after
  this flow is working.

# Exact Lovable UI transplant correction, 2026-07-24

## 1. Goal

Make every judge-visible screen match the approved Lovable repository at
commit `0bca52afe26babe477ef37f4ed8f7df32c9fb135` as closely as the same
framework can render it, while preserving the working canonical ContextFirst
state, commands, PDF processing, review, audit, export, and safety behavior.

## 2. Problem

The deployed application at commit `fbb23ee` is a hybrid. The prior pass
mapped Lovable colors and typography onto legacy Codex components and
hand-recreated page layouts. It did not transplant Lovable's actual shells,
shared UI system, route markup, spacing, or responsive composition.

The 2026-07-24 side-by-side audit confirmed material differences on Landing,
Dashboard, and Structured Analysis, and source comparison confirmed the same
pattern across the remaining routes. This is an implementation-strategy
error, not a Vercel cache or deployment error.

## 3. Proposed solution

Run one focused presentation-transplant phase:

- Treat the Lovable JSX, class structure, styles, section order, spacing,
  controls, and responsive layouts as the immutable presentation source.
- Keep Next.js routing and the existing canonical ContextFirst domain layer.
- Connect canonical selectors and commands to the transplanted UI through
  thin route-specific view-model adapters.
- Do not embed legacy workspaces inside Lovable-looking wrappers.
- Do not copy Lovable's Zustand store, static counters, fake mutations, mock
  export truth, or provider-transmission behavior.
- Keep the current production deployment unchanged until the exact-UI branch
  passes visual review and the user explicitly approves deployment.

## 4. Files to change

- `app/globals.css`
- `app/page.tsx`, `app/dashboard/page.tsx`, `app/trust/page.tsx`
- `app/case/demo/**/page.tsx`
- `components/marketing/`, `components/shell/`, and a faithful port of
  Lovable's shared `nexus-ui` presentation components
- Judge-visible feature presentation components under `features/`
- Small adapter modules that map canonical `CaseState` to Lovable display
  models
- Focused tests only where presentation wiring changes behavior

Canonical contracts, reducer semantics, PDF pipeline, audit rules, export
engine, and safety boundaries should change only if an adapter exposes a real
contract mismatch.

## 5. Step by step tasks

1. Create a new local integration branch from clean `main`.
2. Port Lovable's global styles and exact marketing/workspace shells.
3. Port the exact Lovable JSX and classes for every route.
4. Replace TanStack links with Next links and fixture/Zustand reads with
   canonical view-model adapters.
5. Wire each supported control to the existing canonical command; keep
   unsupported controls truthfully disabled.
6. Remove legacy presentation from judge-visible routes while retaining the
   domain logic behind it.
7. Capture matching-viewport screenshots of the Lovable reference and the
   corrected app, compare them side by side, and fix visible differences.
8. Stop after local verification. Do not commit, push, or deploy without
   explicit approval.

## 6. Acceptance criteria

- Landing, Dashboard, shell, and every workspace route use Lovable's actual
  layout hierarchy rather than a Lovable-inspired Codex layout.
- At the same viewport and state, section order, major dimensions, spacing,
  typography, borders, radii, controls, and responsive composition match the
  approved Lovable source.
- Differences are limited to canonical live values, truthful loading/error
  states, and compact safety disclosures required by the functional app.
- No parallel Zustand or fixture domain store is introduced.
- Existing Purpose, Documents, Analysis, Gaps, planning, Nexus, Timeline,
  Export, Audit, Trust, reset, persistence, and source-reveal behavior remains
  functional.
- No judge-visible route renders the old generic `cfn-*` workspace layout.
- Production remains untouched until the user reviews the local comparison.

## 7. Testing plan

- Run `npm run typecheck`.
- Run focused component tests for shell, Dashboard, Purpose, Documents,
  Analysis, Gaps, planning workflows, Export, reset, and persistence.
- Run `npm run build`.
- Browser-smoke every judge-visible route and the main demonstration flow.
- Capture same-viewport side-by-side screenshots for Landing, Dashboard,
  Purpose, Documents, Analysis, Gaps, Interview, Services, Nexus, Timeline,
  Export, Audit, and Trust.
- Run `git diff --check`.

Broad test suites are not required unless focused checks expose a shared
regression.

## 8. Open questions

- Implementation requires explicit approval of this corrected transplant
  plan.
- Commit, push, and production deployment remain separate approval gates.

# Lovable UI integration and hackathon completion, 2026-07-23

## Read-only reconnaissance checkpoint, 2026-07-24

This checkpoint records the verified starting point for the requested
integration. It supersedes older source-reference, readiness, and
arbitrary-upload statements later in this file wherever they conflict. No
application code, dependency, branch, deployment, or production setting was
changed during reconnaissance.

### 1. Goal

Integrate the latest Lovable presentation into the existing functional
Next.js application without replacing its canonical contracts, reducer,
commands, selectors, audit trail, replay boundary, or fail-closed export
engine.

The reviewed Lovable reference is the private repository
`rajpatilrobotics/remix-of-remix-of-remix-of-01-remix-of-case-navigator` at
commit `0bca52afe26...` (`Compactified analysis lanes`, 2026-07-23). It is a
visual and interaction reference, not a second runtime or state architecture.

### 2. Problem and verified starting state

- Git is on `main` at `8f7a201`, exactly aligned with `origin/main`
  (`0` ahead, `0` behind).
- The worktree is materially dirty: 31 tracked files are modified (about
  2,479 insertions and 247 deletions) and 7 paths are untracked.
- `git diff --check` passes, but `node_modules` is absent. The dirty WIP has
  not received a fresh typecheck, lint, test, build, accessibility, or browser
  verification and must not be described as verified.
- The committed application is a coherent, synthetic, replay-only workflow:
  landing; Purpose Brief; exact seven-PDF fixture intake and local PDF.js
  extraction; coverage and masking; deterministic replay; source-grounded
  human review; dependency invalidation; Timeline and Nexus views; fail-closed
  JSON/PDF export from one immutable manifest; audit; and Trust/Safety.
- OpenAI, Gemini, and Mistral adapters exist, but every live provider remains
  unadmitted and the public product remains replay-only. TASK-040 is the
  separate ready task for managed provider routing and is outside this UI
  phase.
- The dirty WIP adds browser-local intake for 1–25 PDFs, readable/image-only
  page states, approved masking, privacy checks, and neutral source-excerpt
  review candidates. It does not yet provide substantive arbitrary-document
  analysis or export.
- The frozen product brief and DEC-004 authorize only the bundled synthetic
  packet, while the dirty WIP and older plan text describe arbitrary PDF
  intake. Higher-authority product truth wins until this conflict is explicitly
  reconciled and approved.
- The task graph has no UI-integration task packet. A bounded packet and
  exclusive write scope are required before implementation, and they must not
  overlap TASK-040.

### 3. Lovable UI-to-functional-code mapping

| Lovable destination | Functional foundation in this repository | Integration classification |
| --- | --- | --- |
| Landing | Existing safety-boundary landing | Visual port and route to Dashboard |
| Case Dashboard | No canonical case collection | Small real implementation; only M. Chen enters the deep workspace |
| Purpose Brief | Validated canonical form and command | Primarily visual port |
| Documents & Source Health | Strong bundled-fixture flow plus unverified local-PDF WIP | Visual port; WIP policy and verification remain separate |
| Structured Analysis | Canonical candidates, lanes, queue, citations, decisions, and source drawer | Visual/master-detail port over existing selectors |
| Urgent Needs | No canonical model | Real contracts, commands, audit, and cross-links required |
| Evidence Gaps | Canonical context-gap candidates and responses | Visual port plus real gap-to-action commands |
| Interview Planner | Missing | Real implementation tied to canonical `GAP-*` identifiers |
| Services & Referrals | Missing | Real implementation with fictional-provider and no-transmission rules |
| Case Tasks | Missing | Real shared state, commands, ownership, status, and due dates |
| Notes & Journal | Missing | Real implementation kept separate from evidence and audit truth |
| Evidence Integrity Map | Dependencies, citations, and Nexus selectors exist | New neutral visual route driven by canonical data |
| Timeline | Canonical selector and component exist | Route and visual port, including explicit undated handling |
| Export Gate | Canonical blockers, manifest, preview, and local JSON/PDF renderers | Visual port after the input/export policy is reconciled |
| Audit Trail | Canonical audit events exist | Separate filtered presentation |
| Trust & Safety | System Card, admission truth, Safety Lab, guidance, and reports | Visual port with current truthful copy |

The Lovable shell, editorial color and typography tokens, compact
master-detail layouts, cards, filters, badges, navigation, and responsive
composition need visual porting. Lovable's Zustand fixtures, static counters,
toast-only actions, fixed graph data, mock exports, route casts, and
component-local review decisions must not be copied as functional truth.

### 4. Smallest safe proposed solution

#### Phase 0 — approval and baseline protection

1. Obtain explicit approval before creating a safety branch, committing the
   dirty worktree, installing dependencies, or running any networked setup.
2. Preserve the WIP without rewriting history, then run the smallest focused
   local-PDF tests and the existing verification commands.
3. Reconcile bundled-fixture-only product truth versus arbitrary local PDF
   intake. Record any approved product change in the authoritative brief,
   decision log, contracts, and export policy before relying on it.
4. Create and approve a bounded UI-integration task packet with exclusive
   write scope that does not overlap TASK-040.

#### Phase 1A — first implementation slice after approval

1. Port only the Lovable visual tokens, institutional landing, global shell,
   six-stage tracker, and a truthful Case Dashboard.
2. Keep `CFN-DEMO-001` as the stable internal identifier and treat the Lovable
   case reference as display metadata.
3. Allow only the complete M. Chen fixture to enter the existing functional
   workspace. Show secondary cases as visibly read-only summaries with no
   workspace link and no possibility of M. Chen data leakage.
4. Preserve the existing Purpose, Documents, Review, Export, Trust,
   `CaseStateProvider`, reducer, commands, reset, and API behavior.
5. Derive displayed progress and counts from canonical state. If a value is
   unavailable, say so; never copy Lovable's static counts.
6. Keep not-yet-integrated destinations visibly unavailable rather than
   creating blank or deceptive routes. Add each as a real routed feature in a
   later approved slice.

### 5. Files for the first implementation slice

Expected scope, subject to the approved task packet:

- `app/page.tsx` and a bounded Dashboard route.
- `app/globals.css` for ported visual tokens.
- `components/shell/` for the stage tracker and typed navigation.
- A small dashboard feature/view-model module that exposes display metadata
  and derives primary-case values from canonical state.
- Focused unit, component, accessibility, and end-to-end tests for only this
  slice.

Do not change provider routing, export policy, arbitrary-PDF contracts, or
new support-workflow domain state in Phase 1A.

### 6. Acceptance criteria for Phase 1A

- Both landing calls to action open the Dashboard.
- Dashboard cards are keyboard-operable, responsive, and truthful.
- Only the complete synthetic primary case can enter the workspace.
- Secondary cases remain read-only and cannot expose primary-case data.
- Active case identity is preserved through supported workspace navigation;
  unknown case identifiers fail safely.
- Existing Purpose → Documents → Review → Export and Trust behavior remains
  functional.
- Reset still dispatches the single canonical `reset_case` command.
- Counts and progress derive from `CaseState`; no parallel Zustand or
  page-local domain store is introduced.
- There are no dead links, fake actions, copied static claims, or blank route
  stubs.
- Keyboard focus, screen-reader semantics, reduced motion, zoom, and 320 px
  reflow remain usable.

### 7. Testing plan

After dependency installation is separately approved:

1. Re-run `git diff --check` and capture a clean baseline.
2. Run focused tests for the dirty local-PDF WIP before UI integration.
3. Add and run focused shell, Dashboard, routing, state-provider, read-only
   case, unknown-case, and reset tests.
4. Run regressions for Purpose, Documents, Review, Export, and Trust.
5. Run `npm run typecheck`, `npm run lint`, `npm run test:unit`,
   `npm run test:contracts`, `npm run test:components`, and `npm run build`.
6. Run Playwright for landing → Dashboard → primary Purpose, blocked secondary
   cases, case-preserving navigation, unknown-case fallback, reset, and the
   existing guided demo.
7. Run automated accessibility checks plus manual keyboard, focus, reduced
   motion, 320 px reflow, zoom, and macOS VoiceOver checks.
8. Verify the arbitrary-PDF WIP on a separate track, including provenance and
   export-policy tests, before calling it end-to-end functional.

### 8. Open questions and approval gates

- Approve or reject the Phase 0 safety branch and local WIP commit. No branch
  or commit has been created.
- Approve dependency installation before the planned test matrix. No package
  has been installed.
- Decide whether the product remains bundled-fixture-only or formally adopts
  arbitrary browser-local PDFs; the current authoritative documents and WIP
  disagree.
- Approve a new UI-integration task packet and write scope before Phase 1A.
- Live-provider work, credentials, spend, preview deployment, and production
  deployment remain separate decisions and are not authorized by this plan.

## 1. Goal

Ship one fully demonstrable ContextFirst Nexus application at the existing
`https://contextfirst-nexus.vercel.app` URL by combining:

- the Lovable interface from `rajpatilrobotics/case-navigator`; and
- the tested contracts, state engine, document processing, review logic,
  export gate, audit, safety, evaluation, and replay path already implemented
  in `rajpatilrobotics/contextfirst-nexus`.

The result should look like the Lovable product while behaving like the
working ContextFirst application.

## 2. Problem

- `case-navigator` contains the preferred interface and all intended routes,
  but its data is static synthetic fixture data and most actions only update
  component or Zustand memory.
- The Structured Analysis Lovable change is present in GitHub at `135e3bd`,
  but the later Evidence Gaps redesign and proposed Interview Planner
  enhancement are not in GitHub.
- `contextfirst-nexus` contains the valuable working domain core and the
  existing Vercel project, but its presentation layer is not the desired UI.
- The local `contextfirst-nexus` checkout contains substantial uncommitted,
  typechecking arbitrary-PDF and local-analysis work. It must be preserved
  before integration begins.
- Running two separate applications would duplicate state, review, audit,
  export, and safety logic and would complicate the judge-facing deployment.

## 3. Proposed solution

Use `contextfirst-nexus` as the canonical repository and deployment target.
Use `case-navigator` as a read-only visual and component reference.

Before changing application code:

1. Preserve the current dirty `contextfirst-nexus` work on an explicit safety
   branch and commit after user approval.
2. Create a focused integration branch from that preserved state.
3. Keep the existing contracts, reducer, selectors, API boundary, replay,
   document pipeline, export engine, audit rules, and safety boundaries.
4. Replace the old shell and feature presentation incrementally with the
   Lovable layout, styles, routes, and compact master-detail workspaces.
5. Recreate the unsynced Evidence Gaps design from the archived screenshot and
   build the approved Interview Planner improvements directly in Codex.
6. Add real typed state and audit behavior for the new support workflows rather
   than leaving their controls as decorative toasts.
7. Verify the complete judge flow locally and on a Vercel preview before any
   explicitly approved production deployment.

The hackathon definition of “fully working” is a reliable, interactive,
source-grounded single-case demonstration with local PDF intake, deterministic
replay/local extraction, human review, dependency invalidation, safe export,
and audit. Production authentication and durable multi-user storage remain
out of scope unless separately approved.

## 4. Files to change

Primary target: `contextfirst-nexus`

- `app/` for the Lovable route structure and existing API boundary.
- `components/shell/` and `components/ui/` for the new shell and shared UI.
- `features/purpose/`, `features/documents/`, `features/review/`,
  `features/export/`, and `features/trust/` for presentation replacement and
  existing behavior wiring.
- New bounded feature folders for dashboard, urgent needs, interview planning,
  services/referrals, tasks, and notes.
- `lib/contracts/`, `lib/state/`, and `lib/review/` only for typed commands,
  selectors, audit events, and state required by the new workflows.
- Focused unit, contract, component, accessibility, and end-to-end tests.
- `PROJECT_BRIEF.md`, `docs/PRODUCT_SPEC.md`, and `decision-log.md` only when
  new implemented workflow behavior needs to become product truth.

Reference only: `case-navigator`

- `src/styles.css`
- `src/components/case-shell.tsx`
- `src/components/nexus-ui.tsx`
- `src/routes/`
- `src/fixtures/case.ts`

Do not rewrite or force-push the Lovable repository history.

## 5. Step by step tasks

1. [ ] With user approval, preserve the current dirty working tree on a named
   safety branch and commit it without pushing or rewriting existing history.
2. [ ] Run the focused tests for the arbitrary-PDF WIP, fix only baseline
   failures, and record the verified starting point.
3. [ ] Create the integration branch and port the Lovable global styles,
   landing page, dashboard, case shell, six-stage tracker, and 12 sidebar
   destinations without changing domain behavior.
4. [ ] Bind Purpose and Documents to the existing canonical state, local PDF
   extraction, masking, coverage, and analysis-start commands.
5. [ ] Bind Structured Analysis, Evidence Gaps, Nexus Map, and Timeline to
   existing selectors, citations, review decisions, and dependency
   invalidation. Recreate the unsynced Evidence Gaps layout.
6. [ ] Implement typed, audited workflows for Urgent Needs, Interview Planner,
   Services & Referrals, Case Tasks, and Notes & Journal, using the Lovable UI
   and the approved compact Interview Planner design.
7. [ ] Bind Export Gate, semantic preview, JSON/PDF downloads, Audit Trail,
   Trust & Safety, and reset behavior to canonical state.
8. [ ] Complete the strongest demo path: load/select documents, process,
   analyze via labelled replay or conservative local extraction, review exact
   citations, expose a gap, convert it into an action, reject supporting
   evidence, observe dependent Nexus invalidation, and see export blocked.
9. [ ] Run typecheck, lint, unit, contract, component, accessibility,
   end-to-end, security, build, and manual desktop checks.
10. [ ] Create and inspect a Vercel preview. Deploy to the existing production
    URL only after explicit user approval.

## 6. Acceptance criteria

- The judge-facing interface matches the Lovable information architecture and
  visual direction, including all 12 workspace destinations.
- No route is a blank stub; support screens may be lighter, but their primary
  actions update canonical state and produce audit events.
- Purpose, documents, masking, analysis, citations, review, dependency
  invalidation, evidence gaps, Nexus, timeline, export gate, JSON/PDF export,
  audit, and trust behavior remain functional.
- Uploaded PDF bytes and extracted text retain the approved local-only privacy
  boundary.
- Every consequential item preserves separate evidence nature, origin,
  support, and review status.
- Evidence Gaps can create accountable interview, document-request, comparison,
  preservation, or task actions.
- Interview questions expose their gap, Nexus, citation, origin, rationale,
  sensitivity, and explicit practitioner-review state.
- Unsafe features remain prohibited: credibility scoring, deception/emotion
  inference, automated legal conclusions, AI auto-approval, and hidden live
  provider transmission.
- The app builds successfully and the complete demo works at the unchanged
  `contextfirst-nexus.vercel.app` URL after approved production deployment.

## 7. Testing plan

- Preserve and verify the current arbitrary-PDF WIP before UI integration.
- Add focused unit tests for new commands, selectors, gap conversions,
  interview readiness, task/referral state, audit events, and export blockers.
- Add component tests for every new interactive screen and important empty,
  loading, error, blocked, and reset state.
- Keep contract tests around analysis requests, citations, review decisions,
  export manifests, and audit records.
- Run Playwright through the complete judge demo and important keyboard paths.
- Run automated accessibility checks and manually verify focus, labels, status
  semantics, responsive stacking, and non-color state communication.
- Compare the implemented screens with the archived Lovable and Replit
  references at consistent desktop viewports.
- Verify local JSON/PDF downloads and a Vercel preview before production.

## 8. Open questions

- Approval is required before creating the safety branch and committing the
  existing uncommitted `contextfirst-nexus` work.
- The safe default is the labelled deterministic replay plus conservative
  local extraction. Enabling a live AI provider requires separate credentials,
  evaluation/admission evidence, spend approval, and production approval.
- Production authentication and durable multi-case storage are not necessary
  for the hackathon demonstration and should not delay the working judge flow.

# ContextFirst Nexus Documentation Foundation Plan

## Current program update, 2026-07-17

The original documentation foundation and TASK-001 through TASK-038 implementation program are integrated. The approved next direction removes provider and model selection from the practitioner-facing product because ContextFirst Nexus is a case-preparation application, not a developer platform.

- TASK-039 will simplify the current replay-only public demo to one plain-language `Start analysis` path. It will automatically bind the only selectable bundled replay release, fail closed if replay is unavailable or selection is ambiguous, preserve internal provenance and `providerTransmission: false`, and keep the prepared checkpoint separate.
- TASK-040 will begin with exact contract and architecture reconciliation, then implement server-managed live-provider routing only behind the existing global server gate and static admission. Its frozen future order is OpenAI, Gemini, Mistral, then an evaluated fourth provider. Groq `openai/gpt-oss-120b` is only the current fourth-provider evaluation candidate and is not admitted, enabled, configured, or approved for calls or deployment.
- This direction explicitly supersedes the practitioner-controlled provider-selection and provider-switching plan recorded in DEC-025. Replay remains separate from live AI, and no live provider may be enabled without exact evaluation, reviewed static admission, credentials, spend approval, and separate production approval.

## Current implementation pass, 2026-07-18

### Goal

Make the hackathon demo feel interactive: remove model/provider choices from the practitioner UI and make Documents begin empty until the user selects the seven bundled demo PDFs.

### Problem

The current Documents screen immediately shows D01-D07, so it looks prefilled and static. The practitioner-facing Purpose flow also exposes implementation details that should be managed by the system.

### Proposed solution

- Keep one plain-language analysis action with provider/model details hidden from practitioners.
- Add a real browser-local multi-file PDF chooser. Nothing is transmitted to a server.
- Validate the selected packet against the seven bundled demo files, then show clear `Selected`, `Verified`, `Processing`, and `Ready` progress.
- Reveal D01-D07 and enable the existing processing/review flow only after validation succeeds.
- Use plain demo-safety copy on Documents without presenting the packet as already loaded.

### Files to change

- Purpose/provider UI files already owned by TASK-039.
- `features/documents/`, `lib/documents/`, and focused component/unit tests.
- This plan checkpoint.

### Step by step tasks

1. Recover and integrate the completed model-selector removal.
2. Add exact seven-file browser-local PDF packet validation.
3. Replace the prefilled Documents screen with an empty chooser and visible progress states.
4. Connect validated files to the existing local PDF processing flow.
5. Run focused tests, typecheck/build, inspect the local demo once, then commit and push.

### Acceptance criteria

- Documents starts empty and D01-D07 are not shown before selection.
- The user can choose the seven bundled PDFs from macOS Finder.
- Unknown, incomplete, duplicate, non-PDF, or modified packets fail safely.
- Accepted files visibly progress through the four required states and remain browser-local.
- Existing D04 coverage limitation and D07 inert-content safeguards remain intact.
- No model/provider chooser is shown to practitioners.

### Testing plan

- Focused Documents unit/component tests.
- Focused Purpose/analysis UI tests.
- Typecheck and production build.
- One local browser pass through empty, rejected, and accepted packet states.

### Open questions

- None for this pass. Server upload, arbitrary real-case files, OCR, and cloud storage remain out of scope.

## Flexible local PDF intake clarification, 2026-07-18

### Goal

Let a practitioner select one or more PDFs without a false seven-file error, and make the boundary between local PDF reading and the prepared demo analysis unmistakable.

### Problem

The current Documents step presents a frozen seven-file fixture verifier as if it were a general upload tool. It can label files ready even when a page could not be read, and it shows later analysis stages as pending alongside local PDF-reading stages. A first-time user cannot tell whether a PDF is valid, whether text was extracted, or why analysis has not started.

### Proposed solution

- Accept any non-empty set of ordinary PDFs for browser-local inspection.
- Show concise per-file results: pages read, readable text found, or a clear warning when text cannot be extracted.
- Keep arbitrary uploaded files separate from the canonical D01-D07 replay state; do not manufacture fixture findings for unrelated documents.
- Unlock the prepared replay only for the exact verified demo packet and explain that limitation in plain language.
- Separate local PDF-reading progress from downstream analysis progress, which starts only after the user explicitly starts analysis.
- Treat familiar document types such as job offers, recruiter messages, travel records, and practitioner notes as optional organization labels only. A practitioner may leave a file unclassified or choose `Other` with a custom title; categories must never become required upload slots.

### Files to change

- `lib/documents/pdf-source-service.ts` and `lib/documents/index.ts`.
- `features/documents/pdf-selection-panel.tsx`, `documents-workspace.tsx`, `document-cards.tsx`, and `processing-stage-list.tsx`.
- Focused Documents unit and component tests.

### Step by step tasks

1. [x] Add safe 1..N PDF validation and browser-local inspection without persisting file bytes or raw text.
2. [x] Detect the exact prepared demo packet separately from general local files.
3. [x] Simplify the Documents UI and accurately label readable, warning, and unavailable states.
4. [x] Explain that candidate, citation, timeline, and export checks begin only after analysis starts.
5. [x] Verify focused tests, typecheck, lint, build, and the local browser flow.

### Acceptance criteria

- Selecting one PDF is accepted instead of producing a seven-file-count error.
- Any non-empty set of valid PDFs can be inspected locally, within safe file limits.
- Local inspection never creates D01-D07 records, candidates, citations, or exports for unrelated PDFs.
- Page-read failures cannot be presented as successful text extraction.
- The exact demo packet can still enter the existing masking, replay, Review, and Export journey.
- The UI clearly says that arbitrary-document AI analysis is not connected in this demo.

### Testing plan

- Unit tests for flexible validation, limits, readable pages, image-only pages, and failed PDF loading.
- Component tests for one-file intake, multi-file intake, local-only completion, and exact demo-packet handoff.
- Typecheck, lint, production build, and one desktop browser pass.

### Open questions

- Full analysis of arbitrary case documents remains a separate future feature requiring a generalized case contract and an approved live analysis pipeline.
- Optional document-type labels are the recommended next intake enhancement. They should organize uploaded files, not determine whether a file is accepted or analyzed.

## Fast-track workflow redesign, 2026-07-18

### Goal

Turn the working demo into a simple guided journey that a first-time hackathon judge can finish without guessing where to click next.

### Problem

The current UI exposes too many internal stages, large technical panels, and repeated status details. Purpose has no obvious forward action, Documents expands into a long engineering checklist, and Review/Export do not feel like one continuous workflow.

### Proposed solution

- Keep the four real stages, but present them as a compact persistent journey header with an obvious current step.
- Add a primary `Continue` action after each successful stage.
- Make Documents progressive: choose files, process them, resolve only required checks, then start analysis. Hide advanced details until requested.
- Replace giant document and processing cards with compact rows and concise summaries.
- Keep canonical state, safety gates, masking, coverage, citations, review decisions, export gating, and local-only processing unchanged.

### Files to change

- `components/shell/` and global UI styles.
- `features/purpose/`, `features/documents/`, `features/review/`, and `features/export/` presentation files.
- Focused component tests only where visible labels or navigation change.

### Step by step tasks

1. [x] Simplify the shared shell and compact the persistent progress journey.
2. [x] Add a clear Purpose completion confirmation and Continue to Documents action.
3. [x] Collapse Documents into four understandable phases and compact technical detail.
4. [x] Simplify Review and Export hierarchy while retaining all working actions and blockers.
5. [x] Verify focused flows, typecheck, lint, build, and inspect the local desktop journey.

### Acceptance criteria

- A first-time user always sees the current stage and the next primary action.
- Purpose can advance directly to Documents after saving.
- Documents does not show the entire internal pipeline at once.
- Seven selected documents fit in a compact summary rather than seven giant panels.
- Technical coverage, mask, and source details remain accessible but are secondary.
- No canonical state, safety rule, or export gate is bypassed.

### Testing plan

- Focused Purpose, Documents, Review, Export, and shell component tests.
- Typecheck and lint.
- Production build.
- One local desktop pass from Purpose through Export.

### Open questions

- None. The local desktop flow is ready for user review before any commit, push, or deployment.

## Safari PDF compatibility fix, 2026-07-18

### Goal

Make the same verified demo PDFs extract successfully in Safari and Chromium.

## Arbitrary local document analysis, 2026-07-18

### Goal

Let a judge choose any non-empty set of PDFs and continue through a useful, honest local analysis flow without requiring the prepared seven-file packet or a live AI model.

### Problem

The current intake can inspect arbitrary filenames, but Safari page extraction may fail and the canonical Review flow is still tied to the prepared replay. That leaves valid user-selected files blocked behind demo-packet language.

### Proposed solution

- Repair browser PDF text extraction for ordinary text PDFs.
- Accept any number of PDFs within the existing safety limits.
- Convert readable pages into session-only document and source records.
- Derive conservative local review items from extracted text using deterministic rules, clearly labelled as local document triage rather than AI or legal conclusions.
- Preserve unreadable or scanned pages as explicit limitations while allowing readable files to continue.
- Keep the prepared replay available as a separate optional demonstration path.

### Files to change

- `lib/documents/` PDF reading and local-analysis helpers.
- Central contracts/state only where needed to carry browser-local records.
- `features/documents/` and the existing run controller for the guided transition.
- Focused unit and component tests.

### Step by step tasks

1. Fix Safari-compatible text extraction and explain scanned/unreadable pages plainly.
2. Build dynamic document, page, and segment records for any selected PDFs.
3. Add a deterministic local triage run that creates reviewable citations and items from those segments.
4. Connect Documents to Review with one obvious action and remove the demo-packet-required message.
5. Run focused tests, typecheck, lint, and a local browser pass.

### Acceptance criteria

- One PDF or more than ten PDFs can be selected, subject only to existing size/count safety limits.
- Arbitrary filenames are accepted.
- Readable text PDFs proceed without the prepared packet.
- Mixed readable/unreadable input proceeds with visible limitations; an entirely unreadable set explains that OCR is needed.
- Review receives only statements grounded in extracted text with exact source links.
- No live provider, fabricated finding, or legal conclusion is implied.
- Raw PDF bytes and extracted text are not sent to a server or persisted in browser storage.

### Testing plan

- Unit tests for PDF extraction, dynamic record creation, and deterministic triage.
- Component tests for one-file, many-file, mixed-quality, and all-unreadable flows.
- Typecheck, lint, focused tests, and one Safari/Chromium local pass.

### Open questions

- OCR for image-only PDFs is not available in this fast pass; those pages remain explicit limitations.

### Problem

Safari can reject the modern PDF.js runtime even though file validation succeeds. The resulting failure is persisted in the current tab and appears as seven text-extraction failures.

### Proposed solution

- Load PDF.js's matching legacy browser runtime and worker.
- Keep the existing local-only file boundary and processing contracts unchanged.
- Verify focused document tests, build, and a fresh seven-file browser run.

### Acceptance criteria

- The reader and worker use the same PDF.js legacy build.
- A fresh seven-file run opens all expected readable pages.
- No AI provider is called during PDF extraction.

## 1. Goal

Create a complete, consistent documentation foundation that gives Codex enough product, technical, safety, design, testing, and execution context to build ContextFirst Nexus through a rolling pool of separate worktree tasks.

This phase creates documentation only. Application implementation begins only after the documentation is reviewed and approved.

## 2. Problem

The repository currently contains a blank Next.js shell and a completed infrastructure plan. The detailed research and product reasoning live outside the Git repository, so new Codex worktrees cannot access them. The repository also lacks shared contracts, task boundaries, verification rules, and an orchestration process.

Starting parallel implementation now would create a high risk of inconsistent assumptions, overlapping edits, merge conflicts, unsafe product behavior, and wasted time.

## 3. Proposed solution

Distill the approved research into a small set of authoritative repository documents. Define the product and demo first, then freeze its architecture, interfaces, safety boundaries, design system, fixtures, and evaluation criteria. Finally, create a dependency-aware task graph and one self-contained packet for every implementation worktree.

Keep `AGENTS.md` concise. It will define durable repository rules and direct each worker to its task packet and only the relevant shared documents. A coordinator will maintain a rolling pool of ready worktree tasks, integrate verified commits, and prevent concurrent edits to shared files.

## 4. Files to change

Create or update only documentation and Codex orchestration files inside this repository:

- `AGENTS.md`
- `PROJECT_BRIEF.md`
- `README.md`, deferred to implementation TASK-025 rather than changed in this documentation phase
- `plan.md`
- `decision-log.md`
- `PLANS.md`
- `TASK_GRAPH.yaml`
- `docs/CONTEXT_INDEX.md`
- `docs/PRODUCT_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTRACTS.md`
- `docs/SAFETY_AND_DATA.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/DEMO_AND_FIXTURES.md`
- `docs/MODEL_ROUTING.md`
- `docs/TESTING_AND_EVALUATION.md`
- `docs/SOURCE_REGISTER.md`
- `docs/ORCHESTRATION_AND_INTEGRATION.md`
- `tasks/TASK-XXX.md` files for each approved work package

Add `.codex/config.toml`, `.env.example`, or `.worktreeinclude` only later if the approved architecture or worktree setup requires them. Do not copy the private parent-folder research notes into the public repository.

## 5. Step by step tasks

1. [x] Audit the repository, current Codex behavior, worktree requirements, and documentation gaps.
2. [x] Create the product-truth documents: project brief, product specification, safety and data rules, demo and fixture specification, and vetted source register.
3. [x] Review the product-truth documents together and resolve contradictions, unsupported claims, open scope decisions, and non-goals.
4. [x] Create the engineering documents: architecture, contracts, design system, and testing and evaluation plan.
5. [x] Review and freeze shared names, data schemas, module boundaries, provider choices, user flows, and quality gates.
6. [x] Research and freeze the original multi-provider approach; its practitioner-controlled selection and recovery portion is superseded by the 2026-07-17 managed-analysis direction and follow-up TASK-039/TASK-040 reconciliation.
6a. [x] Add and freeze one evaluated free live option after Gemini, including contracts, disclosures, display order, and tests.
7. [x] Create the execution documents: `AGENTS.md`, `PLANS.md`, context index, orchestration and integration rules, and decision log.
8. [x] Create an acyclic `TASK_GRAPH.yaml` with 26 bounded tasks, explicit dependencies, active-write ownership, dependency-ordered ownership transfer, and rolling scheduling rules.
9. [x] Create one self-contained `tasks/TASK-XXX.md` packet per worktree with exact context, scope, contracts, acceptance criteria, verification, commit permission, and handoff requirements.
10. [x] Audit the complete document set for missing information, conflicting instructions, unsafe claims, broken paths, excessive context, task ownership, task-graph integrity, and document structure.
11. [x] Present the final documentation package for approval before any application implementation.
12. [x] After explicit approval, commit and push the documentation to the permanent repository.
13. [x] Add the exact `contextfirst-nexus` Git repository folder as a Codex project and complete the rolling implementation and replay-only release program through TASK-038 and TASK-025.
14. [x] Implement and integrate TASK-039 to remove practitioner-facing provider/model selection and provide one fail-closed replay-only `Start analysis` experience.
15. [ ] After TASK-039 integrates, reconcile and implement TASK-040 managed server-side routing with classified safe fallback, exact admission gates, bounded attempts, isolated outputs, and no replay misrepresentation.

## 6. Acceptance criteria

- A new Codex task can understand the product without relying on this chat or private parent-folder notes.
- Product purpose, users, workflow, demo, non-goals, terminology, and responsible-AI boundaries are explicit and consistent.
- Technical choices, module boundaries, data contracts, APIs, states, and error behavior are defined before parallel feature work begins.
- Every task has one bounded outcome, satisfied dependencies, exclusive active-write ownership, observable acceptance criteria, and exact verification commands. The one static-admission ownership transfer is dependency-ordered and never concurrent.
- The coordinator can keep ready worktree slots filled without waiting for unrelated tasks.
- Workers cannot silently change shared contracts, dependencies, deployment configuration, or product scope.
- Unsupported legal conclusions, victim or credibility scoring, unsafe data use, and unverified claims are explicitly prohibited.
- No secrets, private research, credentials, survivor data, or unsupported partnership claims enter the public repository.
- Application code remains unchanged during this documentation phase.
- The practitioner-facing Purpose flow contains no provider or model chooser and cannot silently select a live provider.
- The current public deployment remains replay-only; exactly one selectable replay may be bound automatically, while zero or multiple selectable services fail closed.
- Future managed live routing is server-owned, bounded, admission-gated, records safe attempt metadata, accepts at most one result, never merges outputs, and falls back only for explicitly classified pre-execution operational failures.

## 7. Testing plan

- Inspect the final Git diff and confirm that only approved documentation and orchestration files changed.
- Check every internal file reference and required-reading path.
- Validate that the task dependency graph has no cycles and that every dependency exists.
- Compare file-ownership rules across all task packets and remove overlapping write access.
- Review each task packet as if the worker has no chat history and confirm it is independently executable.
- Verify that acceptance criteria describe user-visible or test-observable behavior.
- Confirm that shared contracts, fixtures, safety rules, and verification commands agree across all documents.
- Confirm that no private parent-folder content or secrets are included.

## 8. Open questions

- Confirm the final API credentials and external services available before implementation begins. Credentials will never be written into documentation or committed.
- Decide the final number of active worktree slots after a lightweight setup test on the MacBook Air M2. Start conservatively and increase only if memory and build performance remain stable.
- Resolved product direction: practitioners do not select providers or models. Current public analysis uses only labelled local replay. Future server-managed live routing is ordered OpenAI, Gemini, Mistral, then an evaluated fourth provider; Groq `openai/gpt-oss-120b` is only the current evaluation candidate and remains unavailable until its exact API behavior, structured output, data-use and retention disclosure, evaluation, static admission, credentials, spend, provider-call approval, and deployment approval are all separately satisfied. Deterministic replay remains separate and visibly labelled, never a disguised live fallback result.
- Resolved for P0: no OCR, no production authentication, no durable server case store, versioned redacted synthetic state in browser session storage, PDF.js text extraction, and local React-pdf plus JSON exports. Exact installed versions and measured model choices will be recorded before dependent tasks launch.
- The active graph will contain 40 task packets after TASK-039 and TASK-040 are documented. Any later count change requires coordinated updates to the graph, affected packets, ownership rules, and integration order.

---

# Planning record edit and removal pass, 2026-07-28

## 1. Goal

Make Interview Questions, Case Tasks, and Notes editable and safely removable after creation.

## 2. Problem

Questions and Notes already have canonical edit/removal lifecycles, but Case Tasks expose only status changes and do not provide an obvious edit/remove action.

## 3. Proposed solution

Preserve history: remove questions through `removed`, tasks through `cancelled`, and notes through `archived`. Add a canonical task-update command and reuse the compact compose dialog for task editing.

## 4. Files to change

- `lib/contracts/index.ts`
- `lib/state/index.ts`
- `features/previews/planning-preview-workspaces.tsx`
- focused planning tests

## 5. Step by step tasks

1. Add and reduce a canonical `update_case_task` command.
2. Add visible Edit and Remove task controls.
3. Verify existing question edit/remove and note edit/archive behavior.

## 6. Acceptance criteria

- Task wording can be edited and persists.
- Removing a task records `cancelled` without erasing history.
- Question removal and note archival remain canonical and visible.

## 7. Testing plan

Run focused planning component and reducer tests, typecheck, and `git diff --check`.

## 8. Open questions

None. The user explicitly approved this bounded implementation.
