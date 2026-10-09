# Check Republic — Product Backlog & GitHub Issue Reference

**La Salle Computer Society / Technology Division**  
**AY 2026–2027 Term 1**

## Project information

| Product Manager | Renzel | Tech Lead | Jeremy Leano |
| --- | --- | --- | --- |
| Repositories | checkrepublic-api / checkrepublic-web | Working Model | PM = WHAT/WHY • TL = HOW/ARCHITECTURE |


| Sprint 1 Window | Oct 12–27, 2026 | Sprint 2 Window | Oct 28–Nov 12, 2026* |
| --- | --- | --- | --- |


**Purpose:** PM/TL working reference for two-sprint MVP delivery. Scope: standard single-day synchronous CSO activities; product outcomes here and implementation details in GitHub domain issues. Pending rule approvals never become fabricated compliance results.


## Product Scope

| Phase | Focus | Outcome |
| --- | --- | --- |
| Phase 1 — Core MVP | Document Auditing & Verification | Pre-submission review of standard single-day synchronous CSO activities. Pre-Acts: A-Form + PPR. Post-Acts: AR + approved Pre-Acts + GALS/LOP when applicable; conditional financial, publicity, evaluation and MOA evidence. |
| Phase 2 — Fast Follow | Document and Form Automation | Document builder and standardize them for LSCS and CSO processes. Build documents → Validate documents → Submit to DocuLogi. |


## Two-Sprint Timeline

| Date / Window | Duration | Focus | Expected Output |
| --- | --- | --- | --- |
| Oct 12–15 | 4 days | Sprint 1: foundations, UX and secure uploads | DLSU Google sign-in and sessions; secure multi-file packages; CI/staging and initial document workflow. |
| Oct 16–21 | 6 days | Sprint 1: standard Pre-Acts checking | Extract A-Form/PPR, select approved rules, check required fields and cross-document consistency; draft findings and source links. |
| Oct 22–27 | 6 days | Sprint 1: integration and acceptance | Run Audit lifecycle; basic findings and section-level locations; recovery/security tests; staging Pre-Acts demo and PM review. |
| Oct 28–Nov 1 | 5 days | Sprint 2: standard Post-Acts checking | AR with approved Pre-Acts references; synchronous GALS and LOP checks; bounded conditional evidence handling. |
| Nov 2–7 | 6 days | Sprint 2: evidence-based document inspector | Precise highlights where reliable; hover/focus/tap mini-preview, actionable corrections, source anchors; snapshot re-audit and limited MOA. |
| Nov 8–12 | 5 days | Sprint 2: QA, hardening and MVP review | Approved-rule fixtures, access isolation, parser failures, cross-browser design QA, recovery tests, staging sign-off. |


**Timeline note:** Sprint 1 (Oct 12–27) and tentative Sprint 2 (Oct 28–Nov 12) are proposed planning windows. Product Design, Frontend, Backend, QA and DevSecOps work concurrently. TL confirms capacity and Sprint 2 dates before commitment.


## Sprint 1–2 — Core Auditing MVP

### CR-US-01
**Status:** S1 · P0 — Ready for breakdown

**User story:** As a project lead or auditor, I want one private audit package per event with its related documents so they can be evaluated together.

**Product acceptance criteria**

- One audit package has a required Project/Event Name and system-generated ID/owner; no unnecessary duplicate form.
- Multiple .pdf/.docx/.xlsx documents supported, 25 MB each; drag-drop or file-picker upload.
- Users can see, remove, and replace files; invalid uploads do not remove valid attachments.
- Package ownership is enforced for file access and results; unrelated projects are not cross-checked.
- Recognized document type is shown; ambiguous/unreadable types require confirmation or review.
- Changes after a completed audit mark prior findings outdated.

**Issues / Features**

- [DESIGN] Audit package preparation and multi-file upload states
- [FRONTEND] Multi-file audit package preparation interface
- [BACKEND] Secure document ingestion, package association, and validation
- [DEVSECOPS] Staging upload/storage, secrets, and runtime controls


### CR-US-02
**Status:** S1 · P0 — Rule validation pending

