# Check Republic
## Product Backlog & GitHub Issue Reference | AY 2026–2027 Term 1
**La Salle Computer Society — Technology Division (41st LSCS)**

---

### Project Overview

| Attribute | Details |
| :--- | :--- |
| **Product Manager** | Renzel |
| **Tech Lead** | Jeremy Leano |
| **Repositories** | `checkrepublic-api` / `checkrepublic-web` |
| **Working Model** | PM = WHAT / WHY &nbsp;\|&nbsp; TL = HOW / ARCHITECTURE |
| **Sprint 1 Window** | Oct 7–21, 2026 |
| **Duration** | 15 calendar days |

> **Purpose:** Use this as the PM/TL working reference for refining Product User Stories into clear GitHub issues. Keep product outcomes here; implementation details belong in the domain issues.

---

## 1. Product Scope

| Phase | Focus | Outcome |
| :--- | :--- | :--- |
| **Phase 1 — Core MVP** | Document Auditing & Verification | Catch common Pre-Acts / Post-Acts compliance issues before official submission. |
| **Phase 2 — Fast Follow** | Document and Form Automation | Document builder and standardization for LSCS and CSO processes.<br>*(Build documents → Validate documents → Submit to DocuLogi)* |

---

## 2. Sprint 1 Timeline

| Date / Window | Duration | Focus | Expected Output |
| :--- | :--- | :--- | :--- |
| **Oct 7** | 1 day | Kickoff + delivery baseline | PM/TL stories refined; Sprint 1 user journey mapped; project risk tier and release gates confirmed; repositories ready for Sprint 1. |
| **Oct 7–10** | 4 days | Foundation + UX flow + authentication + secure upload | User journey and low-fidelity flows defined; CI/protections, DLSU-only Google sign-in, staging/secrets, and the first multi-file audit-package flow ready for integration. |
| **Oct 9–16** | 8 days | Pre-/Post-Acts rules + responsive hi-fi / prototype | Validated Pre-Acts and Post-Acts document, section, and signatory checks running against representative audit packages; responsive high-fidelity designs and the critical-path prototype are ready for handoff. |
| **Oct 12–17** | 6 days | Tie-Up / MOA consistency | Cross-document partner validation integrated and reviewed against confirmed DocuLogi rules. |
| **Oct 15–20** | 6 days | Run Audit + results + integration + design QA | Run Audit processing/failure/retry states, findings UI, and backend responses are integrated; responsive behavior and Empty/Loading/Error/Success states are validated against approved designs. |
| **Oct 18–21** | 4 days | Staging validation + sprint review | Critical-path smoke verification, Product Design staging validation, fixes, PM acceptance, and unresolved work moved to the backlog. |

> **Timeline Note:** Work windows intentionally overlap so Design, Frontend, Backend, and DevSecOps can progress in parallel when dependencies are ready.

---

## 3. Sprint 1: Core Auditing MVP (User Stories)

