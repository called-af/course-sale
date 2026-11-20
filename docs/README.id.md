<p align="center">
  <img src="https://img.shields.io/badge/Laravel-12-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Inertia.js-2.0-9553E8?style=for-the-badge&logo=inertia&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
</p>

> Catatan: ini adalah dokumentasi Bahasa Indonesia versi sebelumnya.
> Dokumentasi penjualan/resmi ada di `README.md` (English) dan `docs/QUICKSTART.md`.

# KursusIO — Course Sale Platform

> Platform penjualan kursus online berbasis **Laravel 12 + Inertia.js + React 19** dengan **Sistem Rekomendasi Kursus**, **AI Assistant**, dan **WhatsApp Integration**, serta pembayaran melalui **Midtrans**.

Platform ini menjalankan proses belajar dari **pencarian kurikulum → pembelian → progress → quiz → sertifikat**, sambil menampilkan rekomendasi kursus yang relevan.

---

## Daftar Isi

- [Tentang Platform](#tentang-platform)
- [Fitur Utama](#fitur-utama)
    - [Pembelian, Order, Payment & Refund](#pembelian-order-payment--refund)
    - [Kurikulum & Pembelajaran](#kurikulum--pembelajaran)
    - [Sertifikat](#sertifikat)
    - [Reviews & Comments](#reviews--comments)
    - [Sistem Rekomendasi Kursus](#sistem-rekomendasi-kursus)
    - [AI Assistant](#ai-assistant)
    - [WhatsApp Integration](#whatsapp-integration)
    - [Manajemen Konten & Moderation](#manajemen-konten--moderation)
    - [Landing Page & CMS](#landing-page--cms)
    - [Akun, Profil & Manajemen User](#akun-profil--manajemen-user)
    - [Dashboard & Analitik](#dashboard--analitik)
- [Capability per Role](#capability-per-role)
- [Tech Stack](#tech-stack)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Database Schema](#database-schema)
- [API Routes Reference](#api-routes-reference)
- [Artisan Commands](#artisan-commands)
- [Instalasi & Setup](#instalasi--setup)
- [Struktur Folder](#struktur-folder)
- [Dokumentasi](#dokumentasi)
- [Status Implementasi & Known Limitations](#status-implementasi--known-limitations)

---

## Tentang Platform

**KursusIO** adalah platform SaaS kursus online yang memungkinkan:

1. **Instructor** membuat kursus dari nol (modul → materi → konten → quiz → resource).
2. **Admin** menyetujui dan mempublikasikan kursus, mengelola user, konten, order, dan payout.
3. **Student** membeli/mengikuti kursus, belajar dengan progress tracking, mengerjakan quiz, mendapatkan sertifikat, menulis review, dan berdiskusi.
4. **Sistem rekomendasi** menampilkan kursus yang relevan berdasarkan interaksi dan popularitas, sementara **AI assistant** membantu menjawab pertanyaan pembelajar.

Fokus utama platform: **terjemahan pembelajaran yang terukur** (progress → quiz → sertifikat) dan **pengalaman penemuan kursus** yang relevan.

---

## Fitur Utama

### Pembelian, Order, Payment & Refund

- Pembelian course **gratis** maupun **berbayar** (via Midtrans).
- Student yang membeli course berbayar diarahkan ke halaman **checkout** (`/student/courses/{slug}/checkout`) lalu **payment page** order (`/student/orders/{order_number}`).
- Saat ini hanya tersedia **gateway Midtrans** dengan mata uang **IDR**.
- Payment method yang di-support: **Credit Card, QRIS, Virtual Account, GoPay**.
- Saat checkout, order dibuat dengan status `pending`, `expires_at = now + 24 jam`, dan payment dengan status `pending`.
- Sistem **Midtrans Snap**: membuat transaksi, memeriksa status, refund, cancel/expire.
- **Webhook** Midtrans (`POST /payments/midtrans/webhook`) dengan verifikasi signature `sha512(order_id + status_code + gross_amount + server_key)`, validasi merchant ID, dan amount match.
- Status order: `pending | paid | failed | expired | refunded | chargeback`.
- Status payment: `pending | paid | failed | expired | refunded | partial_refund | chargeback`.
- Admin bisa **konfirmasi manual pembayaran** (`PUT /admin/orders/{order}/pay`) dengan opsi `override` (mis. bypass midtrans).
- Admin bisa **refund** order (`POST /admin/orders/{order}/refund`) — full atau partial, via Midtrans API.
- **Chargeback** otomatis diproses (refund otomatis + revoke enrollment).
- **Payout instructor**: fee platform (default **20%**, configurable 0–100), hold period (default **7 hari**), payout minimum (default **IDR 100.000**), account lock hours (default **24 jam**).
- Payout per kursus dihitung dari `order_items.course_price`; `net = max(0, gross - fee)`.
- Payout dibuat otomatis saat payment `paid` (unique per order-course), tersedia setelah `available_at`.
- Admin proses payout per-instansi (single/batch) dengan readiness check (bank complete, not locked, total available ≥ minimum).
- Refund/chargeback **membatalkan payout** yang masih pending.

### Kurikulum & Pembelajaran

- Course lifecycle: **`draft → review → published`** (status `archived` legacy, tidak dipakai app).
- Syarat publish (`canBePublished`): judul, deskripsi, level, thumbnail, minimal 1 category, dan minimal 1 modul → material → konten published.
- Flow instructor: buat course → isi modul/materi/konten → submit for review → admin approve → published.
- Admin bisa approve (`PUT /admin/courses/{slug}/approve`); instructor submit (`PUT /instructor/courses/{slug}/submit-review`).
- Tidak ada alur "reject" — admin cukup approve atau kembali ke draft via update.
- Struktur hierarki: **Course → Module → Material → MaterialContent** (+ optional QuizQuestion → QuizOption).
- Content types: **`video`, `text`, `quiz`, `file`, `ppt`**.
- Modul/materi/konten punya status `draft | published` dengan gate publishing (modul butuh material published; material butuh konten published; konten quiz butuh ≥1 pertanyaan).
- Reorder module/material/content via move (swap sort_order adjacent).
- File upload (konten ≤ 50 MB, resource ≤ 20 MB, thumbnail ≤ 2 MB, quiz image ≤ 2 MB); external URL atau file.
- Course resources: manual (admin/instructor) + otomatis dari konten `file`/`ppt`. Unlock: full completion untuk manual resource; content/material/course completion untuk otomatis.
- Quiz: tipe **`multiple_choice`**, **`essay`**; minimal 1 pertanyaan; MC wajib ≥2 opsi ≥1 benar; essay tanpa opsi. Submit: semua soal harus dijawab; MC auto-graded; essay → `needs_review` → manual grading oleh instructor/admin.
- Score auto: `round(correct MC / total MC * 100, 2)`; essay graded manual.
- Quiz content selalu ditandai content completed saat submit (apapun hasilnya).
- Progress tracking: **material_content_progress** (content-level) adalah sumber kebenaran. **material_progress** (material-level) adalah catatan turunan/backend-owned yang disinkronkan otomatis saat konten/quiz selesai, saat halaman belajar dimuat, dan dapat direkonsiliasi (termasuk mencabut cache yang tidak lagi tuntas) via perintah `progress:sync-materials`. Progress bar & resume diarahkan oleh progres konten/pemetaan material.
- Learning player (`/student/courses/{slug}`) punya sidebar, content viewer (video/text/file/ppt/quiz), resume dari materi/konten, refund policy notice.
- Enrolled students CSV export (instructor/admin).

### Sertifikat

- Auto-generate sertifikat saat course completion (ketika progress materi/konten mencapai 100%, termasuk melalui sinkronisasi backend), format nomor: **`KRSIO-YYYYMM-XXXXXXXX`**.
- Unik per `(user_id, course_id)`.
- PDF via **barryvdh/laravel-dompdf** (A4 landscape), stored di public disk.
- Template: primary_color, accent_color, bg_style (`dark|light|gradient`), show_signature, signature_name, custom_title, footer_note.
- Admin/instructor CRUD template; save template → regenerate PDF semua sertifikat course.
- Student list & download PDF (`/student/certificates`), public verify (`/certificate/{number}`).
- Full refund **tidak** menghapus sertifikat; progress tetap.

### Reviews & Comments

- Student bisa menulis review setelah **menyelesaikan 100% kursus** (eligible check: enrolled + completed).
- Review menggunakan pola **upsert** (`storeOrUpdate`): 1 review per user per course; POST endpoint menangani create maupun update.
- Rating (1–5) + comment (opsional); `rating_avg` & `rating_count` di-recalculate otomatis saat review dibuat/dihapus.
- Admin moderate review: approve/reject/delete (`GET /admin/reviews`, `PUT .../approve`, `PUT .../reject`, `DELETE ...`).
- Comment thread dengan replies; student bisa post/edit/delete comment milik sendiri.
- Admin moderate comment: approve/reject/delete (`GET /admin/comments`, `PUT .../approve`, `PUT .../reject`, `DELETE ...`).
- Testimonials di landing page diambil dari review yang **approved**.

### Sistem Rekomendasi Kursus

- Engine rekomendasi **Laravel-native** (tanpa layanan eksternal/Python), berbasis sinyal interaksi pengguna dan popularitas kursus.
- Untuk pengguna terautentikasi: rekomendasi **content-based** dari histori interaksi (tag/kategori kursus yang pernah diakses/diikuti), dengan mengecualikan kursus yang sudah di-enroll.
- Untuk pengguna baru/guest atau saat data interaksi terbatas: fallback ke **popular courses** (berdasarkan views/enrollments/rating dalam jendela waktu).
- Event tracking: `course_view`, `course_enroll`, `material_view`, `material_complete`, `quiz_attempt`, `quiz_complete` dengan bobot interaksi yang dapat dikonfigurasi.
- Hasil rekomendasi di-cache (TTL default **2 jam**, cache store mengikuti konfigurasi aplikasi) untuk performa; cache dapat di-invalidasi oleh event/interaksi terkait.
- Master switch: `RECOMMENDATION_ENABLED`; toggle admin: `PATCH /admin/settings/recommendation/toggle` dan `PATCH /admin/integrations/ai/recommendation`.
- Perintah operasional: `php artisan recommendation:status` (cek status engine & uji hasil) dan `php artisan recommendation:seed-events` (seed data event simulasi untuk pengujian).
- Surfaces: student dashboard, katalog kursus (`/course`), `/courses/recommended`, dan tool rekomendasi pada AI assistant.

### AI Assistant

- Chat AI untuk **student & instructor** (`/ai/chat/*`, max **5 sessions** per user, message max **1000 karakter**, context last **20 messages**, temp **0.5**, max_tokens **1024**, tool loop max **5 rounds**, rate limit chat **10/min**, AI settings update **5/min**).
- Provider adapter: **OpenAI, OpenAI-Compatible, Azure OpenAI, Anthropic, Gemini, Cohere, Bedrock, Replicate, Cloudflare** + native presets (Mistral, DeepSeek, xAI Grok, AI21 Labs) dan router/aggregator presets (OpenRouter, NVIDIA NIM, LiteLLM, Vercel AI Gateway, Together AI, Fireworks, Groq, Hugging Face, Cloudflare Workers AI) + custom (Ollama, LM Studio, vLLM, llama.cpp, custom endpoint) dengan registry & orchestrator.
- Konfigurasi provider: API key, base URL, API version, organization ID, project ID, model, custom headers, custom params, timeout, max retries, connection status.
- Manajemen model: auto discovery, manual add, refresh, set default, switch model, capability detection (text generation, streaming, vision, tool calling, structured output, JSON mode, embeddings, audio, image generation).
- Unified AI interface: conversation history, system prompts, user/assistant messages, image attachments, streaming, tool calling, usage/token stats, error handling.
- Tools: **Course Search, Course Detail, Course Comparison, Recommendation, User Progress, Instructor Students, Instructor Analytics** (LearningPath tool dibuat tapi belum terdaftar).
- Admin: CRUD provider, CRUD model, test connection, discover models, set default, global toggle, legacy import, usage/audit logs.
- Credentials disimpan encrypted (`AiProviderCredential`, `AiSetting`), SSRF guard `AI_ALLOW_LOCAL_ENDPOINTS=false`.
- AI calls sinkron; jika AI disabled/tidak ada provider → response **503**.
- Fallback: primary provider + fallback provider (mis. OpenRouter → Groq); fallback hanya saat provider unavailable; idempotency & duplicate protection.

### WhatsApp Integration

- Provider WhatsApp: **Meta, Infobip, Fonnte, Custom** (adapter pattern dengan unified interface); arsitektur mendukung provider masa depan (Twilio, 360Dialog, Bird, Vonage, Wablas, Whapi.Cloud).
- Admin CRUD provider, toggle, set default, test send, message status check, template management, import legacy, global toggle.
- Webhook: `GET /webhooks/whatsapp/{provider}` verify, `POST /webhooks/whatsapp/{provider}` handle; HMAC verification; throttle **120/min**.
- Delivery logs & status (`queued|sent|delivered|read|failed`).
- Notifikasi bisnis: **enrollment → instructor** (job `SendWhatsAppEnrollmentNotificationJob`, retries/backoff/dedup) dan **payout paid → instructor** (job `SendPayoutPaidNotificationJob`).
- Konfigurasi: Meta (Access Token, Phone Number ID, Business Account ID, App Secret, Verify Token, Graph API Version), Infobip (API Key, Base URL, Sender Number, Account Config), Fonnte (API Token, Base URL).

### Manajemen Konten & Moderation

- Admin & instructor: course CRUD, module CRUD, material CRUD, content CRUD (video/text/quiz/file/ppt), quiz CRUD, category/tag CRUD, certificate template.
- Moderation: review approve/reject/delete; comment approve/reject/delete; quiz grading attempts (`needs_review`).
- Export: orders, users, payouts, course students (CSV).

### Landing Page & CMS

- Landing page dengan section: **Hero, About, Courses, Category, Instructors, How It Works, Benefits, Certificate, Testimonials, FAQ, TrustBar/Footer**.
- CMS per section (`LandingSetting`): `hero, about, courses, career, testimonial, cta, footer` — deep merge defaults.
- Testimonials diambil dari **review approved** course (bukan static).
- Featured courses dari course published.

### Akun, Profil & Manajemen User

- Register/login/logout, email verification, forgot/reset password, choose role.
- Profile: avatar, bio (nullable text max 1000), name, email, password, WhatsApp number.
- Admin user CRUD (`/admin/users`) + user export + soft delete (revokes enrollments).
- Admin user profile edit, student/instructor profile edit via shared `UserProfile` form.

### Dashboard & Analitik

- Admin dashboard: total users, courses, active enrollments, revenue; top courses, recent enrollments/courses.
- Instructor dashboard: my courses, students, earnings, rating, recent enrollments, course performance, enrollment activity, AI tools.
- Student dashboard: enrolled courses + progress, stats, recommended courses, continue learning.

---

## Capability per Role

| Capability                                   | Guest | Student | Instructor | Admin |
| -------------------------------------------- | ----- | ------- | ---------- | ----- |
| Landing page & course catalog (browse)       | ✅    | ✅      | ✅         | ✅    |
| Register / login / reset / verify            | —     | ✅      | ✅         | —     |
| Choose role                                  | —     | ✅      | ✅         | —     |
| Browse course detail & AI assistant          | ✅    | ✅      | ✅         | ✅    |
| Enroll (free / paid via checkout)            | —     | ✅      | —          | —     |
| Learning player, progress, quiz, resources   | —     | ✅      | —          | —     |
| Download certificate / verify                | —     | ✅      | —          | —     |
| Write/update/delete review & comments        | —     | ✅      | —          | —     |
| Create / manage own courses                  | —     | —       | ✅         | ✅    |
| Submit course for review                     | —     | —       | ✅         | —     |
| Approve/publish courses                      | —     | —       | —          | ✅    |
| Manage users (CRUD, export, delete)          | —     | —       | —          | ✅    |
| Manage orders/refunds/payouts                | —     | —       | —          | ✅    |
| Moderate reviews/comments                    | —     | —       | —          | ✅    |
| Grade quiz attempts                          | —     | —       | ✅         | ✅    |
| Configure AI / WhatsApp / payments / landing | —     | —       | —          | ✅    |
| Instructor payout settings                   | —     | —       | ✅         | —     |

---

## Tech Stack

| Layer         | Teknologi                                                     |
| ------------- | ------------------------------------------------------------- |
| Backend       | Laravel 12 (PHP 8.2+), Inertia Laravel 2                      |
| Frontend      | React 19, TypeScript 5, Tailwind CSS 4, Motion (motion/react) |
| Bridge        | Inertia.js 2 (SPA tanpa API) + Ziggy                          |
| Database      | MySQL / PostgreSQL (SQLite untuk dev)                         |
| Cache / Queue | Redis / database, Laravel queue                               |
| PDF           | barryvdh/laravel-dompdf                                       |
| Payments      | Midtrans                                                      |
| WhatsApp      | Meta / Infobip / Fonnte / Custom adapters                     |
| Testing       | Pest PHP 4                                                    |

---

## Arsitektur Sistem

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│   React 19 + TypeScript + Tailwind + Motion + Inertia        │
└───────────────────────────────┬──────────────────────────────┘
                                │ Inertia Protocol
                                ▼
┌──────────────────────────────────────────────────────────────┐
│                      LARAVEL 12 BACKEND                      │
│   Controllers → Services → Models (Eloquent) → Form Requests │
│   Policies/Gates → Queue Jobs                                │
└───────────────────────────────┬──────────────────────────────┘
                                │ HTTP (Midtrans / WhatsApp / AI)
                                ▼
┌──────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                     │
│              Midtrans • AI Providers • WhatsApp              │
└──────────────────────────────────────────────────────────────┘
```

---

## Database Schema

| Tabel utama                                                                                                                                        | Deskripsi                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `users`                                                                                                                                            | Admin/instructor/student; `bio`, avatar, whatsapp_number, payout_account_number (encrypted), role, google_id           |
| `courses`                                                                                                                                          | Judul, slug, description, level, type (free/paid), price, status, thumbnail, rating, published/approved_at, creator_id |
| `modules` / `materials` / `material_contents`                                                                                                      | Hierarki kurikulum + content (video/text/quiz/file/ppt)                                                                |
| `material_progress` / `material_content_progress`                                                                                                  | Progress belajar (content-level canonical, material-level derived/synced)                                              |
| `enrollments`                                                                                                                                      | Status `active`, `revoked`, `expired`; unique user+course                                                              |
| `orders` / `order_items` / `payments` / `payment_logs` / `refunds`                                                                                 | Transaksi & pembayaran                                                                                                 |
| `instructor_payouts` / `payout_account_audits`                                                                                                     | Ledger payout instructor                                                                                               |
| `certificates`                                                                                                                                     | Nomor `KRSIO-YYYYMM-XXXXXXXX`, PDF path, template                                                                      |
| `reviews` / `comments` / `rating`                                                                                                                  | Feedback & diskusi                                                                                                     |
| `quiz_questions` / `quiz_options` / `quiz_attempts` / `quiz_answers`                                                                               | Quiz & grading                                                                                                         |
| `user_events`                                                                                                                                      | Event tracking interaksi untuk rekomendasi                                                                             |
| `ai_providers` / `ai_provider_credentials` / `ai_models` / `ai_provider_logs` / `ai_settings` / `ai_setting_audits` / `ai_usage_logs`              | AI integration                                                                                                         |
| `whatsapp_*` (settings, providers, credentials, logs, messages, conversations, contacts, delivery logs, templates, webhooks)                       | WhatsApp integration                                                                                                   |
| `landing_settings`, `payment_settings`, `appearance_settings`, `recommendation_settings`, `categories`, `tags`, `course_categories`, `course_tags` | CMS & platform settings                                                                                                |

---

## API Routes Reference

### Public Routes (No Auth)

| Method | Route                   | Deskripsi                          |
| ------ | ----------------------- | ---------------------------------- |
| GET    | `/`                     | Landing page                       |
| GET    | `/course`               | Course catalog + recommendations   |
| GET    | `/course/{slug}`        | Course detail + reviews + comments |
| GET    | `/courses/recommended`  | Recommendations (JSON/redirect)    |
| GET    | `/certificate/{number}` | Public certificate verification    |
| GET    | `/terms`                | Terms of service                   |
| GET    | `/privacy`              | Privacy policy                     |

### Auth Routes (Guest Only)

| Method | Route                       | Deskripsi                             |
| ------ | --------------------------- | ------------------------------------- |
| GET    | `/login`                    | Login page                            |
| POST   | `/login`                    | Process login (throttle 6/min)        |
| GET    | `/register`                 | Register page                         |
| POST   | `/register`                 | Process registration (throttle 6/min) |
| GET    | `/auth/google`              | Redirect to Google OAuth              |
| GET    | `/auth/google/callback`     | Google OAuth callback                 |
| POST   | `/logout`                   | Logout                                |
| GET    | `/forgot-password`          | Forgot password                       |
| POST   | `/forgot-password`          | Process forgot password               |
| GET    | `/reset-password/{token}`   | Reset password                        |
| POST   | `/reset-password`           | Reset password                        |
| GET    | `/verify-email/{id}/{hash}` | Verify email                          |
| POST   | `/email/resend`             | Resend verification email             |

### Student Routes (`/student/*`)

| Method | Route                                                  | Deskripsi                     |
| ------ | ------------------------------------------------------ | ----------------------------- |
| GET    | `/student/dashboard`                                   | Student dashboard             |
| GET    | `/student/courses`                                     | My enrolled courses           |
| GET    | `/student/courses/{slug}`                              | Learning page                 |
| POST   | `/student/courses/{slug}/progress`                     | Mark material complete        |
| POST   | `/student/courses/{slug}/contents/{content}/complete`  | Mark content complete         |
| GET    | `/student/courses/{slug}/checkout`                     | Checkout (paid course)        |
| POST   | `/student/courses/{slug}/checkout`                     | Create checkout (paid course) |
| GET    | `/student/courses/{slug}/resources/{resource}`         | Download resource             |
| GET    | `/student/courses/{slug}/resources/contents/{content}` | Download automatic content    |
| POST   | `/student/courses/{slug}/quiz/{content}/start`         | Quiz start                    |
| POST   | `/student/courses/{slug}/quiz/{content}/draft`         | Quiz save draft               |
| POST   | `/student/courses/{slug}/quiz/{content}/reset`         | Quiz reset                    |
| POST   | `/student/courses/{slug}/quiz/{content}/submit`        | Quiz submit                   |
| GET    | `/student/certificates`                                | My certificates               |
| GET    | `/student/certificates/{certificate}/download`         | Download certificate          |
| POST   | `/student/courses/{slug}/reviews`                      | Write review                  |
| DELETE | `/student/courses/{slug}/reviews/{review}`             | Delete review                 |
| POST   | `/student/courses/{slug}/comments`                     | Post comment                  |
| PUT    | `/student/courses/{slug}/comments/{comment}`           | Edit comment                  |
| DELETE | `/student/courses/{slug}/comments/{comment}`           | Delete comment                |
| GET    | `/student/orders/{order}`                              | Payment page                  |
| GET    | `/student/profile`                                     | Profile                       |
| PUT    | `/student/profile`                                     | Update profile                |
| PUT    | `/student/settings/whatsapp`                           | WhatsApp settings             |

### Instructor Routes (`/instructor/*`)

| Method | Route                                             | Deskripsi                   |
| ------ | ------------------------------------------------- | --------------------------- |
| GET    | `/instructor/dashboard`                           | Instructor dashboard        |
| GET    | `/instructor/courses`                             | My courses                  |
| POST   | `/instructor/courses`                             | Create course               |
| GET    | `/instructor/courses/{slug}`                      | Course detail               |
| PUT    | `/instructor/courses/{slug}`                      | Update course               |
| DELETE | `/instructor/courses/{slug}`                      | Delete course               |
| PUT    | `/instructor/courses/{slug}/submit-review`        | Submit for review           |
| GET    | `/instructor/courses/{slug}/preview`              | Preview course              |
| GET    | `/instructor/courses/{slug}/certificate-template` | Certificate template        |
| PUT    | `/instructor/courses/{slug}/certificate-template` | Update certificate template |
| PUT    | `/instructor/quiz-attempts/{attempt}/grade`       | Grade essay attempt         |
| GET    | `/instructor/profile`                             | Profile                     |
| PUT    | `/instructor/profile`                             | Update profile              |
| GET    | `/instructor/settings`                            | Instructor settings         |
| PUT    | `/instructor/settings/whatsapp`                   | WhatsApp settings           |
| PUT    | `/instructor/settings/payout`                     | Payout settings             |

### Admin Routes (`/admin/*`)

| Area            | Route                                                                                                                                                                                                                                                                                                                                                                                                                                                | Deskripsi                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Dashboard       | GET `/admin/dashboard`                                                                                                                                                                                                                                                                                                                                                                                                                               | KPIs, top courses, recent lists |
| Courses         | GET/POST `/admin/courses`, GET/PUT/DELETE `/admin/courses/{slug}`, PUT `/admin/courses/{slug}/approve`, GET `/admin/courses/{slug}/preview`, GET/PUT `/admin/courses/{slug}/certificate-template`                                                                                                                                                                                                                                                    | Full course management          |
| Users           | GET `/admin/users`, GET/POST `/admin/users/{user}`, PUT `/admin/users/{user}`, DELETE `/admin/users/{user}`, GET `/admin/users/export`                                                                                                                                                                                                                                                                                                               | User management                 |
| Orders          | GET `/admin/orders`, GET `/admin/orders/{order}`, PUT `/admin/orders/{order}/pay`, POST `/admin/orders/{order}/refund`, GET `/admin/orders/export`                                                                                                                                                                                                                                                                                                   | Order & payment ops             |
| Payouts         | GET `/admin/payouts`, GET `/admin/payouts/{payout}/pay`, PUT `/admin/payouts/batch`, GET `/admin/payouts/export`                                                                                                                                                                                                                                                                                                                                     | Payout processing               |
| Reviews         | GET `/admin/reviews`, PUT `/admin/reviews/{review}/approve`, PUT `/admin/reviews/{review}/reject`, DELETE `/admin/reviews/{review}`                                                                                                                                                                                                                                                                                                                  | Moderation                      |
| Comments        | GET `/admin/comments`, PUT `/admin/comments/{comment}/approve`, PUT `/admin/comments/{comment}/reject`, DELETE `/admin/comments/{comment}`                                                                                                                                                                                                                                                                                                           | Moderation                      |
| Quiz attempts   | GET `/admin/quiz-attempts`, PUT `/admin/quiz-attempts/{attempt}/grade`                                                                                                                                                                                                                                                                                                                                                                               | Essay grading                   |
| Categories/Tags | GET/POST `/admin/categories`, PUT/DELETE `/admin/categories/{category}`; GET/POST `/admin/tags`, PUT/DELETE `/admin/tags/{tag}`                                                                                                                                                                                                                                                                                                                      | Taxonomy                        |
| Landing         | GET/PUT `/admin/settings/landing/{section}`                                                                                                                                                                                                                                                                                                                                                                                                          | CMS landing                     |
| Settings        | GET/PUT `/admin/settings/general`, PATCH `/admin/settings/appearance`, PATCH `/admin/settings/identity`, POST/DELETE `/admin/settings/logo`, GET/PUT `/admin/settings/payment`, PATCH `/admin/settings/ai/toggle`, PUT `/admin/settings/ai`, POST `/admin/settings/ai/verify-password`, PATCH `/admin/settings/recommendation/toggle`, PATCH `/admin/settings/whatsapp/toggle`, PUT `/admin/settings/whatsapp`, POST `/admin/settings/whatsapp/test` | Platform settings               |
| Integrations    | GET/POST `/admin/integrations/ai[...]`, `/admin/integrations/whatsapp[...]`                                                                                                                                                                                                                                                                                                                                                                          | Provider management             |

### AI Routes

| Method | Route                         | Deskripsi                |
| ------ | ----------------------------- | ------------------------ |
| GET    | `/ai/chat/sessions`           | List AI chat sessions    |
| POST   | `/ai/chat`                    | Create AI chat session   |
| GET    | `/ai/chat/{session}`          | Get session              |
| DELETE | `/ai/chat/{session}`          | Delete session           |
| GET    | `/ai/chat/{session}/messages` | List messages            |
| POST   | `/ai/chat/{session}/messages` | Send message (tool loop) |

### WhatsApp & Webhooks

| Method | Route                           | Deskripsi        |
| ------ | ------------------------------- | ---------------- |
| GET    | `/webhooks/whatsapp/{provider}` | Webhook verify   |
| POST   | `/webhooks/whatsapp/{provider}` | Webhook handle   |
| POST   | `/payments/midtrans/webhook`    | Midtrans webhook |

---

## Artisan Commands

### Recommendation Commands

| Command                                  | Deskripsi                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| `php artisan recommendation:status`      | Tampilkan status konfigurasi engine rekomendasi dan uji hasil rekomendasi             |
| `php artisan recommendation:seed-events` | Generate event interaksi simulasi untuk pengujian rekomendasi                         |
| `php artisan progress:sync-materials`    | Rekonsiliasi material-level progress dari content-level (idempotent, backend-derived) |

### Standard & Payment

| Command                                                             | Deskripsi                                        |
| ------------------------------------------------------------------- | ------------------------------------------------ |
| `php artisan orders:expire`                                         | Expirasi pending order (scheduler tiap 10 menit) |
| `php artisan migrate` / `db:seed` / `key:generate` / `storage:link` | Standard Laravel                                 |

---

## Instalasi & Setup

### Prerequisites

- PHP 8.2+, Composer
- Node.js 18+ & npm
- MySQL / PostgreSQL
- Redis (opsional, direkomendasikan untuk cache/queue)
- Midtrans account (payment)

### Step 1: Clone & install

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan storage:link
```

### Step 2: Environment

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=course_sale
DB_USERNAME=root
DB_PASSWORD=

CACHE_STORE=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

RECOMMENDATION_ENABLED=true
RECOMMENDATION_CACHE_TTL=7200

WHATSAPP_PROVIDER=infobip
WHATSAPP_ACCESS_TOKEN=
...

MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_MERCHANT_ID=
MIDTRANS_TIMEOUT=15
```

### Step 3: Run

```bash
composer dev        # Laravel + Queue + Vite + Pail
# atau
php artisan serve
npm run dev
```

Akses: **http://localhost:8000**

---

## Struktur Folder

```
course-sale/
├── app/
│   ├── Console/Commands/          # Artisan commands
│   ├── Http/Controllers/          # API + Web controllers (Admin, Course, Student, Instructor, AI, Payment, WhatsApp, ...)
│   ├── Http/Middleware/, Requests/, Policies/
│   ├── Jobs/                      # WhatsApp notification jobs, event tracking job
│   ├── Models/                    # Eloquent models
│   └── Services/                  # incl. AI/*, WhatsApp/*, Payment/*, RecommendationService
├── database/migrations/, factories/, seeders/
├── resources/js/                  # React + Inertia pages & components
├── routes/web.php
└── ...
```

---

## Dokumentasi

- [Activity Diagram](./docs/activity-diagram.md) — alur setiap fitur, termasuk cabang keputusan, webhook, job, dan temuan audit.
- [Use Case Diagram](./docs/use-case-diagram.md) — aktor, use case, sequence pembayaran, dan state course.
- [PRD](./docs/PRD.md) — kebutuhan produk, kebijakan, dan batasan platform.

---

## Status Implementasi & Known Limitations

- Course approval: tidak ada alur reject (approve only).
- Refund policy hanya informatif di student side; approval refund manual admin.
- AI streaming belum tersedia via endpoint (SSE adapter ada tapi belum dipakai).
- LearningPathTool dibuat tapi belum terdaftar di orchestrator.
- Impersonation, PDF export, WhatsApp notifikasi order/certificate belum ada.
- Progress tracking terdapat dua sistem (material vs content) — perbaikan pada masa depan.
- `role.selected` middleware terdaftar tapi belum dipakai.
- Multi-gateway/multi-currency belum didukung.
- Marketplace multi-instructor belum didukung.

---

## License

MIT License — lihat file [LICENSE](LICENSE) untuk detail.
