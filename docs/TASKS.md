# Implementation Roadmap — MockMaster

**Last verified:** 2026-09-20. Status is evidence-based: `DONE` means verified in the repository, not merely described in a brief.

## P0 — Critical

| ID | Feature | Description | Status | Dependencies | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| P0-01 | Secure sessions/RBAC | Registration/login, active-account validation, HTTP-only JWT cookie, and role guards | DONE | Prisma users/roles, JWT config | Anonymous/wrong-role users cannot reach protected data; active users restore a session |
| P0-02 | Server-authoritative CBT | Start/resume, answer persistence, timer/expiry, submit lock, and server scoring | DONE | Exams/questions/attempts schema | No active-test answer key leaks; expired/submitted attempts cannot mutate; scores use server option IDs |
| P0-03 | Content publishing integrity | Exam/question/settings validation and draft-to-published workflow | DONE | Admin service, Prisma schema | Invalid exam cannot publish; students see only permitted published content |
| P0-04 | Production security readiness | TLS, non-demo secrets, secure cookie, secret rotation, backups, and deployment hardening | TODO | Hosting/operations owner | Live deployment has HTTPS, `COOKIE_SECURE=true`, unique secrets, tested backup/restore, and no demo credentials |
| P0-05 | Naming decision | Decide whether MockMaster remains the product name or is renamed StudentHub across product/source/deployment | BLOCKED | Product owner decision | Approved naming, migration scope, and copy/identifier policy are recorded |
| P0-06 | Project-wide error visibility | Normalize frontend/API errors, show recovery UI, correlate server errors to browser references | DONE | Axios, React Query, exception filter | Query/mutation/runtime/render errors are visible; API errors have safe codes/request IDs; server stacks stay server-side |

## P1 — High

| ID | Feature | Description | Status | Dependencies | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| P1-01 | Student learning workspace | Dashboard, discovery, detail, history, performance, profile, leaderboard | DONE | Student APIs, attempts/statistics | Student views are protected and use owned/published data |
| P1-02 | Bilingual content | English/Hindi fields, persistent selection, fallback, live-switch safety | DONE | Schema, language context | Hindi falls back to English; switch retains exam state |
| P1-03 | Import review workflow | Parse PDF/DOCX/XLSX/CSV/JSON, edit review, warnings/duplicates, draft confirmation | DONE | Parsers, PaperImport models | Import does not silently publish and requires review/confirmation |
| P1-04 | Admin operations/analytics | Admin dashboard, taxonomy, question bank, exams, users, attempts, analytics | DONE | Admin module/UI | All mutation/admin routes are role-gated and analytics read persisted data |
| P1-05 | Study resources/calendar | Published PDF resources; notes/tasks/goals/sticky notes/events/rewards | DONE | Media/calendar services | Ownership and publication checks are enforced |
| P1-06 | Object storage and upload security | Replace local public storage with managed storage, private policy where needed, malware scanning | TODO | Hosting/storage/security decision | Uploads are scanned, durable, access controlled, and deploy-safe |
| P1-07 | API documentation completeness | Update `docs/API.md` to cover current calendar, materials, declare-result, and student record endpoints | TODO | Controller contract review | Every implemented endpoint is documented with role, request, and response/error behavior |
| P1-08 | Browser E2E tests | Add high-value end-to-end coverage for auth, attempt/resume/submit, publish, and import review | TODO | Test runner/CI choice | Tests run in CI against reproducible database fixtures |

## P2 — Medium

| ID | Feature | Description | Status | Dependencies | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| P2-01 | OCR and durable imports | Extract scanned PDFs through an asynchronous durable worker | TODO | OCR vendor/engine, queue/storage | Scanned document processing survives restart and provides reviewable errors |
| P2-02 | Observability | Add structured logs, metrics, tracing, health checks, dashboards, alerts | TODO | Hosting/telemetry decision | Operators can detect API/database/import failures and inspect request correlation |
| P2-03 | Account lifecycle | Email verification, password reset, refresh token rotation, session revocation/audit | TODO | Email provider and security policy | Recovery and revocation are secure, rate-limited, tested, and audited |
| P2-04 | Formal accessibility QA | WCAG-oriented keyboard, screen-reader, contrast, and responsive audit | TODO | Test plan | Issues are tracked/remediated; critical flow passes keyboard-only checks |
| P2-05 | Pagination/search UX audit | Verify every growing list’s filters, page behavior, loading/error states, and URL/state strategy | TODO | Product UX decisions | Large datasets remain usable and query behavior is documented |

## P3 — Future

| ID | Feature | Description | Status | Dependencies | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| P3-01 | Additional question types | Multi-select/other types with new authoring, answer, and scoring rules | TODO | Product/scoring specification | Each type has unambiguous validation, scoring, review, and migration strategy |
| P3-02 | Native mobile apps | Dedicated iOS/Android experience | TODO | Product investment | Auth, exam integrity, offline policy, and API scope approved |
| P3-03 | Dark mode | System/user theme preference and audited component variants | TODO | Design decision | No reduced contrast or mismatched component states |
| P3-04 | Payments/subscriptions/proctoring | Commercial and remote-invigilation capabilities | TODO | Legal, product, security design | Requirements and compliance decisions approved before implementation |