| ID | Status | User Story | Product Acceptance Criteria | Issues / Features |
| :--- | :--- | :--- | :--- | :--- |
| **CR-US-01** | Ready for Refinement | As a project lead or auditor, I want to prepare one audit package for a project or event and add its related activity documents so that Check Republic can evaluate them together for compliance. | <ul><li>One audit package represents one project or event.</li><li>Users can add multiple supported files (`.docx`, `.pdf`, `.xlsx`) to the same package; maximum file size remains 25 MB per file.</li><li>Files can be added by dragging and dropping them into the upload area or by clicking the upload area to select files.</li><li>Uploaded files are clearly listed, and users can remove or replace files before running the audit.</li><li>Unsupported, oversized, or invalid files show clear feedback without discarding valid files already added to the package.</li><li>Documents in the same package are treated as related to the same project or event and may be used for cross-document checks.</li><li>Package preparation covers Empty, Loading, Error, and Success states.</li></ul> | <ul><li>`[DESIGN]` Audit package preparation and multi-file upload states</li><li>`[FRONTEND]` Multi-file audit package preparation interface</li><li>`[BACKEND]` Secure document ingestion, package association, and validation</li><li>`[DEVSECOPS]` Staging upload/storage, secrets, and runtime controls</li></ul> |
| **CR-US-02** | Needs DocuLogi Validation | As an officer submitting a Pre-Acts package, I want Check Republic to evaluate required Pre-Acts documents, sections, and signatory blocks so that I can fix blocking issues before DocuLogi review. | <ul><li>Checks required Pre-Acts documents, sections, and signatory blocks defined by the confirmed CSO / DocuLogi requirements.</li><li>Flags missing required documents, sections, or signatory blocks.</li><li>Each finding identifies the affected document/section when determinable.</li><li>Rules that cannot be evaluated reliably are surfaced for manual review.</li><li>Final rule behavior is based only on confirmed stakeholder requirements.</li></ul> | <ul><li>`[BACKEND]` Document structure parser</li><li>`[BACKEND]` Pre-Acts rules engine and tests</li><li>`[DESIGN]` Compliance finding presentation</li></ul> |
| **CR-US-03** | Needs DocuLogi Validation | As a project lead, I want declared Tie-Ups compared with attached MOAs so that missing or inconsistent partnership information is detected before submission. | <ul><li>Compares relevant documents only within the same audit package / project or event.</li><li>Detects Tie-Ups without corresponding required MOAs.</li><li>Flags organization-name mismatches for review.</li><li>Shows which partner / document caused the finding.</li><li>Name-matching behavior follows a confirmed DocuLogi rule.</li></ul> | <ul><li>`[DESIGN]` Tie-Up → MOA mismatch and cross-document comparison states</li><li>`[BACKEND]` Tie-Up → MOA consistency validation</li><li>`[FRONTEND]` Cross-document mismatch findings</li></ul> |
| **CR-US-04** | Ready for Refinement | As a user who uploaded documents, I want a clear breakdown of audit findings so that I know exactly what needs to be corrected before submission. | <ul><li>Shows an overall audit result without implying official DocuLogi approval.</li><li>Findings are grouped as **Blocking**, **Warning**, or **Info**.</li><li>Each finding includes a concise reason and actionable recommendation.</li><li>Users can identify the affected document/location when available.</li></ul> | <ul><li>`[DESIGN]` Audit Results Inspector</li><li>`[FRONTEND]` Findings dashboard / detail view</li><li>`[BACKEND]` Structured audit findings response</li><li>`[DEVSECOPS]` Staging deployment and critical-path smoke verification</li></ul> |
| **CR-US-05** | Ready for Refinement | As a DLSU user, I want to sign in with my DLSU Google account so that access to Check Republic is limited to authorized DLSU users. | <ul><li>Google sign-in is available from the sign-in page.</li><li>Only Google accounts using the `@dlsu.edu.ph` domain can enter the authenticated application.</li><li>Non-DLSU accounts are blocked with a clear access message.</li><li>Successful sign-in creates an authenticated session and returns the user to Check Republic.</li></ul> | <ul><li>`[DESIGN]` Sign-in, loading, and access-denied states</li><li>`[FRONTEND]` Google sign-in flow and protected-route handling</li><li>`[BACKEND]` Verify Google identity, enforce DLSU domain, and create session</li><li>`[DEVSECOPS]` OAuth client configuration, callback/origin settings, and secrets</li></ul> |
| **CR-US-06** | Ready for Refinement | As an authenticated DLSU user, I want my session to remain valid during normal use and be able to sign out so that my account access ends when I am finished. | <ul><li>Authenticated state persists across normal navigation and refresh until session expiry or sign-out.</li><li>Sign-out ends the active session and returns the user to sign-in.</li><li>Expired or invalid sessions require reauthentication.</li><li>Protected areas cannot be accessed without a valid authenticated session.</li></ul> | <ul><li>`[DESIGN]` Account and sign-out interaction states</li><li>`[FRONTEND]` Session-aware UI, route guards, and sign-out</li><li>`[BACKEND]` Session lifecycle, expiry, sign-out, and tests</li></ul> |
| **CR-US-07** | Ready for Refinement | As a user with a prepared audit package, I want to manually start the audit so that I can verify the correct documents are included and choose the appropriate audit type before Check Republic analyzes them. | <ul><li>Adding, removing, or replacing files does not automatically start an audit.</li><li>Before running the audit, the user selects **Pre-Acts** or **Post-Acts**; the selected audit type determines which confirmed ruleset is applied.</li><li>Run Audit is available only when the package contains at least one valid document and an audit type is selected.</li><li>Clicking Run Audit starts a new audit against the current package contents.</li><li>While processing, the interface shows a clear in-progress state, prevents duplicate audit starts, and prevents package changes for the active run.</li><li>When processing succeeds, the audit results are shown.</li><li>If the audit fails, the uploaded package remains intact, a clear error is shown, and the user can retry without re-uploading; the affected document is identified when determinable.</li><li>If the package changes after a completed audit, previous results are treated as outdated and a new audit is required.</li></ul> | <ul><li>`[DESIGN]` Run Audit, audit-type selection, processing, failure/retry, and stale-results states</li><li>`[FRONTEND]` Audit trigger and processing/result-state handling</li><li>`[BACKEND]` Audit execution lifecycle, package snapshot, and failure handling</li></ul> |
| **CR-US-08** | Needs DocuLogi Validation | As an officer submitting a Post-Acts package, I want Check Republic to evaluate required Post-Acts documents and compliance requirements so that I can correct issues before official DocuLogi review. | <ul><li>Checks required Post-Acts documents, sections, signatory blocks, and other requirements defined by the confirmed CSO / DocuLogi ruleset.</li><li>Flags missing required Post-Acts documents or requirements.</li><li>Each finding identifies the affected document/section when determinable.</li><li>Rules that cannot be evaluated reliably are surfaced for manual review.</li><li>Findings use the same Blocking, Warning, or Info severity model and include an actionable reason or recommendation when applicable.</li><li>Final rule behavior is based only on confirmed stakeholder requirements.</li></ul> | <ul><li>`[DESIGN]` Pre-/Post-Acts audit-type and finding states</li><li>`[FRONTEND]` Post-Acts audit-mode and findings integration</li><li>`[BACKEND]` Post-Acts rules engine and tests</li></ul> |

