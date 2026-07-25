# ContextFirst Nexus Functional Integration Audit

Audit date: 2026-07-25
Local commit audited: `af2940865fb3eba478d6725b25927c46fa0baa32` (`main`, aligned with `origin/main` at audit start)
Production audited: `https://contextfirst-nexus.vercel.app`

## Post-audit resolution — 2026-07-25

The broken Case Tasks **Export blockers** filter was removed, Trust & Safety PDF-capability copy was corrected, and the generic Documents action labels were clarified. Focused Tasks, Trust and Documents tests, typecheck, production build, diff check and a reset-complete judge smoke all passed. No audited judge-visible truthfulness blocker remains.

## Executive summary

The M. Chen judge journey is functionally integrated, but it is a browser-session demonstration rather than a traditional multi-user case-management product.

The important workflow mutations use the shared `CaseStateProvider`, validated `CaseCommand` contracts, the central reducer in `lib/state/index.ts`, schema-checked `sessionStorage` persistence, derived Dashboard selectors, safe audit summaries, dependency recalculation, and the fail-closed Export Gate. The production journey successfully created a canonical review decision, interview question, urgent need, local referral plan, task, and practitioner note; the changes survived navigation and reload; Dashboard counts and Audit rows updated; planning text did not enter the Export Gate; and reset restored the bundled fixture.

No live AI provider is admitted or enabled. Prepared M. Chen analysis is a deterministic bundled replay. Arbitrary text-based PDFs have a genuine local embedded-text extraction path, but no OCR and no persistence across reload by explicit safety policy.

Two visible controls/copy areas are misleading:

1. The Case Tasks **Export blockers** filter is hard-coded to return no rows.
2. Trust & Safety says there is “no arbitrary upload,” while Documents implements a browser-local arbitrary embedded-text PDF path.

Neither issue blocked the exercised judge journey, so this audit found no P0 demo blocker. They should be corrected before calling every visible control truthful.

## Method

- Traced every destination from the rendered control through its handler, command/API, reducer, persistence, downstream selectors, Audit/Export/dependency consequences, and focused tests.
- Inspected source and existing focused tests without running the full suite.
- Exercised production using only the bundled fictional M. Chen state. No real personal or case data was entered.
- Created only synthetic browser-session records, verified reload persistence, and reset the demonstration at the end.
- Did not change application code, dependencies, Git history, deployment, or Vercel settings.

### Status meaning

- **FULLY FUNCTIONAL** — complete for its stated non-mutating or server-derived purpose.
- **FUNCTIONAL — BROWSER LOCAL** — canonical and consequential within the documented browser-session policy; not backed by durable server storage.
- **PARTIAL** — some real wiring exists, but the visible control does less than its label suggests.
- **UI ONLY** — a deliberate local projection, filter, selection, tab, or presentation control with no canonical mutation.
- **INTENTIONALLY DISABLED** — unavailable by an explicit product or safety boundary.
- **BROKEN** — visible behavior or copy is misleading or cannot perform its advertised function.
- **NOT APPLICABLE** — capability is not part of this demonstration build.

## Functional integration matrix