**User story:** As an officer preparing standard Pre-Acts, I want A-Form and PPR checks so I can fix supported errors before DocuLogi review.

**Product acceptance criteria**

- Recognize A-Form and PPR for a single-day synchronous standard CSO activity; flag missing required documents.
- Extract and compare reliably readable event title, date, venue, modality and participant estimates.
- Apply only approved structure, required-field and signatory-block checks; block existence does not verify a genuine signature.
- Every finding shows the source document/section, reason, suggested correction and registered manual citation.
- Unclear parsing, older dates/signatories and conflicting requirements become Needs Manual Review or Not Evaluated, never an invented failure.
- Keep the rule version and the scope that triggered it with each finding.

**Issues / Features**

- [BACKEND] Document structure parser
- [BACKEND] Pre-Acts rules engine and tests
- [DESIGN] Compliance finding presentation


### CR-US-03
**Status:** S2 · P1 — Conditional/rule gated

**User story:** As a project lead with a documented Tie-Up, I want required MOA evidence and partner information checked against my documents.

**Product acceptance criteria**

- Only evaluate MOA requirements when confirmed applicability indicates a tie-up; otherwise show Not Applicable.
- Detect missing required MOA files for declared partners within the same audit package.
- Compare extractable partner names, display both affected documents; uncertain aliases require manual review.
- Do not claim that a signature is genuine, an agreement is legally valid, or MTS approval exists.
- Each source-backed finding provides the approved requirement and a concrete next action.

**Issues / Features**

- [DESIGN] Tie-Up ↔ MOA mismatch and cross-document comparison states
- [BACKEND] Tie-Up ↔ MOA consistency validation
- [FRONTEND] Cross-document mismatch findings


### CR-US-04
**Status:** S1 foundation · S2 full inspector

**User story:** As a document reviewer, I want highlighted issues with hover previews and citations so I can quickly see what is wrong and how to fix it.

**Product acceptance criteria**

- [S1] Display results grouped as Blocking, Warning and Info, with separate Not Evaluated / Needs Manual Review statuses.
- [S1] Each finding includes a reason, suggested correction, location where available, rule ID and real source/version.
- [S1] Provide the affected document/section and verified manual reference; never imply official DocuLogi approval.
- [S2] Highlight the exact source span only when positions are reliable; otherwise use an explicit section/field fallback.
- [S2] Hovering the highlight opens a nearby mini-preview: problem, why, suggested fix, cited manual/section, Open Reference.
- [S2] Click/tap/keyboard focus also opens the same preview and findings remain accessible without hover.

**Issues / Features**

- [DESIGN] Audit Results Inspector
- [FRONTEND] Findings dashboard / detail view
- [BACKEND] Structured audit findings response
- [DEVSECOPS] Staging deployment and critical-path smoke verification


**CR-US-04 additional acceptance criterion (S2):** Link to the exact source page/sheet when stable; do not invent anchors or bypass source permissions.


### CR-US-05
**Status:** S1 · P0 — Ready for breakdown

**User story:** As a DLSU user, I want institutional Google sign-in so that only eligible accounts can enter Check Republic.

**Product acceptance criteria**

- Google sign-in has loading, success, error, cancellation and access-denied states.
- Backend validates the Google identity and institutional hosted-domain/eligibility policy; email text alone is insufficient.
- Only eligible verified @dlsu.edu.ph users establish sessions; others receive clear access-denied feedback.
- OAuth secrets and allowed callbacks are environment-managed, never exposed in source or browser.

**Issues / Features**

- [DESIGN] Sign-in, loading, and access-denied states
- [FRONTEND] Google sign-in flow and protected-route handling
- [BACKEND] Verify Google identity, enforce DLSU domain, and create session
- [DEVSECOPS] OAuth client configuration, callback/origin settings, and secrets


### CR-US-06
**Status:** S1 · P0 — Ready for breakdown

**User story:** As an authenticated user, I want valid sessions and secure sign-out to protect my account and private documents.

**Product acceptance criteria**