> **Story Readiness Note:** `CR-US-02`, `CR-US-03`, and `CR-US-08` are ready for technical decomposition around confirmed product behavior, but their final compliance-rule logic remains dependent on confirmed CSO / DocuLogi requirements. Missing compliance rules must not be invented by the implementation team.

---

## 4. Product Design Workstream — Sprint 1

| Issue / Feature | Target Window | Outcome | Review |
| :--- | :--- | :--- | :--- |
| `[DESIGN]` Map Sprint 1 user journey, information architecture, and navigation | Early Sprint 1 | Define one coherent path from DLSU sign-in → prepare audit package → select Pre-Acts or Post-Acts → Run Audit → processing → findings → correction/next action. | PM + Tech Lead |
| `[DESIGN]` Create low-fidelity wireframes for the Sprint 1 critical path | Early Sprint 1 | Cover authentication, multi-file package preparation, Pre-/Post-Acts selection, Run Audit/processing/failure, findings/results, Tie-Up → MOA mismatch handling, and account/sign-out states. | PM |
| `[DESIGN]` Establish Check Republic UI foundation and reusable components | Early-Mid Sprint 1 | Define typography, spacing, buttons, inputs, cards, statuses, findings, alerts, dialogs, and LSCS-aligned visual patterns for consistent implementation. | PM + Frontend |
| `[DESIGN]` Produce responsive high-fidelity mockups and interactive prototype | Mid Sprint 1 | Provide implementation-ready desktop/mobile designs and an interactive prototype for the complete Sprint 1 critical path. | PM + Frontend |
| `[DESIGN]` Define accessibility, responsive behavior, and interaction-state coverage | Mid Sprint 1 | Specify responsive behavior and required states such as empty, loading, error, success, disabled, access-denied, and manual-review states. | PM + Frontend |
| `[DESIGN]` Validate implemented UI on staging and document design discrepancies | Sprint close | Compare staging against approved designs, record discrepancies, and confirm design accuracy before PM product acceptance. | Product Design + PM |