| Screen/feature | UI present | Canonical model | Commands/reducer | Persistence | Dashboard linkage | Audit linkage | Export/dependency linkage | Browser result | Status | Evidence/files |
|---|---|---|---|---|---|---|---|---|---|---|
| Landing | Yes | Static product/safety presentation | Navigation only | N/A | Opens Dashboard | N/A | N/A | **Start demonstration** opened Dashboard | FULLY FUNCTIONAL | `app/page.tsx`; `components/marketing/marketing-shell.tsx` |
| Case Dashboard — M. Chen | Yes | Projects the shared `CaseState` and planning selectors | No duplicate case mutation state; workspace link opens canonical case | Same `sessionStorage` state as workspace | Counts derive from candidates, gaps, urgent needs and tasks | N/A | Export badge derives from current gate; analysis freshness uses the shared freshness selector | Counts changed to 2 urgent needs, 3 tasks and 3 pending items, then survived reload | FUNCTIONAL — BROWSER LOCAL | `features/dashboard/case-dashboard.tsx`; `lib/analysis/freshness.ts`; `lib/planning/index.ts`; `tests/components/dashboard/dashboard.test.tsx` |
| Dashboard — secondary cases | Yes | Explicit read-only summaries; no copied M. Chen state | No handler that opens a workspace | N/A | Explicitly “Unavailable” | N/A | N/A | A. Okafor and R. Salazar remained read-only | INTENTIONALLY DISABLED | `features/dashboard/case-dashboard.tsx`; `tests/components/dashboard/dashboard.test.tsx` |
| Dashboard — New case | Yes | No case-create model exists | Opens an explanatory modal; creates nothing | N/A | No count change | No event | No export effect | Modal truthfully said case creation is unavailable | INTENTIONALLY DISABLED | `features/dashboard/case-dashboard.tsx`; `tests/components/dashboard/dashboard.test.tsx` |
| Purpose Brief | Yes | `CasePurposeBrief` with revision, recipient, authority, prohibited decisions and export request | `save_purpose` → central reducer; `/api/analyze` availability is schema-checked | Persists for fixture state; tampered state fails closed | Purpose/readiness status derives from state | `purpose_saved` safe event | Purpose revision invalidates analysis freshness and existing export; prerequisites require a complete Purpose | Form and API availability loaded; Documents remained accessible but analysis was correctly blocked before Purpose | FUNCTIONAL — BROWSER LOCAL | `features/purpose/purpose-workspace.tsx`; `features/purpose/case-purpose-brief-form.tsx`; `app/api/analyze/route.ts`; `lib/state/index.ts`; purpose component tests |
| Purpose — prepared Review checkpoint | Yes | Trusted fixture checkpoint with canonical Purpose, documents, masking, run, citations, candidates and seeded fixture-reviewer decisions | `load_demo_checkpoint` validates replay/checkpoint identity through the central reducer | Persists in the browser session | Dashboard changed to 7 documents and prepared analysis | `analysis_completed`, attributed to fixture reviewer | Creates a fresh canonical run and review/export state; no provider transmission | Loaded 7 documents, 14 candidates and prepared review state | FUNCTIONAL — BROWSER LOCAL | `lib/analysis/replay.ts`; `lib/state/index.ts`; `tests/unit/replay/replay.test.ts`; `tests/unit/fixtures/canonical-review-fixture.test.ts` |
| Documents — bundled source preparation and health | Yes | Canonical documents, pages, segments, processing stages, coverage, masks and selected segment IDs | Begin/complete/fail/retry processing; select documents; review masks/coverage; reveal source; start analysis | Bundled fixture state persists | Document count and analysis readiness derive from state | Processing, masking, coverage and reveal actions use safe events where policy requires | `deriveAnalysisPrerequisites` gates analysis; document/mask/selection changes stale analysis and export | Prepared packet showed 7 verified PDFs, one preserved limitation, approved masking and analysis readiness | FUNCTIONAL — BROWSER LOCAL | `features/documents/documents-workspace.tsx`; `features/documents/analysis-prerequisites.tsx`; `lib/documents/pdf-source-service.ts`; document tests |
| Documents — arbitrary embedded-text PDF path | Yes | Creates browser-local canonical documents, pages and segments from selected PDFs | PDF.js extraction → processing commands → `run_local_source_extraction` for a deterministic local result | Deliberately not serialized; browser-local documents cause stored fixture state to be removed | Can affect in-memory document/readiness projections | Relevant processing/reveal actions remain canonical during the session | Can run local extraction; no live provider; reload resets by explicit data policy | Production exposed the PDF intake and local-only disclosure; implementation and focused PDF tests verify real extraction | FUNCTIONAL — BROWSER LOCAL | `lib/documents/pdf-source-service.ts`; `features/documents/documents-workspace.tsx`; `features/analysis/run-controller/index.ts`; local PDF/masking tests |
| Documents — scanned/image-only OCR | Status/error UI exists | Page availability records preserve `image_only`/OCR-required limitations | No OCR command or service | N/A | Not ready for analysis | Failure is visible | Cannot support analysis/export as readable evidence | UI disclosed “OCR is unavailable” and asked for a text-based PDF | INTENTIONALLY DISABLED | `features/documents/document-cards.tsx`; `features/documents/documents-workspace.tsx`; `lib/documents/pdf-source-service.ts` |
| Documents — Add source / Retry extraction / Replace row controls | Yes | Uses the real document state | Buttons scroll/focus the generic intake or processing controls; they are not row-specific retry/replace commands | Underlying real action follows the destination control | Indirect | Indirect | Indirect | Controls navigated to the real intake/processing area, but labels imply a more direct row action | PARTIAL | `features/documents/document-cards.tsx`; `features/documents/documents-workspace.tsx` |
| Structured Analysis — run and candidates | Yes | Uses the current successful, fresh canonical run and its candidates only | Bundled path starts `run_deterministic_replay`; arbitrary path starts `run_local_source_extraction`; review actions use canonical commands | Persists for fixture run; local arbitrary-PDF policy applies | Pending review and analysis status update from state | Analysis and consequential review events are canonical | Stale, failed, blocked, coverage-warning, empty and zero-result states are explicit | Production loaded 14 candidates in three canonical lanes; a review decision updated state | FUNCTIONAL — BROWSER LOCAL | `features/analysis/run-controller/index.ts`; `features/analysis/structured/structured-analysis-workspace.tsx`; structured-analysis and run-controller tests |
| Structured Analysis — lanes, filters, search and selected candidate | Yes | Read-only projections over current canonical candidates; selected ID is local UI state | No domain command until a review/source action is chosen | UI selection is not persisted by design | Counts derive from canonical candidates | No event for filtering/selection | No export/dependency mutation from filtering | Lane/status/origin/support/search controls filtered the visible canonical list | UI ONLY | `features/analysis/structured/structured-analysis-workspace.tsx`; `tests/components/analysis/structured-analysis-workspace.test.tsx` |
| Structured Analysis — live provider/model run | Provider names and availability are visible | Provider registry/admission records exist, all current live admissions are `not_evaluated` | `/api/analyze` rejects live use when disabled; no provider command is selectable | N/A | No live run can appear | Failed/blocked attempts are safely represented | No provider transmission can affect export | Trust showed OpenAI, Gemini and Mistral as unavailable; prepared replay was selectable | INTENTIONALLY DISABLED | `app/api/analyze/route.ts`; `lib/ai/server/live-analysis-policy.ts`; `lib/ai/server/registry.ts`; provider/admission tests |
| Candidate review, citation and source reveal | Yes | Candidate revisions, `ReviewDecision`, citations and resolution/reveal records are canonical | `review_candidate`, `resolve_citation`, `reveal_source` → reducer | Persists for fixture state and survived reload | Pending-review count changes | `candidate_reviewed`, citation and reveal events | Review status, citation validity and masking affect dependencies/export | Marked CAND-CTRL-PASSPORT uncertain; result rendered, Dashboard changed, Audit row appeared | FUNCTIONAL — BROWSER LOCAL | `features/review/candidate/*`; `features/review/source/source-drawer.tsx`; `lib/review/index.ts`; review/source tests |
| Withdrawal and dependency recalculation | Yes | Candidate inclusion/review status and `DependencyChange` records are canonical | `withdraw_candidate` previews and applies reachable dependency invalidation | Persists for fixture state | Candidate/review counts re-derive | `evidence_withdrawn` | Reachable dependants are recalculated/invalidated; current export is revoked; unrelated decisions remain unchanged | Source implementation and focused withdrawal/Nexus tests verified; not mutated in production journey | FUNCTIONAL — BROWSER LOCAL | `features/review/dependency/*`; `lib/review/index.ts`; `lib/state/index.ts`; dependency/Nexus/review unit tests |
| Evidence Gaps — response and required review | Yes | Fresh active `context_gap` candidates and canonical context responses | `respond_context_gap`; required review still uses `review_candidate` | Persists for fixture state | Open-gap/review counts derive from current candidates | Safe response/review events | Gap/review completeness affects Export Gate; responses do not invent evidence | Two unresolved gaps rendered with explicit unknown/limitation handling | FUNCTIONAL — BROWSER LOCAL | `features/review/context-gaps/context-gap-panel.tsx`; `features/review/destinations/review-destination-state.ts`; context-gap tests |
| Evidence Gaps — create Interview question, Task, document request or comparison task | Yes | Creates real planning records linked to the current active gap/run | `create_gap_action`; `requireCurrentContextGap` enforces successful fresh run, membership, active status and kind | Persists for fixture state | New questions/tasks affect planning counts | `gap_action_created` | Does not resolve evidence; stale source is rejected; old export snapshot is invalidated without changing evidence blockers | Created QUESTION-3 from CAND-SENDER-0402; the returned real-ID link opened Interview Planner | FUNCTIONAL — BROWSER LOCAL | `features/review/context-gaps/context-gap-panel.tsx`; `lib/state/index.ts`; context-gap and planning-state tests |
| Urgent Needs | Yes | Canonical `UrgentNeed` records with source/citation links and status | `create_urgent_need`, `update_urgent_need_status` | Persists for fixture state | Active urgent-needs count and notice update | Create/status events are safe audit rows | Planning mutation stales an old export snapshot but urgent text is excluded from evidence/export | Created NEED-2; Dashboard changed from 1 to 2 active needs and survived reload | FUNCTIONAL — BROWSER LOCAL | `features/previews/planning-preview-workspaces.tsx`; `lib/state/index.ts`; planning preview/state tests |
| Urgent Needs — Open referral CTA | Yes, disabled | No direct referral/contact transition from an urgent need | No handler while disabled | N/A | N/A | No event | Prevents implied service action | Remained disabled with local/no-contact explanation | INTENTIONALLY DISABLED | `features/previews/planning-preview-workspaces.tsx`; planning preview tests |
| Interview Planner | Yes | Canonical setup and questions with status, wording, rationale, source gap and source revision links | `save_interview_setup`, `create_interview_question`, `update_interview_question`; input wording validation | Persists for fixture state; hydration synchronizes saved setup without overwriting active edits | Pending-question count derives from state | Setup/question events are canonical | Planning is excluded from evidence/export; stale source links remain visible | QUESTION-3 retained its gap link and neutral wording; reload preserved it | FUNCTIONAL — BROWSER LOCAL | `features/previews/planning-preview-workspaces.tsx`; `lib/state/index.ts`; planning preview/state tests |
| Services & Referrals — fictional directory, filters and selected provider | Yes | Static fictional provider directory; filter/selection is local preview state | No contact command; selection changes only local UI state | Selection is not persisted | No Dashboard count by explicit current design | No event for browsing | No evidence/export inclusion | Switching SERVICE-1 → SERVICE-2 reset consent and safe-contact checkboxes | FUNCTIONAL — BROWSER LOCAL | `lib/planning/index.ts`; `features/previews/planning-preview-workspaces.tsx`; provider-switch component test |
| Services & Referrals — local referral plan | Yes | Canonical `ReferralPlan`; consent and safe-contact are literal `true`; status is validated | `create_referral_plan`, `update_referral_plan_status` | Persists for fixture state | No referral Dashboard metric by explicit presentation choice | `referral_plan_saved` and status-change events | Referral/provider/consent data are excluded from the export manifest; planning mutation only stales an old snapshot | Saved REFERRAL-1 for SERVICE-2; UI confirmed no contact/no transmission and reset confirmations | FUNCTIONAL — BROWSER LOCAL | `lib/contracts/index.ts`; `lib/state/index.ts`; `features/previews/planning-preview-workspaces.tsx`; planning tests |
| Services — provider contact or transmission | Disclosure is visible; action is absent | Canonical fields are literals `not_contacted` and `not_transmitted` | No command can contact a provider or transmit a referral; cancelled plans cannot be reopened | Safe values persist | N/A | Referral planning only, never contact/transmission | Excluded from export | Production explicitly stated “No contact was made and no information was transmitted” | INTENTIONALLY DISABLED | `lib/contracts/index.ts`; `lib/state/index.ts`; planning-state tests |
| Case Tasks — create/status/counts | Yes | Canonical `CaseTask` records with owner, priority, due date, origin and status | `create_case_task`, `update_case_task_status` | Persists for fixture state | Open and overdue counts derive from task state | Create/status events are canonical | Tasks are operational only and never resolve evidence or export blockers; planning changes stale old snapshot | Created TASK-3; Dashboard task count changed from 2 to 3 and survived reload | FUNCTIONAL — BROWSER LOCAL | `features/previews/planning-preview-workspaces.tsx`; `lib/planning/index.ts`; `lib/state/index.ts`; planning tests |
| Case Tasks — Export blockers filter | Yes | No task field or selector marks export blockers | Filter branch is literally `return false` | Local filter state only | None | None | It does not inspect the Export Gate | With Export status blocked and three tasks present, selecting the filter always showed “No tasks match” | BROKEN | `features/previews/planning-preview-workspaces.tsx:1212` |
| Notes & Journal | Yes | Canonical separate `PractitionerNote`; seeded notes are bundled/fixture-reviewer, new notes are human/current-practitioner | `create_practitioner_note`, update and archive commands | Persists for fixture state; per-record edit buffer is isolated | No Dashboard note count by explicit policy | Only note lifecycle metadata becomes safe audit events; note text is not an audit summary | Notes never become evidence and are excluded from export/analysis | Created NOTE-3; it rendered as practitioner commentary and survived navigation/reload | FUNCTIONAL — BROWSER LOCAL | `features/previews/planning-preview-workspaces.tsx`; `lib/planning/index.ts`; `lib/state/index.ts`; planning/export-leak tests |
| Evidence Integrity Map | Yes | Uses all current-run canonical Nexus candidates, including withdrawn/invalidated records; edges come from canonical dependencies | Detail actions reuse `review_candidate`, reveal/citation and `withdraw_candidate` | Persists for fixture state | Review counts re-derive | Review/reveal/withdrawal events are canonical | Active/inactive dependencies remain visible; reachable changes and export consequences are canonical | Production rendered six canonical Nexus nodes, source sets, dependencies and current review/support state | FUNCTIONAL — BROWSER LOCAL | `features/review/destinations/review-destination-workspaces.tsx`; `features/review/nexus/nexus-matrix.tsx`; Nexus/withdrawal tests |
| Nexus — graph/table switch, filters, search and selected node | Yes | Read-only projections over current-run rows; deterministic layout positions are presentation only | No domain command until a detail action is chosen | UI choice is not persisted | Counts derive from canonical rows | No event for filtering/selection | No dependency mutation from view controls | Graph and accessible relationship representation loaded; selected node drove the canonical detail panel | UI ONLY | `features/review/destinations/review-destination-workspaces.tsx`; `tests/components/review/nexus/nexus-matrix.test.tsx` |
| Timeline — qualified events and detail | Yes | `selectTimeline` projects current active canonical candidates with exact, approximate, range, conflicting or unknown qualification | Source reveal and review actions reuse canonical handlers; selection itself is local | Candidate/review state persists | Review effects re-derive | Reveal/review events are canonical | Current source/dependency limits remain attached; unknown dates stay outside exact chronology | Production showed current exact and approximate events plus selected source-linked detail; other qualifications are covered by selector tests | FUNCTIONAL — BROWSER LOCAL | `features/review/timeline/timeline.tsx`; `features/review/destinations/review-destination-workspaces.tsx`; timeline/review tests |
| Timeline — category/conflict/review filters and selected event | Yes | Read-only projections over the canonical timeline | No domain command for filtering/selection | UI state is not persisted | None | None | None until a source/review action | Filters and selection changed only the visible projection/detail | UI ONLY | `features/review/timeline/timeline.tsx`; `tests/components/review/timeline/timeline.test.tsx` |
| Export Gate — readiness, manifest, previews and downloads | Yes | One canonical `ExportGateEvaluation` and one `ExportManifest`; semantic/JSON/PDF render from that manifest | `evaluate_export_gate`, `create_export`; local PDF/JSON download helpers | Gate/manifest persist for fixture state while current; stale mutations revoke/currently invalidate them | Dashboard export badge derives from gate | `export_blocked`, readiness/create events | Fails closed on freshness, review, citations, coverage, masking, privacy, purpose, dependency and minimum-necessary conditions | Evaluation produced one critical human-review blocker; planning markers/provider/referral data were absent from Export UI | FUNCTIONAL — BROWSER LOCAL | `features/export/*`; `lib/export/core/index.ts`; export workspace/core/renderer/planning leak tests |
| Export — header Create handoff and handoff-option cards | Yes | Cards reflect Purpose selection; header button has no handler and is always disabled | Real creation is the separate **Create reviewed handoff** action shown only after a ready gate | Local presentation only | None | None | Hidden link points back to Purpose; cards do not change selection | Blocked-state duplicate button remained disabled as designed; options were presentation rather than controls | UI ONLY | `features/export/export-workspace.tsx` |
| Audit Trail — event rows | Yes | Projects the real canonical `state.audit` array; safe summaries omit raw sensitive content | Central command `commit` appends policy-required events | Persists for fixture state; explicitly non-forensic and non-tamper-evident | N/A | This is the canonical browser-session audit projection | Shows export/review/dependency/planning event metadata only | Production showed 8 live events including review, gap, urgent need, referral, task, note and export block | FUNCTIONAL — BROWSER LOCAL | `features/trust/audit-workspace.tsx`; `lib/state/index.ts`; audit workspace/report and state tests |
| Audit — filters and search | Yes | Read-only projection over `state.audit` | No domain command | UI state is not persisted | None | No event for filtering | None | Actor, type and text filters were available over current rows | UI ONLY | `features/trust/audit-workspace.tsx`; `tests/components/trust/audit-workspace.test.tsx` |
| Trust & Safety — System Card, Safety Lab, Evaluation, Guidance and AI boundaries | Yes | Server-derived policy, provider admission, deterministic evaluation and static guidance records | Tabs are presentation; system data is built server-side from the same registry/policy | Static/server-derived; case Audit tab uses session state | N/A | Audit tab projects canonical events | Truthfully reports disabled live analysis and provider-transmission boundary | Production showed all live providers unavailable and prepared replay selectable | FULLY FUNCTIONAL | `features/trust/trust-data.server.ts`; `features/trust/lovable-trust-workspace.tsx`; trust/provider/evaluation tests |
| Trust & Safety — unsafe-output report | Yes | Canonical safe category plus affected entity ID | `report_unsafe_output` | Persists for fixture state | No Dashboard count | Creates a local safe audit event | No source text, provider transmission or export content | Source and focused tests verify local-only event and visible “Nothing was transmitted” result | FUNCTIONAL — BROWSER LOCAL | `features/trust/unsafe-output-report.tsx`; `lib/state/index.ts`; trust report tests |
| Trust & Safety — supported-document limitation copy | Yes | Server trust card claims “bundled text PDFs only; no OCR or arbitrary upload” | No control | Static | N/A | N/A | N/A | Production displayed the claim, contradicting the implemented arbitrary embedded-text PDF path | BROKEN | `features/trust/trust-data.server.ts:65`; `lib/documents/pdf-source-service.ts:816`; Documents tests |
| Reset demonstration | Yes | Reconstructs the bundled initial case and seeded planning fixture | Central `reset_case`; helper cleanup removes storage/object URLs/workers/caches where used | Reset state is written to session storage | Counts return to fixture defaults | Exactly one safe reset event in the new state | Clears runs/reviews/exports and restores initial fixture state | Returned to Purpose with 0 documents; Dashboard returned to 1 urgent need, 2 tasks and 0 pending review | FUNCTIONAL — BROWSER LOCAL | `components/shell/case-shell.tsx`; `lib/state/index.ts`; shell/state/planning tests |
| `/case/demo/review` compatibility route | Yes | Uses the same current candidates, reviews, citations, gaps and dependencies | Same canonical review, gap, reveal and withdrawal actions | Same session state | Same derived consequences | Same audit consequences | Same export/dependency consequences | Direct production route loaded current review state and actions without error | FUNCTIONAL — BROWSER LOCAL | `app/case/demo/review/page.tsx`; `features/review/candidate/review-workspace.tsx`; route/review tests |
| Production auth, durable case database, multi-case CRUD, server file store and cross-device sync | No | No such models/services are implemented | No APIs or commands for these capabilities | `sessionStorage` only; one synthetic case | Two secondary cards are read-only | Browser-session explanatory audit only | Exports are generated/downloaded locally | Reload in the same tab preserved state; reset restored fixture; no account or durable server store exists | NOT APPLICABLE | `components/shell/case-state-context.tsx`; `lib/state/index.ts`; repository-wide source inspection |

