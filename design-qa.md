# Structured Analysis Lovable UX design QA

- Source visual truth:
  `/private/tmp/contextfirst-lovable-comparisons-20260724/compare-analysis.png`
  and the user-supplied Structured Analysis screenshots from 2026-07-26.
- Rendered implementation:
  `http://localhost:3000/case/CFN-CASE-52FBBC00C0224432AFF0421008329334/analysis`
- Requested comparison viewport: 1440 × 900 CSS pixels at density 1.
- Browser-rendered inspection viewport: 1117 × 837 CSS pixels. The Codex
  in-app host retained its own surrounding panel despite the requested viewport
  override.
- State: seven synthetic browser-local PDFs, privacy checks approved,
  deterministic local analysis completed, Lane A selected, first candidate
  selected.

## Full-view comparison evidence

The approved Lovable reference uses a compact Stage 3 header, a single-row lane
selector, a single-row filter toolbar, and a stable candidate-list/detail
master-detail frame. The implementation now retains those regions and keeps the
review frame bounded rather than allowing candidate details to lengthen the
entire page.

Live browser measurements after the correction:

- candidate list: 360 × 500 CSS pixels;
- candidate detail: 453 × 500 CSS pixels at the available host width;
- source overlay: 520 × 805 CSS pixels;
- edit-review dialog: 576 × 334 CSS pixels.

Opening the source overlay left the candidate detail width unchanged at 453 CSS
pixels. Long source text now scrolls inside the overlay. Candidate rows and
candidate details scroll inside their respective panes.

## Focused interaction evidence

- Opened an exact source and confirmed it appears as a modal overlay without
  reducing the workspace tracks.
- Opened Edit wording and confirmed the canonical reasoned-action form appears
  as a compact dialog.
- Accepted one synthetic local candidate and opened withdrawal confirmation.
  The confirmation is outside the hidden background subtree and does not append
  a permanent dependency panel below the workspace.
- Closed source, edit, and withdrawal presentations without changing their
  canonical command paths.
- Browser console contained only the known Next.js development-mode CSP
  `eval()` warning and hot-reload messages; no production route or component
  exception was observed.

## Required fidelity surfaces

- Fonts and typography: existing Lovable serif, sans, and mono tokens are
  unchanged. Candidate title size and spacing were reduced to the compact
  reference hierarchy.
- Spacing and layout rhythm: list/detail tracks now share one bounded height;
  candidate detail padding is compact; source, edit, and withdrawal content no
  longer creates long page-level scroll.
- Colors and visual tokens: existing primary, muted, border, danger, warning,
  radius, and shadow tokens are reused without introducing a second visual
  system.
- Image quality and asset fidelity: this screen contains no reference imagery
  or replaced image asset. Existing Lucide icons are unchanged.
- Copy and content: canonical candidate text, citations, limitations,
  provenance, status labels, and safety wording remain state-derived and may
  truthfully differ from the Lovable fixture.

## Comparison history

1. Earlier P1: opening exact source reduced the detail panel to a narrow column
   and forced long source content into the page.
   Fix: changed Structured Analysis source access to a 520-pixel overlay with
   internal scrolling. Post-fix browser measurement confirmed the workspace
   width remains stable.
2. Earlier P1: Edit wording expanded inline and pushed actions and status
   feedback down the page.
   Fix: added a compact, keyboard-contained dialog presentation while preserving
   the canonical `review_candidate` command.
3. Earlier P1: withdrawal confirmation and dependency content appeared below
   the workspace after substantial scrolling.
   Fix: added a focused modal withdrawal presentation and kept the historical
   dependency panel behavior unchanged on other review screens.
4. Earlier P2: candidate list and detail had unconstrained page height.
   Fix: added equal-height independently scrollable desktop panes while
   preserving mobile stacking.

## Findings

- [P2] Same-viewport screenshot comparison is still unavailable.
  Location: final visual evidence capture.
  Evidence: the in-app browser rendered and exposed live DOM measurements, but
  its screenshot command is unavailable and its host viewport remained
  1117 × 837 instead of the requested 1440 × 900. A post-fix implementation
  image could therefore not be combined with the Lovable reference.
  Impact: the layout and interaction corrections are browser-verified, but
  pixel-level 1440 × 900 parity cannot be honestly certified from a same-state
  side-by-side image.
  Fix: capture the refreshed route at 1440 × 900 in Chrome and compare it
  side-by-side with the Lovable reference before declaring exact visual parity.

## Historical note

The earlier Documents density QA passed using a same-state 1440 × 900 capture at
`/private/tmp/contextfirst-documents-density-side-by-side-final.png`. That result
is unchanged by this Structured Analysis-only correction.

final result: blocked