> **Design Review Note:** Product Design owns the UX artifacts and validates design accuracy; the PM validates product requirements and final product acceptance; Frontend collaborates during handoff and implementation.

---

## 5. Technical Enablers

*Engineering work required to enable the stories, but not Product User Stories themselves.*

| Area | Status | Outcome | Primary Domain |
| :--- | :--- | :--- | :--- |
| **Repository & CI Baseline** | Ready for Breakdown | Repository protections and CI baseline for both repositories. | `[DEVSECOPS]` |
| **Backend Baseline** | Ready for Breakdown | Application baseline, configuration, health checks, error contract, and test setup. | `[BACKEND]` |
| **Frontend Baseline** | Ready for Breakdown | Frontend application shell, shared UI foundation, and async-state handling. | `[FRONTEND]` |
| **Authentication & Session Baseline** | Ready for Breakdown | DLSU-only Google authentication, session handling, and protected application access. | `[BACKEND]` + `[FRONTEND]` + `[DEVSECOPS]` |
| **Staging & Secrets** | Ready for Breakdown | Dokploy staging, secrets, and upload/runtime controls. | `[DEVSECOPS]` |

---

## 6. DevSecOps Workstream — Sprint 1

| Issue / Feature | Target Window | Outcome | Review |
| :--- | :--- | :--- | :--- |
| `[DEVSECOPS]` Classify Check Republic project risk tier and define Sprint 1 release gates | Oct 7 | Set the minimum CI, security, staging, and release evidence required for the project. | Senior DevSecOps |
| `[DEVSECOPS]` Configure repository protections and CI baseline for API and web | Oct 7–8 | Protected PR workflow and required automated checks are in place for both repositories. | Senior DevSecOps |
| `[DEVSECOPS]` Provision Dokploy staging, secrets, and upload/runtime controls | Oct 7–10 | Staging is ready for integration with safe environment/secret handling and upload-related runtime controls. | Senior DevSecOps |
| `[DEVSECOPS]` Configure Google OAuth client, approved origins/callbacks, and authentication secrets | Oct 7–10 | OAuth settings support the DLSU-only authentication flow across local and staging environments without exposing secrets. | Senior DevSecOps |
| `[DEVSECOPS]` Verify critical path in staging and document release evidence / recovery notes | Oct 18–21 | Critical user flow is smoke-verified before sprint close; release evidence and recovery expectations are recorded. | Senior DevSecOps |

> **Workstream Note:** DevSecOps is cross-cutting, so it appears as dedicated technical-enabler issues and only on Product Stories that directly need infrastructure, delivery, or staging work. Not every story requires a DevSecOps issue.
>
> **Review Note:** DevSecOps-facing changes require Senior DevSecOps review. Frontend and Backend PRs remain primarily reviewed by the Project Tech Lead. Product acceptance remains with the Product Manager.

---

## 7. Open Product Items

| Item | Status | Next Step |
| :--- | :--- | :--- |
| **Official CSO / DocuLogi ruleset and templates** | Pending stakeholder input | Obtain confirmed Pre-Acts, Post-Acts, and Tie-Up / MOA rules/templates plus representative valid and invalid packages; use these as the source of truth before finalizing CR-US-02, CR-US-03, and CR-US-08 audit rules. |
| **Notify DocuLogi when a document package is completed / ready** | Backlog / Needs Definition | Clarify trigger, recipient, channel, and whether this belongs in Sprint 1. |
| **Phase 2: Logistics Permit Helper + Ops Machine workflows** | Backlog | Refine after the Core Auditing MVP is stable. |

---

## 8. GitHub Issue Rule

When creating domain-specific GitHub issues from this backlog, apply the following structure:

```text
[DOMAIN] Outcome-oriented title
- Link parent CR-US-XX
- Define "Complete When"
- Identify owner / domain
- List dependencies / risks
- Add target window (when the issue is sprint-bound)
```