## Exact status counts

| Status | Count |
|---|---:|
| FULLY FUNCTIONAL | 2 |
| FUNCTIONAL — BROWSER LOCAL | 23 |
| PARTIAL | 1 |
| UI ONLY | 5 |
| INTENTIONALLY DISABLED | 6 |
| BROKEN | 2 |
| NOT APPLICABLE | 1 |
| **Total classified rows** | **40** |

## Answers to the special questions

1. **Does Purpose unlock Documents and downstream stages correctly?**
   Yes, with an important distinction: Documents is not route-locked. A user can inspect/add local sources before Purpose, but bundled preparation and all analysis paths remain blocked until `deriveAnalysisPrerequisites` sees a complete Purpose and the other required source/masking/coverage conditions. Purpose or other analysis-input revisions make a successful run stale.

2. **Can document preparation and PDF/source-health flows genuinely run?**
   Yes. The bundled fixture validates known PDFs and the arbitrary path performs browser-local PDF.js embedded-text extraction into canonical document/page/segment records. Errors are visible. There is no OCR; image-only pages fail visibly.

3. **Does Structured Analysis start or load a real deterministic replay or model result?**
   It starts/loads a real canonical deterministic replay for the bundled fixture or a deterministic local extraction result for arbitrary text PDFs. It does **not** run a live model in production.