- A valid session persists through normal navigation and refresh until server-enforced expiry.
- Sign-out invalidates the session; expired or revoked sessions require sign-in again.
- Protected application routes and every package, file and audit API enforce server-side identity and ownership.
- Invalid/unauthorized access never reveals another user's documents or results.

**Issues / Features**

- [DESIGN] Account and sign-out interaction states
- [FRONTEND] Session-aware UI, route guards, and sign-out
- [BACKEND] Session lifecycle, expiry, sign-out, and tests


### CR-US-07
**Status:** S1 execution · S2 re-audit

**User story:** As an officer, I want to manually run and rerun Pre-Acts or Post-Acts checks so results correspond to known file versions.

**Product acceptance criteria**

- [S1] File upload/replacement never automatically starts an audit.
- [S1] Run Audit requires at least one valid document and a selected audit type; missing required files can be reported as findings.
- [S1] Audit runs use a fixed file and approved-rule snapshot; show queued/processing/success/error states and prevent duplicate starts.
- [S1] Failures preserve the package; retry works without re-upload and identifies a failing file when possible.
- [S2] Replacing files marks previous results outdated; a new audit creates a separate immutable run.
- [S2] Users can identify the current run versus historical results and see that older findings are stale.

**Issues / Features**

- [DESIGN] Run Audit, audit-type selection, processing, failure/retry, and stale-results states
- [FRONTEND] Audit trigger and processing/result-state handling
- [BACKEND] Audit execution lifecycle, package snapshot, and failure handling


### CR-US-08
**Status:** S2 · P0 — Rule validation pending

**User story:** As an officer preparing standard Post-Acts, I want AR, approved Pre-Acts, GALS and LOP checked where applicable before submission.

**Product acceptance criteria**

- Recognize AR and approved A-Form/PPR reference files; missing references prevent unsupported comparisons.
- Compare AR activity details to approved A-Form/applicable SAS and objectives to the approved PPR when extractable.
- For the synchronous pilot, verify GALS required fields, duplicates, ANP/ANMP totals using an approved counting policy.
- Verify LOP presence, detectable picture count and caption evidence; image subject/content may require human review.
- Financial LOE/NE/FRS, approved publicity, evaluations and MOA are conditional status/presence checks only when rules apply.
- Never claim external approval, signature validity, or external-system submission without verifiable evidence.
- Unreadable attachments or incomplete approval context are marked Not Evaluated / Needs Manual Review, not Pass.

**Issues / Features**

- [DESIGN] Pre-/Post-Acts audit-type and finding states
- [FRONTEND] Post-Acts audit-mode and findings integration
- [BACKEND] Post-Acts rules engine and tests


**Story readiness note:** Retain CR-US-01–08 as parent IDs; split child GitHub issues by Sprint 1/2. For compliance rules, newest approved applicable sources take priority; older compatible rules can fill gaps. Draft 52nd guides remain provisional. Severity, signatories, rule conflicts and test fixtures require DocuLogi review before activating blocking findings.


## Product Design Workstream — Sprints 1 & 2

| Issue / Feature | Target Window | Outcome | Review |
| --- | --- | --- | --- |
| [DESIGN] Map Sprint 1 user journey, information architecture, and navigation | S1 early | Define one coherent path from DLSU sign-in → prepare audit package → select Pre-Acts or Post-Acts → Run Audit → processing → findings → correction / next action. | PM + Tech Lead |
| [DESIGN] Create low-fidelity wireframes for the Sprint 1 critical path | S1 early | Cover authentication, multi-file package preparation, Pre-/Post-Acts selection, Run Audit/processing/failure, findings/results, Tie-Up ↔ MOA mismatch handling, and account/sign-out states. | PM |
| [DESIGN] Establish Check Republic UI foundation and reusable components | S1 early–mid | Define typography, spacing, buttons, inputs, cards, statuses, findings, alerts, dialogs, and LSCS-aligned visual patterns for consistent implementation. | PM + Frontend |
| [DESIGN] Produce responsive high-fidelity mockups and interactive prototype | S1 mid / S2 inspector | Deliver responsive hi-fi for Sprint 1 package/audit journey and Sprint 2 inline highlights, anchored hover/focus/tap mini-previews and manual citations. | PM + Frontend |
| [DESIGN] Define accessibility, responsive behavior, and interaction-state coverage | S1–S2 | Specify mobile/desktop, keyboard and screen reader alternatives, plus empty/loading/error/success/manual-review and stale-results states. | PM + Frontend |
| [DESIGN] Validate implemented UI on staging and document design discrepancies | S2 close | Verify implemented Pre-/Post-Acts flows, inspector, and accessible interaction states on staging against approved design. | Product Design + PM |


