# Product Requirements Document — MockMaster

**Status:** IMPLEMENTED baseline; roadmap items are explicitly marked.  
**Last verified:** 2026-09-20  
**Working product name:** MockMaster. The supplied brief calls the product “StudentHub”; a rename decision is **NOT YET DEFINED**. This document uses MockMaster because it is the implemented name in source, configuration, seed data, and UI.

## 1. Product overview and vision

MockMaster is a competitive-exam practice platform. Administrators create, curate, import, publish, and analyze mock examinations. Students register, take timed computer-based tests (CBT), review results, track performance, organize study activity, and access published study materials.

The vision is to make high-quality exam practice reliable and understandable: a student should be able to move from discovering a test, through a timed attempt, to actionable feedback without losing progress or exposing answer keys during an active test.

### Problem statement

Competitive-exam students need realistic practice, immediate feedback, bilingual content, and evidence of where to improve. Content teams need a controlled way to publish quality question banks and imported papers without introducing incomplete or unsafe questions. Generic quiz tools do not sufficiently protect active answer keys, enforce time limits server-side, or supply exam-specific analytics.

## 2. Users and roles

| Persona | Goal | Access |
| --- | --- | --- |
| Student preparing for an exam | Find and complete mock tests, learn from results, plan study | `STUDENT` routes and APIs |
| Student returning to practice | Resume an allowed in-progress attempt and see trends | `STUDENT` routes and APIs |
| Content administrator | Manage taxonomy, questions, exams, imports, materials, learners, and analytics | `ADMIN` routes and APIs |
| Platform operator | Configure infrastructure, secrets, database, and deployment | Deployment access only; no product role is implemented |

Roles are mutually enforced in the backend and frontend. Public registration creates only `STUDENT` accounts; admin creation/provisioning workflow is **NOT YET DEFINED**.

## 3. Implemented journeys and feature requirements

### F-01 Authentication and access control — IMPLEMENTED

**What / why:** Register and sign in a user, establish a protected session, and prevent role-inappropriate access. This protects student data and administrative operations.

**Who:** Public visitors may register or log in; authenticated users may log out and read their safe profile.

**Expected behavior:** Registration normalizes email, requires matching passwords, creates a student, and gives a daily login reward where applicable. Login refuses inactive accounts and invalid credentials. The server sets an HTTP-only JWT cookie and the client restores identity through `/auth/me`. Role-specific navigation and routes redirect unauthorized users.

**Edge cases:** Duplicate email returns a validation error; inactive accounts are rejected even if a prior JWT exists; browser clients must send cookies; the cookie lifetime follows `JWT_EXPIRES_IN` for supported minute/hour/day syntax.

**Acceptance criteria:**

- A valid student can register, log in, refresh, and retain their authenticated state.
- Password hashes and JWT tokens never appear in profile responses.
- An unauthenticated or wrong-role request cannot access protected data.
- Login and registration are rate-limited more strictly than general APIs.

### F-02 Student test discovery and starting an attempt — IMPLEMENTED

**What / why:** Students browse published exams and receive only enough metadata and instructions to decide whether to start. It keeps unpublished work private and supports controlled attempt limits.

**Who:** Students.

**Expected behavior:** The dashboard, categories, exams list, and exam detail screen show published content. Starting an exam creates an attempt or resumes the allowed active attempt. Exam settings can impose attempt limits and control resume, instant result, answer review, and ordering behavior.

**Edge cases:** Draft or archived exams cannot be exposed as student tests; a student must not exceed configured attempts; a previous active attempt must be handled according to `allowResume`; absent Hindi text falls back to English.

**Acceptance criteria:**

- Only publishable, published exams are discoverable by students.
- Start/resume respects ownership, attempt limits, and settings.
- Exam details do not expose correct answer information.

### F-03 Timed CBT attempt — IMPLEMENTED

**What / why:** Deliver a realistic timed test with resilient answer persistence. It supports test integrity and reduces lost work.

**Who:** Students with an owned in-progress attempt.

