# MockMaster

MockMaster is a production-oriented online competitive-exam platform. Administrators can create exams or import previous-year papers into a mandatory review workflow; students take published tests in a realistic CBT interface and receive server-scored results, answer explanations, section analytics, history, and performance trends.

## What is implemented

- Student registration/login and admin login with HTTP-only JWT cookies, BCrypt, Passport JWT, validation, throttling, and role guards
- Responsive landing page, student workspace, admin console, loading/error/empty states, dialogs, and toast feedback
- Exam/category/subject/topic/section/question management with pagination, rich Markdown/KaTeX editing, validated image uploads, guarded publishing, and history-safe duplication
- PDF, DOCX, XLSX, CSV, and JSON imports with flexible pattern parsing, warnings, duplicate hints, editable review, and explicit confirmation
- Real CBT interface: server-synced timer, scheduled expiry, auto-submit, navigation palette, clear, mark for review, immediate plus periodic retryable persistence, resume, and leave warning
- Instant English/Hindi switching before or during a live test, persistent student preference, English fallback for missing translations, and bilingual exams, taxonomy, sections, questions, options, explanations, results, and analytics
- Server-authoritative expiry, answer validation, negative marking, immutable submission, overall results, section results, and answer review
- Student dashboard, attempt history, score/accuracy/activity progression, subject/topic performance, editable profile, and weak/strong area detection
- Admin overview with five live analytics views, students, account activation, attempts, per-exam/question analytics, and student-experience preview that creates no attempt
- MySQL/Prisma relational schema and versioned migration, 20-question seed exam, Docker Compose, tests, and API documentation

Correct answers and explanations are intentionally excluded from every active-attempt payload. Only an owned, completed attempt with review enabled can access them.

## Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, React Router, Axios, TanStack Query, Recharts, Lucide, React Hook Form
- Backend: NestJS, TypeScript, Prisma, MySQL 8.4, Passport JWT, BCrypt, class-validator, Multer
- Import: pdf-parse, Mammoth (DOCX), read-excel-file, csv-parse
- Tests: Jest/ts-jest and Vitest/Testing Library

The brief mentioned both NestJS/Node and Maven/PDFBox. The implemented backend follows the requested NestJS stack. File extraction is isolated behind `QuestionExtractionService`, so a PDFBox or OCR worker can be added without changing the admin workflow.

## Architecture

```text
MockTest_app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # normalized MySQL schema
│   │   └── seed.ts             # users, taxonomy, exam, 20 questions
│   ├── src/
│   │   ├── auth/               # JWT, RBAC, DTOs, strategy
│   │   ├── admin/              # exams, questions, import, analytics
│   │   ├── student/            # attempts, timer authority, score/review
│   │   ├── common/             # exception envelope
│   │   └── prisma/             # database service
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/         # UI, timer, cards, route guards
│   │   ├── contexts/           # auth, language, and toast state
│   │   ├── features/exam/      # test interaction state
│   │   ├── layouts/            # responsive app shell
│   │   ├── lib/                # API client and formatting
│   │   └── pages/              # public, student, and admin pages
│   ├── nginx.conf
│   └── Dockerfile
├── docs/API.md
├── docker-compose.yml
└── .env.example
```

## Local setup

Requirements: Node.js 20+ and MySQL 8+. The current project was verified with Node 24.

MySQL is the database used by the application. Prisma is the typed data-access layer that sends SQL to MySQL; it does not replace MySQL or run a second database.

