# Feature Documentation

This index is the entry point for **how each feature works and how to use it**.
Every feature has its own Markdown file in [`features/`](features). All
documents in this section are written in English.

Start with [`QUICKSTART.md`](QUICKSTART.md) for installation, then use the table
below to understand a specific feature.

---

## Feature guides

| # | Feature | Who uses it | Guide |
|---|---------|-------------|-------|
| 1 | Authentication, email verification, Google login, role selection | Guest, Student, Instructor | [authentication.md](features/authentication.md) |
| 2 | Public landing page, editable sections, trust bar, legal pages | Guest, Admin | [landing-page.md](features/landing-page.md) |
| 3 | Course catalogue, course detail, search and filters | Guest, Student | [course-catalog.md](features/course-catalog.md) |
| 4 | Course lifecycle, curriculum authoring, approval, categories and tags | Instructor, Admin | [course-authoring.md](features/course-authoring.md) |
| 5 | Enrollment and Midtrans checkout | Student | [enrollment-and-checkout.md](features/enrollment-and-checkout.md) |
| 6 | Order status, retry, expiry, refunds and chargebacks | Student, Admin | [orders-refunds-and-chargebacks.md](features/orders-refunds-and-chargebacks.md) |
| 7 | Instructor earnings, payout ledger and payout operations | Instructor, Admin | [instructor-payouts.md](features/instructor-payouts.md) |
| 8 | Learning player, progress and resume | Student | [learning-and-progress.md](features/learning-and-progress.md) |
| 9 | Course resources and downloads | Instructor, Admin, Student | [course-resources.md](features/course-resources.md) |
| 10 | Quiz taking and manual grading | Student, Instructor, Admin | [quizzes-and-grading.md](features/quizzes-and-grading.md) |
| 11 | Certificate generation, design, download and verification | Student, Instructor, Admin, Public | [certificates.md](features/certificates.md) |
| 12 | Reviews, comments and moderation | Student, Admin, Public | [reviews-and-comments.md](features/reviews-and-comments.md) |
| 13 | Users, profiles, roles and access control | Admin, all signed-in users | [users-and-access-control.md](features/users-and-access-control.md) |
| 14 | Settings, branding, SEO and payment configuration | Admin | [settings-and-branding.md](features/settings-and-branding.md) |
| 15 | AI assistant chat | Student, Instructor | [ai-assistant.md](features/ai-assistant.md) |
| 16 | AI providers, models and credentials | Admin | [ai-integrations.md](features/ai-integrations.md) |
| 17 | WhatsApp notifications, providers and webhooks | Admin, Instructor, Student | [whatsapp-notifications.md](features/whatsapp-notifications.md) |
| 18 | Recommendation engine | Guest, Student, Admin | [recommendation-engine.md](features/recommendation-engine.md) |
| 19 | Scheduler, queue worker and data retention | Operations | [scheduled-maintenance.md](features/scheduled-maintenance.md) |

---

## How to read a feature guide

Each guide follows the same structure:

1. **Overview** — what the feature does.
2. **Roles** — who can use it.
3. **Flow** — the step-by-step user or system flow.
4. **Rules and guards** — validation, permissions and state transitions.
5. **Where to find it** — UI locations and routes.
6. **Key implementation files** — where to look in the codebase.
7. **Edge cases** — behavior that is easy to miss.
8. **Related guides** — linked features.

Terminology used across guides:

- **Guest** — unauthenticated visitor.
- **Student** — learner with an active enrollment in a course.
- **Instructor** — course author; can manage only their own courses.
- **Admin** — platform operator; can manage all courses, users and settings.
- **Active enrollment** — enrollment with status `active`; this is what grants access.
- **Published content** — a module, material or content block with status `published`.
- **Webhook** — an inbound HTTP call from Midtrans or a WhatsApp provider.
- **Job** — queued background work; requires a running queue worker.

---

## Operational references

These documents are not feature flows, but they are required to run the system:

- [`QUICKSTART.md`](QUICKSTART.md) — local installation and first run.
- [`production-deployment-readiness.md`](production-deployment-readiness.md) — production go-live checklist.
- [`migration-reconciliation.md`](migration-reconciliation.md) — existing database baseline.
- [`midtrans-e2e-validation-checklist.md`](midtrans-e2e-validation-checklist.md) — payment test matrix.
- [`PRD.md`](PRD.md) — product requirements reference.