4. **Are review decisions canonical and consequential?**
   Yes. `review_candidate` revises the candidate, writes a `ReviewDecision`, appends an Audit event, changes Dashboard review counts, and affects readiness/export.

5. **Do withdrawn or edited candidates recalculate dependencies?**
   Yes. Edits revise the candidate and stale export state. Withdrawal invalidates the target and recalculates only reachable dependants, records dependency changes, revokes a current export, and preserves unrelated decisions.

6. **Do Evidence Gap actions create real Interview questions, Tasks or document requests?**
   Yes. `create_gap_action` creates a canonical linked planning record and returns the real created ID. The production-created QUESTION-3 link opened Interview Planner. Actions are rejected when the analysis source is stale.

7. **Do Urgent Needs update Dashboard counts and status?**
   Yes. Production changed the active count from 1 to 2 and displayed the immediate-attention notice. The result survived reload.

8. **Do Interview questions save, edit and retain source/gap links?**
   Yes. Setup/questions are canonical, persisted for the fixture, validated, independently buffered per record, and retain gap/source revision references.

9. **Do referral plans require consent and safe-contact acknowledgement?**
   Yes. The command contract requires literal `true` values. The reducer also refuses promotion to manual follow-up without both confirmations.

10. **Can referrals ever falsely imply provider contact or transmission?**
    No implemented command can contact or transmit. Canonical fields are fixed to `not_contacted` and `not_transmitted`, confirmations reset on provider change/save, and cancelled plans cannot be silently reopened.

