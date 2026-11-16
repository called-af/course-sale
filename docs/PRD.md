# Product Requirements Document (PRD) — KursusIO

> Dokumen ini dibangun berdasarkan **README.md** sebagai source of truth fitur, dan menjadi acuan kebijakan produk (product policy) untuk pengembangan selanjutnya.

---

## 1. Overview

| Item          | Keterangan                                 |
| ------------- | ------------------------------------------ |
| Produk        | KursusIO — platform course sale & learning |
| Versi dokumen | 1.0                                        |
| Status        | Aktif (berdasarkan implementasi saat ini)  |
| Owner domain  | Product & Engineering                      |

Platform menawarkan **empat peran utama** (**Guest, Student, Instructor, Admin**) dengan dukungan **AI Recommendation**, **AI Assistant**, **WhatsApp**, dan **Midtrans** sebagai komponen inti.

---

## 2. Problem Statement

1. **Pembeli tidak percaya pada kurikulum** — tanpa preview menyeluruh (syllabus, konten, progress), konversi beli rendah.
2. **Pembelajar kehilangan momentum** — tanpa progress tracking terukur, drop-off tinggi.
3. **Kurikulum tidak personal** — tanpa rekomendasi berbasis perilaku user, pengenalan kursus kurang relevan.
4. **Komunikasi pembelajar-instruktur belum terintegrasi** — notifikasi manual via WhatsApp belum terhubung otomatis.

---

## 3. Goals

- Menyediakan alur beli → belajar → selesai → sertifikat yang lengkap.
- Menyediakan rekomendasi kursus personal (hybrid ML + native fallback).
- Menyediakan asisten AI yang membantu pembelajar & instruktur berinteraksi dengan fitur platform.
- Menyediakan notifikasi bisnis via WhatsApp (enrollment & payout).
- Menyediakan operasional admin yang lengkap (approval, order, payout, moderation).

## 4. Non-Goals (saat ini)

- Alur kursus dengan multi-instructor / marketplace.
- Multi-currency selain IDR.
- Multiple payment gateway (hanya Midtrans).
- Subscription / membership model.
- Native mobile app.

---

## 5. Personas

| Persona    | Deskripsi                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| Guest      | Pengunjung publik yang ingin melihat landing, kursus, sertifikat, dan AI.                               |
| Student    | End user yang belajar; dapat enroll, belajar, quiz, dapat sertifikat, review, komentar.                 |
| Instructor | Penyusun kursus; dapat membuat kurikulum, submit review, kelola payout, WhatsApp, AI tools.             |
| Admin      | Pengelola platform; approval, user, order, payout, moderation, konfigurasi AI/WhatsApp/payment/landing. |

---

## 6. User Stories & Acceptance Criteria

### 6.1 Student

| ID    | Story                                                    | Acceptance Criteria                                                                                                          |
| ----- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| US-01 | Sebagai student, saya bisa melihat katalog kursus.       | Landing, `/course`, `/courses/recommended` menampilkan course published; search & filter bekerja; AI toggle tersedia.        |
| US-02 | Sebagai student, saya bisa mendaftar dan membeli course. | Register/login; free → enroll langsung; paid → checkout → payment → order paid; Midtrans flow.                               |
| US-03 | Sebagai student, saya bisa belajar.                      | Learning page menampilkan konten published; progress auto; resources unlock sesuai rule.                                     |
| US-04 | Sebagai student, saya bisa mengerjakan quiz.             | Start/draft/reset/submit; MC auto-grade; essay → needs_review; manual grade admin/instructor; quiz content auto-complete.    |
| US-05 | Sebagai student, saya bisa dapat sertifikat.             | Completion → auto-generate `KRSIO-YYYYMM-XXXXXXXX`; download PDF; public verify.                                             |
| US-06 | Sebagai student, saya bisa review & komentar.            | Review setelah eligible (completed); 1 review/user/course; admin approve/reject; comment thread w/ replies; edit/delete own. |
| US-07 | Sebagai student, saya bisa pakai AI assistant.           | Max 5 sessions/user; msg max 1000 char; context 20 msgs; tool loop 5; rate 10/min; 503 saat AI nonaktif.                     |

### 6.2 Instructor

| ID    | Story                                                 | Acceptance Criteria                                                                       |
| ----- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| US-08 | Sebagai instructor, saya bisa membuat kursus.         | Course harus lolos `canBePublished` sebelum submit.                                       |
| US-09 | Sebagai instructor, saya bisa mengelola kurikulum.    | Modul/materi/konten CRUD + publish gates + reorder + resources.                           |
| US-10 | Sebagai instructor, saya bisa submit & admin approve. | Status `draft → review`; admin `review → published`.                                      |
| US-11 | Sebagai instructor, saya bisa kelola payout.          | Bank fields, fee, hold, minimum, lock; readiness; payout paid notification.               |
| US-12 | Sebagai instructor, saya bisa grade essay.            | `needs_review` attempts; grade all essay answers; recompute score; mark content complete. |