**Expected behavior:** The test presents question content, options, images, navigation, clear response, and mark-for-review controls. It shows a server-aligned timer and a status palette. Selection, visited state, review flag, and current position are saved immediately and retried periodically; unfinished local saves are retained in browser storage. The question palette has its own scrollable number grid so lengthy exams remain navigable while its legend stays visible.

**Edge cases:** Network failures leave pending saves for retry and prevent unsafe submit; navigation bounds are enforced; active answer payloads exclude correct options and explanations; browser unload prompts the student; expired attempts are submitted by a scheduled backend process and server actions reject late mutation.

**Acceptance criteria:**

- A student can move among questions and restore an allowed attempt with saved state.
- Server time, not client time alone, determines expiry.
- Correct answers/explanations are not returned before authorized review.
- Submitting makes an attempt read-only and scores it once.

### F-04 Results, review, history, and performance — IMPLEMENTED

**What / why:** Turn an attempt into useful feedback and longer-term learning signals.

**Who:** Students; administrators can view aggregate and drill-down analytics.

**Expected behavior:** After server scoring, students can view score, counts, accuracy, percentage, time, sections, and charts where the exam setting permits immediate results. Authorized review includes answers and explanations. History and performance pages show attempts, score/accuracy/activity trends, subject/topic analysis, and weak/strong areas.

**Edge cases:** Result/review availability follows exam settings; score supports per-question marks and negative marks; unanswered questions receive no penalty; a zero attempted count yields zero accuracy.

**Acceptance criteria:**

- Score calculations are server-side, rounded to two decimals, and based on selected versus correct option IDs.
- Review is unavailable when settings forbid it.
- Students can access only their own attempts and analytics.

### F-05 Bilingual learning experience — IMPLEMENTED

**What / why:** Let students use English or Hindi without making separate question records or interrupting an active test.

**Who:** Students; admins author translated taxonomy, exams, questions, options, sections, and explanations.

**Expected behavior:** A student selects English or Hindi; the selection is stored locally and, for students, persisted to their profile. The UI uses Hindi fields where non-empty and falls back to English. Switching does not reset the timer or answer state.

**Edge cases:** Missing Hindi text must display English, not an empty value; rapid switches serialize preference writes so an older request cannot overwrite the latest choice.

**Acceptance criteria:**

- The same domain record/ID is used in both languages.
- Language changes are available inside a live test and do not alter answers.

### F-06 Study materials and learning resources — IMPLEMENTED

**What / why:** Provide published learning PDFs to support preparation beyond mock attempts.

**Who:** Admins manage material; students browse published material and open a viewer.

**Expected behavior:** Admins upload validated PDFs, add title/description/exam/image/published metadata, edit, and delete materials. Students receive only published resources and view their PDF through the app.

**Edge cases:** Invalid PDF signatures are rejected; file URLs use the configured upload service; object storage, malware scanning, and access-expiring URLs are **PLANNED**.

**Acceptance criteria:**

- Student listing and detail endpoints omit unpublished materials.
- Administrator material changes require admin authorization.

### F-07 Calendar, tasks, notes, reminders, and engagement — IMPLEMENTED

**What / why:** Help a student plan learning and reward regular engagement; let admins publish academic events.

**Who:** Students own their notes, sticky notes, goals, and tasks. Admins own academic events and their own notes.

**Expected behavior:** Students manage dated notes, movable sticky notes, a single goals record, and tasks with priority/completion. Admins manage calendar events. Student dashboards/leaderboards include daily-login points and streak information.

**Edge cases:** Per-user ownership must apply to student calendar entities; duplicate login rewards for an India calendar day do not add points twice; leaderboard period is daily, weekly, or monthly.

**Acceptance criteria:**

- One student cannot read or modify another student’s personal planning data.
- At most one reward is created per student per India calendar day.
- Admin event mutation is admin-only.

### F-08 Content, taxonomy, import, and publishing — IMPLEMENTED

**What / why:** Give content staff a structured, reviewable content-production workflow.

**Who:** Administrators.

**Expected behavior:** Admins manage categories, subjects, topics, exams, settings, dynamic sections, questions, options, images, and question ordering. They can import PDF, DOCX, XLSX, CSV, or JSON, inspect parsed questions/warnings/duplicates, correct or remove entries, then explicitly confirm them into a draft exam. Publishing validates readiness; duplication supports history-safe editing.