11. **Do Tasks update open and overdue counts?**
    Yes. Status/due-date selectors derive those counts. Production task creation changed the Dashboard task count. The separate **Export blockers** filter is broken because it always returns no rows.

12. **Are Notes stored separately from evidence and excluded from export as intended?**
    Yes. They are canonical planning commentary, not candidates/evidence. Note content is excluded from export and safe Audit summaries. Seeded and current-practitioner provenance are distinguished.

13. **Does the Nexus use current canonical records rather than a fixed graph?**
    Yes for the current fresh run. Labels, support/review state, nodes and relationships come from current canonical Nexus candidates/dependencies, including inactive records. The layout is deterministic and the bundled Nexus contract expects its six required fixture records; an arbitrary run without Nexus candidates shows an honest empty state rather than fixture nodes.

14. **Does Timeline use current qualified canonical events?**
    Yes. It projects current active canonical candidates and preserves exact, approximate, range, conflicting and unknown qualifications. Production’s prepared checkpoint visibly contained exact and approximate events; focused tests cover the other qualification branches.

15. **Does Export fail closed and use one canonical manifest?**
    Yes. The gate recomputes blockers from current state and exact selection. Export creation requires a current ready gate. Semantic, JSON and PDF projections use the same schema-validated manifest. The production gate blocked on incomplete review and offered no bypass.

