# MockMaster REST API

Base URL: `http://localhost:3000/api`. Login establishes the HTTP-only `mockmaster_access` JWT cookie used by the web application. The JWT strategy can also validate an `Authorization: Bearer <jwt>` token issued through a trusted non-browser integration.

## Authentication

| Method | Endpoint         | Access        | Purpose                                          |
| ------ | ---------------- | ------------- | ------------------------------------------------ |
| POST   | `/auth/register` | Public        | Create a student account; accepts optional `preferredLanguage` (`EN`/`HI`) |
| POST   | `/auth/login`    | Public        | Authenticate and establish the secure JWT cookie |
| POST   | `/auth/logout`   | Authenticated | Clear the current session cookie                 |
| GET    | `/auth/me`       | Authenticated | Return the current safe user profile             |

## Student

| Method | Endpoint                        | Purpose                                                  |
| ------ | ------------------------------- | -------------------------------------------------------- |
| GET    | `/student/dashboard`            | Dashboard statistics, available exams, recent attempts   |
| GET    | `/student/categories`           | Categories containing published exams                    |
| GET    | `/student/exams`                | Paginated/filterable published exams                     |
| GET    | `/student/exams/:id`            | Instructions and non-sensitive exam metadata             |
| POST   | `/student/exams/:id/start`      | Create or resume an attempt                              |
| GET    | `/student/attempts/:id`         | Restore an active attempt; answer keys are omitted       |
| POST   | `/student/attempts/:id/answers` | Upsert an answer, review flag, visit state, and position |
| POST   | `/student/attempts/:id/submit`  | Lock and score an attempt on the server                  |
| GET    | `/student/attempts/:id/result`  | Overall and section-wise result                          |
| GET    | `/student/attempts/:id/review`  | Post-submission answer key and explanation review        |
| POST   | `/student/attempts/:id/review/questions/:questionId/explanation` | Explain one question with AI; body `{ "language": "en" }` or `{ "language": "hi" }` (default `en`) |
| GET    | `/student/attempts`             | Attempt history                                          |
| GET    | `/student/performance`          | Score, activity, subject, topic, and weak-area analytics |
| GET    | `/student/profile`              | Safe account profile                                     |
| PATCH  | `/student/profile`              | Update the current student's full name                   |
| PATCH  | `/student/profile/language`     | Persist the current student's `EN`/`HI` preference       |

AI explanation responses contain `{ "questionId": "uuid", "language": "en", "explanation": "Markdown text" }`. The server loads all question context from the owned, submitted attempt; clients cannot supply or override answers. Existing result-release and answer-review restrictions apply. Unknown questions return 404. Unavailable configuration/images, exhausted API credits, invalid provider credentials, unavailable models, and connection failures return 503 with distinct safe messages. Temporary provider rate limits return 429, provider timeouts return 504, and other provider failures return 502. The endpoint is also throttled to 10 requests/minute per client IP (429). Provider credentials, raw error messages, and question content are never included in error diagnostics. AI output never changes the answer key, original explanation, or score.

Answer save body:

```json
{
  "questionId": "uuid",
  "selectedOptionId": "uuid-or-null",
  "markedForReview": false,
  "visited": true,
  "currentQuestion": 3
}
```

Language preference body:

```json
{
  "preferredLanguage": "HI"
}
```

Student exam, attempt, result, review, and performance responses include optional
Hindi fields such as `titleHi`, `textHi`, `nameHi`, and `explanationHi` alongside
their required English values. Clients should fall back to English when a Hindi
value is null or blank. Active-attempt responses include translated question and
option text but omit `isCorrect`, `explanation`, and `explanationHi` until review
is authorized after submission.

## Administrator

| Method         | Endpoint                                | Purpose                                                           |
| -------------- | --------------------------------------- | ----------------------------------------------------------------- |
| GET/POST       | `/admin/exams`                          | List or create exams                                              |
| GET/PUT/DELETE | `/admin/exams/:id`                      | Read, update, or delete an unused exam                            |
| POST           | `/admin/exams/:id/publish`              | Validate and publish an exam                                      |
| POST           | `/admin/exams/:id/unpublish`            | Return an exam to draft                                           |
| POST           | `/admin/exams/:id/duplicate`            | Copy settings, sections, questions, options, and media references |
| GET/POST       | `/admin/exams/:id/sections`             | List or create dynamic exam sections                              |
| PUT/DELETE     | `/admin/exams/:examId/sections/:id`     | Update or remove a section                                        |
| GET            | `/admin/exams/:id/analytics`            | Detailed exam and question performance                            |
| GET/POST       | `/admin/questions`                      | Search or create questions                                        |
| PUT/DELETE     | `/admin/questions/:id`                  | Update or delete a question                                       |
| POST           | `/admin/questions/:id/duplicate`        | Duplicate an editable question                                    |
| POST           | `/admin/questions/bulk-delete`          | Delete selected editable questions                                |
| POST           | `/admin/media`                          | Validate and store a question/option image                        |
| POST           | `/admin/import`                         | Upload and parse a supported paper                                |
| GET            | `/admin/import/template`                | Download the CSV template                                         |
| GET            | `/admin/import/:id/preview`             | Review extracted questions                                        |
| PUT/DELETE     | `/admin/import/:importId/questions/:id` | Correct or remove an extracted question                           |
| POST           | `/admin/import/:id/confirm`             | Add reviewed questions to a draft exam                            |
| GET/POST       | `/admin/categories`                     | List or create categories                                         |
| GET/POST       | `/admin/subjects`                       | List or create subjects                                           |
| PUT/DELETE     | `/admin/subjects/:id`                   | Update or remove an unused subject                                |
| POST           | `/admin/topics`                         | Create a topic                                                    |
| PUT/DELETE     | `/admin/topics/:id`                     | Update or remove an unused topic                                  |
| GET            | `/admin/students`                       | Paginated student management                                      |
| GET            | `/admin/students/:id`                   | Student profile, performance, and test history                    |
| PATCH          | `/admin/students/:id/status/:status`    | Activate or deactivate a student                                  |
| GET            | `/admin/attempts`                       | Paginated attempt monitoring                                      |
| GET            | `/admin/dashboard`                      | Platform summary                                                  |
| GET            | `/admin/analytics`                      | Aggregated exam analytics                                         |

Validation failures and exceptions use a stable response envelope:

```json
{
  "success": false,
  "message": "Exam not found",
  "timestamp": "2026-09-08T10:00:00.000Z",
  "status": 404
}
```