### 6.3 Admin

| ID    | Story                                                             | Acceptance Criteria                                                          |
| ----- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| US-13 | Sebagai admin, saya bisa approve kursus.                          | Approve membutuhkan `canBePublished`; set published_at/approved_at.          |
| US-14 | Sebagai admin, saya bisa mengelola user.                          | CRUD, export, soft delete (revoke enrollments), bio/avatar edit via profile. |
| US-15 | Sebagai admin, saya bisa mengelola order/payment/refund/payout.   | Midtrans webhook, manual confirm, refund, chargeback, payout batch, exports. |
| US-16 | Sebagai admin, saya bisa moderate konten.                         | Reviews/comments approve/reject/delete; quiz grading.                        |
| US-17 | Sebagai admin, saya bisa konfigurasi AI/WhatsApp/payment/landing. | Provider CRUD, toggles, settings, landing sections.                          |

---

## 7. Functional Requirements

### FR-01 — Authentication & Account

- Register dengan role nullable → pilih role via `/choose-role` (student/instructor; admin self-service dilarang).
- Login throttle 6/min; email verification & password reset w/ throttle.
- Profile: name/email/bio/avatar/password/whatsapp_number.
- Admin user CRUD + soft delete + enrollments revoke.

### FR-02 — Course Lifecycle

- Status `draft → review → published`.
- Publish gate: title, description, level, thumbnail, category, modul→material→konten published.
- Instructor submit; admin approve; publish sets `published_at`/`approved_at`.

### FR-03 — Course Structure & Content

- Modul/materi/konten CRUD + publish gate + move/reorder.
- Content types: video/text/quiz/file/ppt; upload limits; publish gate per level.
- Quiz authoring (MC/essay), submit rules, auto/manual grading.

### FR-04 — Enrollment, Progress, Quiz, Certificate

- Free enroll; paid → checkout → payment → activate.
- Progress: content-based (player) + material-based (completion); auto material-complete when all contents done.
- Certificate auto-generate on completion; number format; PDF template; public verify; download owner-only.

### FR-05 — Payment, Order, Refund, Payout

- Midtrans only; IDR; methods CC/QRIS/VA/GoPay.
- Order pending + 24h expiry; scheduler `orders:expire`; webhook signature verify; manual confirm; refund full/partial; chargeback handling.
- Payout: fee 20%, hold 7d, min 100k, lock 24h; single/batch payout; readiness; cancel pending on refund/chargeback.

### FR-06 — Reviews & Comments

- Review eligible after completion; 1 per user/course; rating recalc on delete.
- Comments thread; own edit/delete; admin moderate.

### FR-07 — AI Recommendation

- Event tracking + weights + throttle; cache TTL; native fallback; admin toggle; ML pipeline export/train/status/evaluate; surfaces in dashboard/catalog/recommended.

### FR-08 — AI Assistant

- Provider adapter registry; admin provider/model management; chat session management; tools; rate limits; global disable; 503 fallback.

### FR-09 — WhatsApp

- Provider adapter registry; webhook verify/HMAC; delivery logs; templates; test; global toggle; enrollment & payout notifications.

### FR-10 — Landing CMS & Settings

- Landing sections CMS; testimonials from approved reviews; featured courses; general/appearance/identity/logo/payment settings.

### FR-11 — Analytics & Ops

- Admin dashboard KPIs; instructor KPIs; exports (orders/users/payouts/students CSV).

---

## 8. Non-Functional Requirements

- Keamanan: password hashed; API credential encrypted; payout account encrypted+masked; webhook signature verification; rate limits (auth 6/min, AI 10/min, whatsapp webhook 120/min, AI settings 5/min).
- Performa: recommendation cache TTL 2 jam; view throttle 5 min; ML fallback.
- Auditability: ai_setting_audits, ai_provider_logs, payout_account_audits, payment_logs, refunds, chargeback audit.

---

## 9. MVP Scope

Sudah diimplementasikan: auth, course lifecycle, kurikulum, enrollment/progress/quiz/certificate, midtrans orders/payouts/refunds, reviews/comments, AI recommendation + assistant, WhatsApp (partial), landing CMS, admin ops, analytics.

## 10. Future Enhancements

- Reject course flow.
- AI streaming chat.
- WhatsApp notifikasi order/certificate.
- PDF exports.
- Impersonation.
- Multi-gateway/multi-currency.
- Marketplace multi-instructor.

## 11. Open Questions / Assumptions

- Refund policy student-facing (7 hari, ≤25% progress) — belum ada endpoint permintaan refund.
- AI streaming belum public.
- Progress systems consolidation.