16. **Does Audit show real events rather than fixture-only rows?**
    Yes. Production displayed newly created practitioner events alongside the fixture analysis event. It is explicitly an explanatory browser-session log, not a forensic or tamper-evident audit system.

17. **Does reset clear all added planning records and restore the fixture consistently?**
    Yes. Production reset removed the added question, need, referral, task and note, returned to Purpose with 0 documents, and restored fixture Dashboard counts (1 urgent need, 2 tasks, 0 pending review).

18. **Is there real server/database persistence?**
    No. Canonical state is stored in same-tab `sessionStorage`. It survives navigation and reload in that browser session. There is no database, account store, server case store, cross-device sync or durable audit backend. Browser-local arbitrary-PDF state is intentionally not persisted.

19. **Is any live AI provider enabled and admitted?**
    No. OpenAI, Gemini and Mistral adapters/registry entries exist, but their static admissions are `not_evaluated`; production policy disables live analysis. The judge path uses prepared deterministic replay with zero provider transmission.

20. **Which visible controls are demo-only, disabled or no-op?**
    - Demo-only but functional locally: checkpoint load, planning records, referral plan, local report, downloads and all canonical M. Chen mutations.
    - Intentionally disabled: New case, secondary workspaces, OCR, live AI, urgent-needs referral CTA, provider contact/transmission.
    - UI-only: analysis/Nexus/Timeline/Audit filters and selections; Export handoff cards and duplicate header CTA.
    - Partial: document Add/Retry/Replace row controls navigate to generic real controls rather than performing a row-specific mutation.
    - Broken/misleading: Tasks **Export blockers** filter; Trust’s “no arbitrary upload” claim.