1. Install packages:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env`, then replace `DATABASE_URL` and `JWT_SECRET`.

   For Review Paper's **Ask AI**, also set `OPENAI_API_KEY` in the server environment and restart the backend. `OPENAI_EXPLANATION_MODEL` defaults to `gpt-4.1-mini` and can be changed to a Responses API model with text and image input. Keep the key server-side; never use a `VITE_` variable for it. Docker Compose forwards these settings from `.env`.

   If Ask AI reports exhausted API credits or a billing limit, check the OpenAI API organization's billing balance and limits for the project associated with the configured key. Provider errors such as `insufficient_quota` / `credit_balance_exhausted` require billing attention; repeatedly clicking Retry will not resolve them. Once credits are available, retry the question. Credential, model-access, rate-limit, timeout, and connection errors have separate inline messages. See [OpenAI error codes](https://developers.openai.com/api/docs/guides/error-codes).

   Review displays separate question cards. Each Ask AI request sends only that question's text, options, images, selected answer, answer key (when present), and existing explanation to OpenAI using the [Responses API](https://developers.openai.com/api/docs/guides/text) with `store: false`. Answers appear under the originating question in the selected English/Hindi language. Generated responses are cached in browser memory for up to one hour while inactive, not saved to the database. The endpoint enforces existing review permissions, limits requests to 10 per minute per client IP, deduplicates simultaneous identical requests within a backend process, and times out provider calls after 60 seconds. Missing configuration or provider failures appear inline with a retry button. No AI request occurs just by opening review.

3. Create an empty MySQL database named `mockmaster`.

   MySQL 8.4+ and MySQL 26.x installations should use a `caching_sha2_password` account. From a MySQL administrator session, create the local development account with:

   ```sql
   CREATE DATABASE IF NOT EXISTS mockmaster
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER IF NOT EXISTS 'mockmaster'@'localhost'
     IDENTIFIED WITH caching_sha2_password BY 'DevOnly_8x7Qp2Lm';
   ALTER USER 'mockmaster'@'localhost'
     IDENTIFIED WITH caching_sha2_password BY 'DevOnly_8x7Qp2Lm';
   GRANT ALL PRIVILEGES ON mockmaster.* TO 'mockmaster'@'localhost';
   ```

   Change the development password in both this SQL and `DATABASE_URL`. Use a strong, unique password outside local development. If the server reports `Unknown authentication plugin sha256_password`, run the `ALTER USER` statement above for the account in `DATABASE_URL`; do not configure the removed legacy plugin.

   The same statements are available as a ready-to-run bootstrap file. From the project root, enter your MySQL administrator password when prompted:

   ```powershell
   Get-Content -LiteralPath 'backend/prisma/mysql-bootstrap.sql' -Raw |
     mysql --protocol=TCP -h 127.0.0.1 -u root -p
   ```

4. Generate the client, create tables, and seed data:

   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

5. Start both applications:

   ```bash
   npm run dev
   ```

Frontend: `http://localhost:5173`  
API: `http://localhost:3000/api`

For a first local bootstrap without a migration, `npm exec -w backend prisma db push` can be used instead of `db:migrate`.

## Environment variables

| Variable          | Example                                                   | Purpose                              |
| ----------------- | --------------------------------------------------------- | ------------------------------------ |
| `DATABASE_URL`    | `mysql://mockmaster:DevOnly_8x7Qp2Lm@localhost:3306/mockmaster` | Prisma/MySQL connection              |
| `JWT_SECRET`      | long random string                                        | JWT signing secret                   |
| `JWT_EXPIRES_IN`  | `8h`                                                      | Token lifetime                       |
| `PORT`            | `3000`                                                    | API port                             |
| `FRONTEND_URL`    | `http://localhost:5173`                                   | Allowed CORS origin                  |
| `VITE_API_URL`    | `http://localhost:3000/api`                               | Browser API base URL                 |
| `UPLOAD_DIR`      | `uploads`                                                 | Stored source documents              |
| `COOKIE_SECURE`   | `false` locally; `true` behind HTTPS                      | Require HTTPS for the session cookie |
| `MAX_UPLOAD_MB`   | `150`                                                     | Paper upload ceiling                 |
| `THROTTLE_TTL_MS` | `60000`                                                   | API rate-limit window                |
| `THROTTLE_LIMIT`  | `180`                                                     | Requests allowed per client/window   |

Never commit a real `.env` file. Use a high-entropy JWT secret and non-default database credentials in production.

## Docker

```bash
docker compose up --build
```

This starts MySQL 8.4, applies the Prisma schema, seeds demonstration data, starts NestJS on port 3000, and serves the built React SPA through Nginx on port 5173.

```bash
docker compose down
docker compose down -v  # also removes local Docker database/upload volumes
```

## Development credentials

| Role          | Email                    | Password      |
| ------------- | ------------------------ | ------------- |
| Administrator | `admin@mockmaster.com`   | `Admin@123`   |
| Student       | `student@mockmaster.com` | `Student@123` |

The seed includes **SSC CGL Full Mock Test 01** with 20 explained questions in English and Hindi across Mathematics, Reasoning, English, and General Knowledge.

## Import formats

CSV/Excel fields are:

`question, question_hi, option_a, option_a_hi, option_b, option_b_hi, option_c, option_c_hi, option_d, option_d_hi, correct_answer, explanation, explanation_hi, subject, subject_hi, topic, topic_hi, difficulty, marks, negative_marks`

