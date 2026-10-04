# Development Rules — MockMaster

**Status:** Active project-level constraints.  
**Last updated:** 2026-09-20.

These rules govern future changes. Check all six core documents before a major feature or architectural change.

## 1. Architecture and organization

- Keep the React SPA in `frontend/` and the Nest API in `backend/`; do not mix browser code into backend modules or server secrets into frontend code.
- Keep pages in `pages/`, shared UI in `components/`, cross-page behavior in `features/`, contexts only for true application-wide client state, and transport helpers in `lib/`.
- Keep Nest controllers thin, DTOs in their module, domain behavior in services, and database access through `PrismaService`.
- Prefer the existing module boundaries: `auth`, `student`, `admin`, `calendar`, `prisma`, and `common`.
- Add a feature document update in the same change when behavior, architecture, visual conventions, task status, or a durable decision changes.

## 2. TypeScript, naming, and components

- Use TypeScript types for public function/component props and request/response shapes. Avoid `any`; an existing generic lazy-loader exception is not a pattern for new code.
- Use `PascalCase` for React components/classes/types, `camelCase` for functions/variables, and clear domain names (`attemptId`, not `id` where ambiguity exists).
- Export named page components in the existing route-loader style. Keep files focused; split a component when it owns a distinct reusable interaction.
- Reuse `ui.tsx`, `PageHeader`, `Badge`, `Modal`, `Loading`, `Empty`, `ErrorState`, `Pagination`, Tailwind component classes, and existing feature helpers before adding substitutes.
- Use React hooks at component top level only. Put asynchronous server state in TanStack Query or explicit, testable actions; do not duplicate API state in several contexts.

## 3. API, validation, and database

- Add/adjust a DTO for every mutable API contract. Preserve global whitelist, forbid-unknown, and transform validation.
- Use standard resource-oriented paths under `/api`, correct HTTP verbs, explicit pagination/filter query DTOs, and the established error envelope.
- Authorize before acting on a resource; verify ownership for all student-specific records and role for all admin operations.
- Use Prisma relations, transactions, unique constraints, and indexes intentionally. Query only the fields required and never return a sensitive field by accident.
- Schema changes require an inspected Prisma migration, a schema update, tests when behavior changes, and architecture/task/memory documentation. Apply through the project migration scripts; do not hand-edit a live database schema.
- Preserve answer-key isolation: active attempt payloads must never return `isCorrect`, correct option IDs, explanations, or explanation translations.
- Preserve server authority for expiry, submission, scoring, user statistics, and exam attempt rules. Client state is not proof.

## 4. Authentication, security, and privacy

- Keep credentials in the HTTP-only `mockmaster_access` session cookie; browser code must not store JWTs.
- Maintain bcrypt password hashing, JWT validation against an active database user, global JWT guarding, and explicit role metadata.
- Keep `COOKIE_SECURE=true` in HTTPS production and restrict `FRONTEND_URL` to the deployed client origin.
- Validate file type by content/signature as the current media service does; enforce size and destination rules; do not trust filename or browser MIME alone.
- Never log passwords, tokens, cookies, raw authorization headers, or answer keys. Return safe messages through the shared exception filter.
- Preserve the error contract `{ success, message, timestamp, status, code, requestId }`. Add a user-safe error code/message and include request context in server logs; never return a stack trace.
- Treat multilingual free text, Markdown, and file content as untrusted input. Render it only through the established safe path and review any new renderer carefully.

## 5. UI/UX, accessibility, and responsive behavior

- Follow [DESIGN.md](DESIGN.md). Use the existing forest/mint/cream visual language, shared layout, and Tailwind breakpoints.
- Use semantic elements, labels/legends, meaningful `aria-label`s for icon-only controls, keyboard-operable controls, and `:focus-visible` feedback.
- Use existing modal focus/scroll behavior rather than creating untrapped dialogs.
- Every page must provide an intentional loading, empty, error, and success/feedback state where data mutation or retrieval warrants it.
- Use the shared `AppError` conversion/reporting path. Do not swallow rejected promises; use a contextual mutation error handler or allow the global query/mutation/runtime reporter to surface the failure.
- Test narrow mobile layouts as well as desktop. A constrained sidebar/palette/list must have its own scroll area and must not hide essential actions.
- Do not create inaccessible color-only state; pair status colors with text, icon, count, position, or accessible name.

## 6. Performance, reliability, and dependencies

- Preserve lazy page loading and avoid placing large modules in the initial route bundle.
- Paginate/filter large lists server-side and use existing React Query defaults unless a measured requirement justifies a change.
- Keep local recovery data minimal and scoped by attempt/user where appropriate; clean it on successful completion.
- Add dependencies only when existing dependencies or platform APIs cannot solve the requirement. Document why, license/security considerations, and bundle/runtime effect.
- Keep parser/import work bounded; move genuinely long-running work to a durable asynchronous architecture only after documenting the design.

## 7. Testing and quality gates

- Add or update unit/component tests for changed business rules, guards, payload transforms, score calculations, dates, or interactive behavior.
- Run the narrowest relevant tests during development, then root `npm test`, `npm run build`, and frontend lint when practical before delivery. State any command that could not complete.
- Do not mark a roadmap task `DONE` merely because UI exists; verify the behavior and relevant authorization/error path.
- Do not overwrite unrelated worktree changes. Keep user changes separate from the task at hand.

## 8. Git and documentation

- Use small, imperative commits such as `feat: add exam publish validation` or `fix: retain palette legend while scrolling`.
- Branch naming convention: `feature/<area>-<summary>`, `fix/<area>-<summary>`, `docs/<summary>`, or `chore/<summary>`.
- Update `PRD.md` for product behavior, `ARCHITECTURE.md` for technical change, `DESIGN.md` for reused UI patterns, `TASKS.md` for roadmap status, and `MEMORY.md` for major/reversible decisions.
- Never delete a historical decision from `MEMORY.md`; supersede it with a dated follow-up.

## 9. DO NOT

- Do not expose secrets, password hashes, session tokens, or correct answers in browser payloads/logs.
- Do not bypass authentication, role checks, ownership checks, validation, or server-side exam rules.
- Do not duplicate scoring, import, translation fallback, or other business logic across pages/controllers.
- Do not introduce a library when an existing project dependency solves the need.
- Do not create unrelated styles or break the design system for one page.
- Do not modify database structure without a migration and documentation.
- Do not mutate published/history-linked content in a way that invalidates attempts.
- Do not make a new feature appear done without testing the unhappy path and documented acceptance criteria.
- Do not overwrite user-provided work or use destructive Git/database commands without explicit authorization.
