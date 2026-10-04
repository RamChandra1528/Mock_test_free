# Persistent Project Memory — MockMaster

This is the durable decision log for future developers and agents. Never delete an entry; record a new superseding decision when necessary.

## Project snapshot

- **Purpose:** Competitive-exam practice, authoring, import, analytics, study resources, and study planning.
- **Current architecture:** React/Vite SPA + NestJS API + Prisma/MySQL; local upload storage; Docker Compose baseline.
- **Important dependencies:** React Router, TanStack Query, Axios, Tailwind, React Hook Form, Zod, Recharts, NestJS, Prisma, Passport JWT, bcrypt, class-validator, Helmet, Multer, parsing libraries.
- **API convention:** `/api`; Axios sends credentials; global validation/error envelope; controller → service → Prisma.
- **UI convention:** forest/mint/cream, Manrope/Plus Jakarta Sans, responsive shell, shared UI primitives; see `DESIGN.md`.
- **Business constraints:** Server owns scoring/expiry; active attempts never expose answer keys; student records require ownership; admin mutation requires `ADMIN`; English is the bilingual fallback.

## Decision: Use MockMaster as the documented product name pending rename

Date: 2026-09-20  
Status: ACTIVE  
Decision: Documentation uses **MockMaster**, the verified name in package metadata, UI, configuration, storage key/cookie names, seed data, and README. The supplied documentation brief uses “StudentHub.”  
Reason: Renaming source identifiers or product copy would be an application/product change not authorized by the documentation request.  
Impact: Treat a StudentHub rename as a P0 product decision; map or migrate public copy, package name, cookie/local-storage keys, database names, URLs, and seed credentials deliberately rather than partially.

## Decision: SPA plus NestJS API with MySQL/Prisma

Date: 2026-09-20  
Status: ACTIVE  
Decision: Keep the implemented React 19/Vite frontend and NestJS 11 backend, with Prisma 6 over MySQL.  
Reason: This is the existing typed, modular architecture with migrations, tests, and Docker support.  
Impact: Do not introduce Next.js, GraphQL, a second ORM, or another primary database without a documented migration plan.

## Decision: HTTP-only JWT cookie session with database-backed active-user check

Date: 2026-09-20  
Status: ACTIVE  
Decision: JWT is set in `mockmaster_access` as an HTTP-only, SameSite=Lax cookie; Passport also accepts a bearer token for trusted integrations and loads current active user data from MySQL.  
Reason: Keeps browser tokens out of JavaScript while allowing account deactivation to take effect on future requests.  
Impact: Keep `withCredentials`, CORS, and cookie configuration aligned. Production requires HTTPS and `COOKIE_SECURE=true`. Refresh tokens, recovery, and verification are not implemented.

## Decision: Backend is authoritative for test integrity

Date: 2026-09-20  
Status: ACTIVE  
Decision: Expected end time, allowed answer mutation, submission finality, scoring, and user statistic updates are enforced by the backend. Active-attempt responses omit answer keys/explanations.  
Reason: Client state and clocks cannot be trusted for assessment integrity.  
Impact: Never move scoring or expiry authority into React. Any new question type must extend server validation, answer persistence, scoring, result, and review contracts together.

## Decision: Bilingual variants share a domain record

Date: 2026-09-20  
Status: ACTIVE  
Decision: English fields are primary, optional Hindi fields live on the same taxonomy/exam/question/option/explanation record, and clients fall back to English.  
Reason: Stable IDs preserve answers and analytics across language changes during a test.  
Impact: Do not create language-specific duplicate question records. New localized fields must preserve fallback semantics.

## Decision: Local uploads are an interim storage boundary

Date: 2026-09-20  
Status: ACTIVE — REVISIT BEFORE PUBLIC PRODUCTION  
Decision: Validated images/PDFs are written under `UPLOAD_DIR/public` and served by Nest; Docker persists through a named volume.  
Reason: It is implemented and supports local development/demo workflows.  
Impact: Object storage, malware scanning, private/signed access, retention, and backup are still required before sensitive/high-scale production.

## Decision: Imports are reviewed before content creation/publishing

Date: 2026-09-20  
Status: ACTIVE  
Decision: Parsed import content enters an editable review workflow with warnings and duplicate actions, then confirms to a draft exam; publishing remains a separate validation action.  
Reason: Extraction is imperfect and content quality/integrity requires human review.  
Impact: Do not add direct import-to-published shortcuts. OCR/durable queues require a documented extension of this review contract.

## Decision: Existing responsive scroll pattern

Date: 2026-09-20  
Status: ACTIVE  
Decision: Constrained navigation and test-palette number lists use independently scrollable inner regions; surrounding heading, legend, and critical actions stay visible.  
Reason: Long navigation lists must remain usable without losing context/actions.  
Impact: Reuse `min-h-0`, `flex-1`, `overflow-y-auto`, and `overscroll-contain` patterns for similar panels.

## Decision: Unified error visibility with request correlation

Date: 2026-09-20  
Status: ACTIVE  
Decision: Browser/API failures are normalized as `AppError`; React Query, unhandled runtime promises/errors, and render exceptions feed a deduplicated toast/reporting path. The API assigns `X-Request-Id` and emits safe `{ message, code, requestId }` errors while logging server exception details with the same ID.  
Reason: A user should never be left with a blank screen or silent failed request, and support needs a safe correlation reference without exposing internals.  
Impact: Do not swallow promise failures or return unstructured error bodies. Preserve page-level contextual errors and mutation feedback; use the global system for coverage rather than duplicating notification infrastructure.

## Known limitations / constraints

- The application currently has no object storage, malware scan, durable import worker, OCR, backup/restore policy, telemetry, E2E suite, email service, refresh tokens, password reset, or audit log.
- Docker Compose contains development credentials and currently has no frontend port mapping in the inspected file. Do not treat it as public-production configuration.
- `docs/API.md` is useful but incomplete for calendar/materials and some newer endpoints; track as P1-07.
- There are user-owned pending Prisma migration directories in the worktree. Preserve and review them rather than deleting/recreating migrations blindly.