## Production browser journey result

The requested journey passed end to end with the two non-blocking truthfulness issues noted above:

1. Landing → Dashboard → M. Chen → Purpose worked.
2. Documents before Purpose displayed a real prerequisite block.
3. The prepared checkpoint loaded 7 documents, 14 canonical candidates and the review workspace.
4. A canonical candidate decision was recorded and appeared in Audit.
5. A gap action created real QUESTION-3; its link opened Interview Planner.
6. A synthetic urgent need updated Dashboard from 1 to 2 active needs.
7. Switching fictional providers cleared consent/safe-contact confirmations.
8. Saving a referral plan recorded `not_contacted`/`not_transmitted` and reset confirmations.
9. Creating TASK-3 and NOTE-3 updated canonical state; the task count changed from 2 to 3.
10. The Nexus and Timeline rendered current canonical review/source/dependency state.
11. Export failed closed on one critical incomplete-review blocker. Synthetic urgent, task, note and referral/provider markers did not appear in Export Gate content.
12. Audit showed 8 real current-session events.
13. Reload preserved the checkpoint and changed counts.
14. The compatibility `/case/demo/review` route loaded current canonical review actions.
15. Reset returned to Purpose, removed the added records and restored the bundled Dashboard fixture.

## P0 demo blockers

**None found for the bundled M. Chen judge journey.**