**Edge cases:** Text extraction patterns are flexible but scanned-PDF OCR is not implemented; media accepts only signature-validated PNG/JPEG/GIF/WebP; imports do not silently publish content; records referenced by history cannot be deleted where constraints protect them.

**Acceptance criteria:**

- A publish action rejects an invalid/incomplete exam.
- Imported questions are editable before confirmation.
- Question/options validation and uniqueness constraints are enforced server-side.
- Only admins can mutate content or upload files.

### F-09 Administration and analytics — IMPLEMENTED

**What / why:** Let authorized staff operate the platform and make evidence-based content decisions.

**Who:** Administrators.

**Expected behavior:** The admin console provides dashboard metrics, exam/question analytics, students and their attempt details, attempt monitoring, user activation status, taxonomy, import review, and student-experience preview without creating an attempt.

**Edge cases:** Student accounts can be activated/deactivated; analytics must not disclose credentials; deleting content with dependent records must fail safely.

**Acceptance criteria:**

- Every admin UI route and API route requires `ADMIN`.
- Admin list views support the implemented pagination/search/filter behavior.
- Analytics are calculated from persisted attempts rather than client claims.

## 4. Data requirements

The authoritative data store is MySQL through Prisma. Core entities are users/roles/statistics; learning taxonomy; exams/settings/sections/questions/options; attempts/answers; imports/imported questions; resources; and calendar/engagement records. IDs for domain records are UUID strings; the role lookup uses an integer ID. English and Hindi content live on the same record. Schema constraints and indexes are documented in [ARCHITECTURE.md](ARCHITECTURE.md).

## 5. Cross-cutting requirements

### Functional

- APIs are rooted at `/api`; public, student, and administrator access is explicit.
- Input DTOs are validated and unknown fields rejected.
- Responses use a stable error envelope.
- Uploaded images and PDFs are served under `/uploads/`.

### Non-functional

- **Security — IMPLEMENTED baseline:** HTTP-only JWT cookie, bcrypt cost 12, Passport verification, RBAC, Helmet, CORS origin configuration, rate limiting, validation, and server-side scoring/expiry.
- **Error visibility — IMPLEMENTED:** API failures have safe user messages, codes, and request references; contextual page/mutation feedback is supplemented by global query, runtime, and render-failure recovery. Internal stack traces remain server-only.
- **Performance — IMPLEMENTED baseline:** page-level lazy loading, React Query defaults (one retry/20-second stale time), database indexes, static asset caching in Nginx, and paginated admin/student lists. Load testing and cache infrastructure are **NOT YET DEFINED**.
- **Accessibility — IMPLEMENTED baseline:** semantic controls, form labels/legends, visible focus treatment, modal focus handling/Escape behavior, accessible navigation labels, responsive controls, loading/error/empty states. Formal WCAG audit is **PLANNED**.
- **Responsive/mobile — IMPLEMENTED:** Tailwind responsive layouts, off-canvas navigation/palette, adaptive action labels, and independently scrolling sidebars/palette grids. Native mobile apps are **OUT OF SCOPE**.

## 6. Scope boundaries and future work

**Out of scope for the verified baseline:** payments, subscriptions, proctoring, real-time chat, social following, native apps, multi-select question scoring, email verification, password reset, refresh-token rotation, OCR, object storage, durable import queue, formal audit logging, full observability, backups, and browser E2E tests.

**Planned candidates (not implemented):** OCR worker for scanned papers; durable queued imports; object storage and malware scanning; long-lived-session controls; audit log; Playwright E2E; production monitoring/backups/horizontal workers; expanded question types after scoring/validation design.

## 7. Success criteria

- A student completes a full timed test without client-side answer-key exposure.
- The backend remains authoritative for ownership, expiry, submission, and score.
- An admin can create or import a reviewed draft, publish it, and inspect performance.
- Bilingual content is usable with safe English fallback.
- Production deployment replaces demonstration secrets and local-upload limitations before handling real users.