**Design review note:** Product Design owns responsive UX and annotation prototypes; PM validates requirements and product acceptance; TL/Frontend verify implementation feasibility. Hover-only feedback is insufficient: click, touch and keyboard access are required.


## Technical Enablers

Engineering work required for user stories, not separate product user stories.


| Area | Status | Outcome | Primary Domain |
| --- | --- | --- | --- |
| Repository & CI Baseline | Ready for Breakdown | Repository protections and CI baseline for both repositories. | [DEVSECOPS] |
| Backend Baseline | Ready for Breakdown | Application baseline, configuration, health checks, error contract, and test setup. | [BACKEND] |
| Frontend Baseline | Ready for Breakdown | Frontend application shell, shared UI foundation, and async-state handling. | [FRONTEND] |
| Authentication & Session Baseline | Ready for Breakdown | DLSU-only Google authentication, session handling, and protected application access. | [BACKEND] + [FRONTEND] + [DEVSECOPS] |
| Staging & Secrets | Ready for Breakdown | Dokploy staging, secrets, and upload/runtime controls. | [DEVSECOPS] |


## DevSecOps Workstream — Sprints 1 & 2

| Issue / Feature | Target Window | Outcome | Review |
| --- | --- | --- | --- |
| [DEVSECOPS] Classify Check Republic project risk tier and define Sprint 1 release gates | Oct 12 | Set the minimum CI, security, staging, and release evidence required for the project. | Senior DevSecOps |
| [DEVSECOPS] Configure repository protections and CI baseline for API and web | Oct 12–14 | Protected PR workflow and required automated checks are in place for both repositories. | Senior DevSecOps |
| [DEVSECOPS] Provision Dokploy staging, secrets, and upload/runtime controls | Oct 12–15 | Staging is ready for integration with safe environment/secret handling and upload-related runtime controls. | Senior DevSecOps |
| [DEVSECOPS] Configure Google OAuth client, approved origins/callbacks, and authentication secrets | Oct 12–15 | OAuth settings support the DLSU-only authentication flow across local and staging environments without exposing secrets. | Senior DevSecOps |
| [DEVSECOPS] Verify critical path in staging and document release evidence / recovery notes | Nov 8–12 | Verify complete Pre-/Post-Acts paths on staging; record security, negative-case, release and recovery evidence for PM/TL review. | Senior DevSecOps |


**Workstream note:** Security is cross-cutting in both sprints. Maintain private storage, protected CI, safe document processing, package access isolation and staging recovery.


**Review note:** Senior DevSecOps reviews DevSecOps changes; TL reviews Frontend/Backend implementation; PM accepts product outcomes. No audit outcome is official DocuLogi approval.


## Open Product Items

| Item | Status | Next Step |
| --- | --- | --- |
| DocuLogi source authority & rules | Pending source sign-off | Use newest approved applicable guide/checklist; fill gaps with compatible previous rules. WIP/conflicts stay manual until DocuLogi confirms source, severity and applicability. |
| Valid/invalid test fixtures & release gate | Pending PM/TL/DocuLogi | Create redacted A-Form/PPR/AR/GALS/LOP examples: pass/fail/not-applicable per active rule; verify findings, authorization, failure recovery, citations and annotations before release. |
| Future scope / notifications | Backlog — out of MVP | Official submission and completion notifications, document builder, Logistics Permit Helper, off-campus and complex event rules require separate PM/TL prioritization. |


## GitHub Issue Rule

Use: `[DOMAIN]` Outcome-oriented title • Link parent `CR-US-XX` • Define “Complete When” • Identify owner/domain • List dependencies/risks • Assign Sprint 1 or Sprint 2.
