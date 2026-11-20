# Product Requirements Document (PRD) — Course Sale Platform

> This document is based on the implementation and the
> [feature documentation](FEATURES.md). For step-by-step usage, use the
> [feature guides](FEATURES.md#feature-guides). This PRD describes product
> policy and scope.

---

## 1. Overview

| Item | Description |
| ---- | ----------- |
| Product | Course Sale Platform — course selling and learning |
| Document version | 1.0 |
| Status | Active, based on the current implementation |
| Owner domain | Product & Engineering |

The platform supports **four primary roles** (**Guest, Student, Instructor,
Admin**) with **AI recommendations**, an **AI assistant**, **WhatsApp
notifications** and **Midtrans payments** as core components.

---

## 2. Problem Statement

1. **Buyers do not trust the curriculum** — without a full preview (syllabus,
   content, progress), purchase conversion is low.
2. **Learners lose momentum** — without measurable progress tracking, drop-off
   is high.
3. **The curriculum is not personal** — without behavior-based recommendations,
   course discovery is less relevant.
4. **Learner–instructor communication is not integrated** — manual WhatsApp
   notifications are not automated.

---

## 3. Goals

- Provide a complete buy → learn → complete → certificate flow.
- Provide personalized course recommendations using a native engine.
- Provide an AI assistant that helps learners and instructors interact with the
  platform.
- Provide business notifications over WhatsApp (enrollment and payout).
- Provide complete admin operations (approval, orders, payouts, moderation).

## 4. Non-Goals (current scope)

- Multi-instructor or marketplace course flow.
- Currencies other than IDR.
- Multiple payment gateways (Midtrans only).
- Subscription or membership model.
- Native mobile app.

---

## 5. Personas

| Persona | Description |
| ------- | ----------- |
| Guest | Public visitor who views the landing page, courses, certificates and AI. |
| Student | Learner who enrolls, studies, takes quizzes, earns certificates, reviews and comments. |
| Instructor | Course author who builds the curriculum, submits courses, manages payouts, WhatsApp and AI tools. |
| Admin | Platform operator who approves courses and manages users, orders, payouts, moderation and configuration. |

---

## 6. User Stories & Acceptance Criteria

### 6.1 Student

| ID | Story | Acceptance criteria |
| -- | ----- | ------------------- |
| US-01 | As a student, I can browse the course catalogue. | Landing, `/course` and `/courses/recommended` show published courses; search and filters work; the AI toggle is available. |
| US-02 | As a student, I can register and buy a course. | Register/login; free → immediate enrollment; paid → checkout → payment → paid order; Midtrans flow. |
| US-03 | As a student, I can learn. | Learning page shows published content; progress is recorded; resources unlock by rule. |
| US-04 | As a student, I can take quizzes. | Start/draft/reset/submit; multiple-choice auto-grading; essay → `needs_review`; manual grading by admin/instructor; quiz content auto-completes. |
| US-05 | As a student, I can earn a certificate. | Completion generates `KRSIO-YYYYMM-XXXXXXXX`; PDF download; public verification. |
| US-06 | As a student, I can review and comment. | Review after 100% completion; one review per user per course; admin approve/reject; comment thread with one reply level; owner can edit/delete. |
| US-07 | As a student, I can use the AI assistant. | Max 5 sessions per user; message max 1000 chars; 20-message context; tool loop of 5; 10 requests/minute; 503 when AI is disabled. |

### 6.2 Instructor

| ID | Story | Acceptance criteria |
| -- | ----- | ------------------- |
| US-08 | As an instructor, I can create a course. | Course must pass `canBePublished()` before submit. |
| US-09 | As an instructor, I can manage the curriculum. | Module/material/content CRUD, publish gates, reorder and resources. |
| US-10 | As an instructor, I can submit a course for admin approval. | Status `draft → review`; admin changes `review → published`. |
| US-11 | As an instructor, I can manage payouts. | Bank fields, fee, hold period, minimum, account lock, readiness and paid notification. |
| US-12 | As an instructor, I can grade essays. | `needs_review` attempts; grade every essay answer; recompute score; mark content complete. |

### 6.3 Admin

| ID | Story | Acceptance criteria |
| -- | ----- | ------------------- |
| US-13 | As an admin, I can approve courses. | Approval requires `canBePublished()`; sets `published_at` and `approved_at`. |
| US-14 | As an admin, I can manage users. | CRUD, CSV export, soft delete with enrollment revocation, bio/avatar edits via profile. |
| US-15 | As an admin, I can manage orders, payments, refunds and payouts. | Midtrans webhook, manual confirmation, refund, chargeback, batch payout and exports. |
| US-16 | As an admin, I can moderate content. | Approve/reject/delete reviews and comments; grade quizzes. |
| US-17 | As an admin, I can configure AI, WhatsApp, payment and landing. | Provider CRUD, toggles, settings and landing sections. |

---

## 7. Functional Requirements

### FR-01 — Authentication and account

- Registration creates a user with a nullable role → choose role at
  `/choose-role` (student/instructor; admin self-service is forbidden).
- Login throttled to 6/minute; email verification and password reset are throttled.
- Profile fields: name, email, bio, avatar, password and WhatsApp number.
- Admin user CRUD, soft delete and enrollment revocation.

### FR-02 — Course lifecycle

- Status flow: `draft → review → published`.
- Publish gate: title, description, level, thumbnail, category and at least one
  published module → material → content path.
- Instructor submits; admin approves; publishing sets `published_at` and
  `approved_at`.

### FR-03 — Course structure and content

- Module/material/content CRUD with publish gates and reordering.
- Content types: `video`, `text`, `quiz`, `file`, `ppt`; upload limits; publish
  gate at each level.
- Quiz authoring (multiple choice/essay), submit rules and auto/manual grading.

### FR-04 — Enrollment, progress, quiz and certificate

- Free enrollment; paid → checkout → payment → activation.
- Progress is content-based in the player and material-based for completion;
  material completion is derived when all published contents are complete.
- Certificate is generated on completion, with a unique number, PDF template,
  public verification and owner-only download.

### FR-05 — Payment, order, refund and payout

- Midtrans only; IDR; methods include credit card, QRIS, virtual account and GoPay.
- Pending order with 24-hour expiry; `orders:expire` scheduler; webhook signature
  verification; manual confirmation; full/partial refund; chargeback handling.
- Payout defaults: 20% fee, 7-day hold, minimum 100000, 24-hour account lock;
  single and batch payout; readiness checks; pending payouts cancelled on refund
  or chargeback.

### FR-06 — Reviews and comments

- Review available after completion; one per user per course; rating recalculated
  on delete.
- Comment threads with one reply level; owner edit/delete; admin moderation.

### FR-07 — AI recommendation

- Event tracking with weights, throttling, cache TTL and popular fallback.
- Admin toggle and status command.
- Surfaced on the dashboard, catalogue and recommended endpoint.
- No external Python service is required for the current implementation.

### FR-08 — AI assistant

- Provider adapter registry; admin provider/model management; chat session
  management; read-only tools; rate limits; global disable; 503 fallback.

### FR-09 — WhatsApp

- Provider adapter registry; webhook verification/HMAC; delivery logs;
  templates; test send; global toggle; enrollment and payout notifications.

### FR-10 — Landing CMS and settings

- Editable landing sections; testimonials from approved reviews; featured
  courses; general, appearance, identity, logo and payment settings.

### FR-11 — Analytics and operations

- Admin dashboard KPIs; instructor KPIs; CSV exports for orders, users, payouts
  and enrolled students.

---

## 8. Non-Functional Requirements

- **Security:** hashed passwords, encrypted API credentials, encrypted and
  masked payout accounts, webhook signature verification and rate limits
  (auth 6/minute, AI messages 10/minute, WhatsApp webhooks 120/minute).
- **Performance:** recommendation cache TTL of 2 hours, view throttling and
  queued background work.
- **Auditability:** AI setting audits, AI provider logs, payout account audits,
  payment logs, refunds and chargeback records.
- **Operations:** queue worker and scheduler are mandatory in production; Redis
  is recommended for higher traffic.

---

## 9. MVP Scope

Implemented: authentication, course lifecycle, curriculum, enrollment, progress,
quizzes, certificates, Midtrans orders/payouts/refunds, reviews/comments, AI
recommendations, AI assistant, WhatsApp notifications, landing CMS, admin
operations and analytics.

## 10. Future Enhancements

- Course rejection flow.
- Public AI streaming chat.
- WhatsApp order and certificate notifications.
- PDF exports for analytics.
- Admin impersonation.
- Multiple gateways and currencies.
- Multi-instructor marketplace.

## 11. Open Questions / Assumptions

- The student-facing refund notice (7 days, ≤25% progress) does not provide a
  self-service refund request endpoint.
- AI streaming is not public.
- Progress systems are kept in sync by scheduled reconciliation.

---

## Related documentation

- [Feature documentation](FEATURES.md)
- [Quickstart](QUICKSTART.md)