Use [docs/import-template.csv](docs/import-template.csv), or download the template from the admin import page. Text PDFs/DOCX files recognize common `Q1.`, `Question 1.`, `A.`, and `(a)` patterns. Scanned PDFs are accepted by the architecture but require a future OCR extraction implementation.

## Commands

```bash
npm run dev          # frontend + backend watch mode
npm run build        # production TypeScript/build verification
npm test             # backend and frontend tests
npm run db:generate  # generate Prisma client
npm run db:migrate   # apply committed migrations to MySQL
npm run db:migrate:dev # create a new migration while changing the schema
npm run db:seed      # load demonstration data
```

## API

See [docs/API.md](docs/API.md) for the endpoint catalog, request example, authorization model, and error envelope.

## Database model

Core relations are represented by `User`, `RoleDefinition`, `UserStatistic`, `Category`, `Subject`, `Topic`, `Exam`, `ExamSettings`, `ExamSection`, `Question`, `QuestionOption`, `Attempt`, `AttemptAnswer`, `PaperImport`, and `ImportedQuestion`. UUIDs are used for domain records and an integer key for the small role lookup. English/Hindi variants remain on the same domain record, so question and option IDs are identical in either language. The schema maps to the requested plural table names and includes foreign keys, uniqueness constraints, compound attempt/order keys, lookup indexes, and timestamps. Aggregate statistics are updated only from server-scored submissions.

## Test coverage

The suite checks authentication behavior, JWT-safe responses, nested exam settings, question validation/creation, attempt creation and authoritative end time, locked backend submission, result calculations, import pattern variants, scoring and negative marking, timer formatting/server time, answer selection/clearing, review marking, navigation bounds, submission counts, bilingual duplication/import mapping, active-attempt answer-key isolation, English fallback, persistent preference, and rapid live language switching without losing answer/timer state.

## Acceptance checklist

- [x] Public landing, registration, login, protected student/admin workspaces, logout
- [x] Secure HTTP-only JWT session, BCrypt passwords, validation, RBAC, CORS, Helmet, throttling
- [x] Categories, subjects, topics, exams, settings, dynamic sections, rich questions, math, and images
- [x] Exam create/edit/delete/duplicate/preview/publish/unpublish with publish validation
- [x] PDF, DOCX, XLSX, CSV, and JSON extraction with warnings and OCR-ready abstraction
- [x] Mandatory editable import review, skip/delete, duplicate keep/replace/skip, and draft confirmation
- [x] Search, filters, sorting, pagination, bulk question deletion, and user activation
- [x] Real CBT timer, palette, auto-save/retry, navigation, clear, mark, resume, and leave warning
- [x] Real-time English/Hindi switching before and during tests with persisted preference and safe English fallback
- [x] Server-owned expiry, answer validation, immutable submission, scoring, negative marks, and attempt limits
- [x] Instant result, donut and section charts, question-wise review, explanations, and review filters
- [x] Attempt history, previous-attempt comparison, score/accuracy/activity trends, and subject/topic insights
- [x] Admin overview, student drill-down, per-exam metrics, question accuracy, and difficulty analysis
- [x] Requested relational MySQL tables, versioned migration, 20-question seed, and aggregate statistics
- [x] Structured exceptions, loading/error/empty states, toasts, accessible dialogs, focus states, and responsive layouts
- [x] Production builds, backend/frontend tests, lint, dependency audit, Docker Compose, API docs, and environment examples

## Production notes and future improvements

- Terminate TLS at a reverse proxy and rotate all example credentials/secrets.
- Replace local upload storage with object storage and malware scanning.
- Add refresh-token rotation, password reset, email verification, and an audit log if the deployment requires long-lived sessions.
- Run imports in a durable queue for large documents; add OCR and an optional AI extraction implementation behind the existing abstraction.
- Add multi-select question types only after extending both scoring rules and option validation.
- Add browser E2E coverage (Playwright), observability, backups, and horizontal API workers for high traffic.

### Moni paper assistant

On a released answer-review page, students can use the separate **Moni** assistant section to ask about that completed paper’s questions, answers, and topics. Moni is not available during a live attempt. The browser sends only the student's question; the server reloads the owned review context and applies the same result-release and review-permission checks as question explanations. Responses are not persisted.

## Screenshot placeholders

- Landing page: `docs/screenshots/landing.png`
- CBT interface: `docs/screenshots/cbt.png`
- Result analysis: `docs/screenshots/result.png`
- Admin import review: `docs/screenshots/import-review.png`