The judge path, consequential review/planning actions, reload behavior, fail-closed export, Audit projection and reset all worked in production.

## P1 important gaps

1. **Fix or remove the Tasks “Export blockers” filter.** It is an advertised filter whose implementation always returns `false`.
2. **Correct Trust & Safety document-capability copy.** It must distinguish supported browser-local embedded-text PDFs from unsupported OCR/image-only PDFs.
3. **Clarify document row action labels or make them row-specific.** Add/Retry/Replace currently move the user to generic real controls rather than directly acting on the selected record.
4. **Treat browser-session persistence as an explicit demo limitation in every handoff.** Reload works, but closing the tab/session loses the case and there is no recovery from another device.

## P2 post-hackathon improvements

- Add authenticated users, authorization, real case creation and durable encrypted server persistence.
- Add a production-grade audit store with integrity, retention and access controls.
- Add secure document storage, chain-of-custody/provenance handling, malware scanning and deletion policy.
- Add OCR only after accuracy, language, privacy and failure-state evaluation.
- Add multi-case search, assignment, collaboration, backup, recovery and cross-device synchronization.
- Admit a live AI provider only after the existing evaluation/admission gates pass and the data-handling policy is approved.
- Add observability, incident response, rate limiting, production privacy review and legal/security assurance.
- Add durable export delivery controls only if the product later permits transmission.

## Traditional backend capabilities that do not exist

- User authentication, roles, organizations or access control.
- A case database or server-side canonical state store.
- Durable file/blob storage or cross-device document access.
- Multi-case CRUD behind the two read-only Dashboard summaries.
- Server-side task/referral/note workflow orchestration.
- Provider directory verification, availability lookup, referral contact, email or transmission.
- Durable/tamper-evident audit logging.
- Background jobs, queues, OCR services or scheduled reminders.
- Server-side export repository, delivery tracking or recipient portal.
- Backup, recovery, retention, deletion or legal-hold workflows.

The only relevant server endpoint is the guarded analysis availability/POST route. With live analysis disabled, it does not provide a traditional case backend or a live model result.

## Real AI capabilities

### Present

- Deterministic replay of a versioned bundled synthetic analysis fixture.
- Deterministic local extraction candidates for browser-local embedded-text PDFs.
- Provider adapters, registry, release identities, static admission contracts and evaluation harnesses in source.
- Canonical AI provenance labels, human-review requirements, source citations, limitations and dependency tracking.

### Not present or not enabled

- No admitted live OpenAI, Gemini or Mistral analysis in production.
- No production source transmission to an AI provider.
- No OCR, speech, image, multilingual or child-case model capability.
- No autonomous legal conclusion, trafficking determination, credibility assessment, guilt decision or export bypass.
- No model fine-tuning, retrieval database, vector store, agent workflow or long-running inference service.

## Smallest fast implementation plan for a reliable judge journey

The current judge journey is already operable, so the smallest safe pass is a truthfulness and regression-hardening slice:

1. Replace/remove the hard-coded Tasks **Export blockers** filter, or derive it from a real canonical task-to-blocker field if such a product requirement is approved.
2. Update Trust & Safety to say that browser-local embedded-text PDFs are supported while scanned/image-only PDFs require unavailable OCR.
3. Rename or clarify document row actions unless row-specific retry/replace behavior is implemented.
4. Add/adjust only the focused assertions for those three visible behaviors.
5. Run the focused Tasks, Trust and Documents tests, typecheck, one build and a short production judge rehearsal ending in reset.

No database, live AI, OCR, authentication or deployment redesign is required to make the current bundled judge journey reliable.

## Repository status after audit

Exact `git status --short --branch`:

```text
## main...origin/main
?? docs/FUNCTIONAL_AUDIT.md
```

Only this audit document was added. No application, test, configuration, dependency, deployment or production-setting file was changed.
