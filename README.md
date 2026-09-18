<p align="center">
  <img src="https://img.shields.io/badge/Laravel-12-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Inertia.js-2.0-9553E9?style=for-the-badge&logo=inertia&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-ML_Engine-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
</p>

# KursusIO — Course Sale Platform

> Platform penjualan kursus online berbasis Laravel 12 + Inertia.js + React 19 dengan **AI-Powered Recommendation Engine** menggunakan Python ML Microservice.

---

## Daftar Isi

- [Arsitektur Sistem](#-arsitektur-sistem)
- [Tech Stack](#-tech-stack)
- [Database Schema](#-database-schema)
- [Role & Activity Diagram](#-role--activity-diagram)
  - [Authentication (Semua Role)](#-authentication-semua-role)
  - [Admin](#️-admin)
  - [Instructor](#-instructor)
  - [Student (User)](#-student-user)
  - [AI Recommendation Engine](#-ai-recommendation-engine)
- [API Routes Reference](#-api-routes-reference)
- [Artisan Commands](#-artisan-commands)
- [Instalasi & Setup](#-instalasi--setup)
- [Struktur Folder](#-struktur-folder)

---

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                            │
│                  React 19 + TypeScript + Tailwind                    │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ Inertia.js Protocol
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LARAVEL 12 (PHP Backend)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │ Controllers  │  │  Services    │  │  Models (Eloquent ORM)     │ │
│  │             │  │              │  │                            │ │
│  │ • Auth      │  │ • Course     │  │ • User        • Course     │ │
│  │ • Course    │  │ • Enrollment │  │ • Module      • Material   │ │
│  │ • Enrollment│  │ • Dashboard  │  │ • Enrollment  • Review     │ │
│  │ • Dashboard │  │ • Review     │  │ • Certificate • Comment    │ │
│  │ • Review    │  │ • Comment    │  │ • Quiz*       • Tag        │ │
│  │ • Comment   │  │ • Certificate│  │ • UserEvent   • Category   │ │
│  │ • Tag       │  │ • Quiz       │  │ • Order*      • Payment*   │ │
│  │ • Category  │  │ • EventTrack │  │                            │ │
│  │ • Recommend │  │ • Recommend  │  └────────────────────────────┘ │
│  │ • Certificate  │ • RecommAnal │                                 │
│  └─────────────┘  └──────┬───────┘                                 │
│                          │ HTTP Client                              │
└──────────────────────────┼──────────────────────────────────────────┘
                           │  Fallback: Laravel Native Engine
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│              PYTHON FASTAPI MICROSERVICE (Port 8001)                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │   ML Recommendation Engine                                    │  │
│  │                                                               │  │
│  │   • Collaborative Filtering (User-Item Matrix)                │  │
│  │   • Content-Based Filtering (Tag Cosine Similarity)           │  │
│  │   • Hybrid Scoring (Collab + Content + Popularity)            │  │
│  │   • Cold-Start Handling (Popularity Fallback)                 │  │
│  │                                                               │  │
│  │   Trained Model: recommender_model.pkl                        │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     DATA STORES                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   MySQL /     │  │    Redis     │  │   File Storage           │  │
│  │   PostgreSQL  │  │   (Cache)    │  │   (storage/app/public)   │  │
│  │              │  │              │  │                          │  │
│  │ 26 Tables    │  │ Rec Cache   │  │ • Thumbnails             │  │
│  │              │  │ Throttle    │  │ • Certificates (PDF)     │  │
│  │              │  │              │  │ • ML Datasets (CSV)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Backend** | Laravel 12 (PHP 8.2+) |
| **Frontend** | React 19, TypeScript 5, Tailwind CSS |
| **Bridge** | Inertia.js 2.0 (SPA tanpa API) |
| **ML Engine** | Python 3.11+, FastAPI, scikit-learn, pandas, numpy |
| **Database** | MySQL / PostgreSQL |
| **Cache** | Redis |
| **PDF Generation** | barryvdh/laravel-dompdf |
| **Routing (JS)** | Ziggy (tightenco/ziggy) |
| **Code Generation** | Laravel Blueprint |
| **Testing** | Pest PHP 4, Pytest |
| **Code Style** | Laravel Pint (PHP), ESLint + Prettier (TS) |

---

## Database Schema

### Entity-Relationship Diagram

```
┌───────────┐       ┌──────────────┐       ┌────────────┐
│   Users   │──1:N──│   Courses    │──1:N──│  Modules   │
│           │       │              │       │            │
│ id        │       │ id           │       │ id         │
│ name      │       │ creator_id   │───┐   │ course_id  │
│ email     │       │ title        │   │   │ title      │
│ password  │       │ slug         │   │   │ sort_order │
│ role      │       │ description  │   │   └──────┬─────┘
│ avatar    │       │ thumbnail    │   │          │ 1:N
└─────┬─────┘       │ type (free/  │   │   ┌──────┴─────┐
      │             │       paid)  │   │   │ Materials  │
      │             │ price        │   │   │            │
      │             │ level        │   │   │ id         │
      │             │ status       │   │   │ module_id  │
      │             │ rating_avg   │   │   │ title      │
      │             │ rating_count │   │   │ sort_order │
      │             │ certificate_ │   │   └──────┬─────┘
      │             │   template   │   │          │ 1:N
      │             │ published_at │   │   ┌──────┴─────────┐
      │             │ approved_at  │   │   │ Material       │
      │             └──────┬───────┘   │   │ Contents       │
      │                    │           │   │                │
      │    ┌───────────────┤           │   │ id             │
      │    │               │           │   │ material_id    │
      │    │ M:N           │ M:N       │   │ title          │
      │    ▼               ▼           │   │ type (video/   │
      │ ┌──────────┐ ┌──────────┐     │   │   text/file/   │
      │ │Categories│ │  Tags    │     │   │   ppt/quiz)    │
      │ │          │ │          │     │   │ body           │
      │ │ id       │ │ id       │     │   │ file_path      │
      │ │ name     │ │ name     │     │   │ duration       │
      │ │ slug     │ │ slug     │     │   │ sort_order     │
      │ └──────────┘ └──────────┘     │   └──────┬─────────┘
      │                               │          │ 1:N
      │                               │   ┌──────┴─────────┐
      │ 1:N                           │   │ Quiz Questions │
      ├───────────────────┐           │   │                │
      │                   │           │   │ id             │
      │ ┌─────────────┐   │           │   │ content_id     │
      │ │ Enrollments │   │           │   │ question       │
      │ │             │   │           │   │ type           │
      │ │ id          │   │           │   └──────┬─────────┘
      │ │ user_id  ───┘   │           │          │ 1:N
      │ │ course_id ──────┘           │   ┌──────┴─────────┐
      │ │ status       │              │   │ Quiz Options   │
      │ │ enrolled_at  │              │   │                │
      │ └──────────────┘              │   │ id             │
      │                               │   │ question_id    │
      │ 1:N                           │   │ option_text    │
      ├─────────────────┐             │   │ is_correct     │
      │                 │             │   └────────────────┘
      │ ┌────────────┐  │             │
      │ │  Reviews   │  │             │   ┌────────────────┐
      │ │            │  │             │   │ Quiz Attempts  │
      │ │ id         │  │             │   │                │
      │ │ user_id ───┘  │             │   │ id             │
      │ │ course_id  ───┘             │   │ user_id        │
      │ │ rating  (1-5)│              │   │ content_id     │
      │ │ comment      │              │   │ score          │
      │ │ is_approved  │              │   │ passed         │
      │ │ approved_at  │              │   └────────────────┘
      │ └──────────────┘              │
      │                               │   ┌────────────────┐
      │ 1:N                           │   │ Quiz Answers   │
      ├─────────────────┐             │   │                │
      │                 │             │   │ id             │
      │ ┌────────────┐  │             │   │ attempt_id     │
      │ │  Comments  │  │             │   │ question_id    │
      │ │            │  │             │   │ option_id      │
      │ │ id         │  │             │   │ is_correct     │
      │ │ user_id ───┘  │             │   └────────────────┘
      │ │ course_id  ───┘             │
      │ │ parent_id (self-ref)        │   ┌────────────────┐
      │ │ body         │              │   │ Material       │
      │ │ is_approved  │              │   │ Progress       │
      │ └──────────────┘              │   │                │
      │                               │   │ id             │
      │ 1:N                           │   │ user_id        │
      ├─────────────────┐             │   │ material_id    │
      │                 │             │   │ is_completed   │
      │ ┌──────────────┐│             │   │ completed_at   │
      │ │ Certificates ││             │   └────────────────┘
      │ │              ││             │
      │ │ id           ││             │   ┌────────────────┐
      │ │ user_id ─────┘│             │   │ User Events    │
      │ │ course_id  ───┘             │   │ (AI Tracking)  │
      │ │ certificate_  │             │   │                │
      │ │   number      │             │   │ id             │
      │ │ issued_at     │             │   │ user_id        │
      │ │ pdf_path      │             │   │ course_id      │
      │ └───────────────┘             │   │ material_id    │
      │                               │   │ event_type     │
      │ 1:N                           │   │ metadata (JSON)│
      └─────────────────────────────────→ └────────────────┘
```

### Daftar Tabel (32 Migrasi)

| Tabel | Deskripsi |
|-------|-----------|
| `users` | Data pengguna (admin, instructor, student) |
| `courses` | Data kursus (judul, harga, level, status, rating) |
| `course_categories` | Pivot many-to-many Course ↔ Category |
| `course_tags` | Pivot many-to-many Course ↔ Tag |
| `categories` | Kategori kursus |
| `tags` | Tag/label untuk kursus |
| `modules` | Modul dalam kursus (bab/chapter) |
| `materials` | Materi dalam modul (lesson/subbab) |
| `material_contents` | Konten materi (video, teks, file, PPT, quiz) |
| `material_progress` | Progress belajar per materi per user |
| `enrollments` | Data enrollment student ke kursus |
| `reviews` | Review & rating dari student |
| `comments` | Diskusi/komentar per kursus (support reply) |
| `certificates` | Sertifikat kelulusan kursus |
| `quiz_questions` | Pertanyaan quiz |
| `quiz_options` | Pilihan jawaban quiz |
| `quiz_attempts` | Percobaan quiz oleh student |
| `quiz_answers` | Jawaban student per pertanyaan |
| `user_events` | Event tracking untuk AI recommendation |
| `orders` | Data order pembelian (model ready, belum aktif) |
| `order_items` | Item dalam order |
| `payments` | Data pembayaran |
| `payment_logs` | Log aktivitas pembayaran |
| `payment_methods` | Metode pembayaran |
| `payment_providers` | Provider pembayaran (Midtrans, dll) |
| `refunds` | Data refund |
| `sessions` | Laravel session storage |
| `cache` | Laravel cache storage |

---

## Role & Activity Diagram

Platform ini memiliki **3 role utama** dan **1 sistem AI** yang bekerja secara otomatis:

| Role | Deskripsi |
|------|-----------|
| **Admin** | Mengelola seluruh platform: approval kursus, moderasi konten, manajemen user |
| **Instructor** | Membuat & mengelola kursus, memonitor performa |
| **Student** | Belajar, enroll kursus, quiz, review, sertifikat |
| **AI Engine** | Memberikan rekomendasi kursus secara personalized |

---

### Authentication (Semua Role)

```
┌──────────────────────────────────────────────────────────┐
│                   AUTHENTICATION FLOW                     │
└──────────────────────────────────────────────────────────┘

  ┌─────────┐     ┌──────────┐     ┌─────────────┐
  │  Guest  │────▶│ Register │────▶│ Choose Role │
  │         │     │          │     │             │
  │         │     │ • name   │     │ ○ Admin     │
  │         │     │ • email  │     │ ○ Instructor│
  │         │     │ • pass   │     │ ○ Student   │
  └────┬────┘     └──────────┘     └──────┬──────┘
       │                                   │
       │          ┌──────────┐             │
       └─────────▶│  Login   │             │
                  │          │             ▼
                  │ • email  │     ┌───────────────┐
                  │ • pass   │────▶│ Role-based    │
                  └──────────┘     │ Dashboard     │
                                   │ Redirect      │
                                   │               │
                                   │ admin ──▶ /admin/dashboard
                                   │ instructor ──▶ /instructor/dashboard
                                   │ student ──▶ /student/dashboard
                                   └───────────────┘
```

**Routes:**
| Method | Route | Deskripsi |
|--------|-------|-----------|
| `GET` | `/login` | Tampilkan halaman login |
| `POST` | `/login` | Proses login |
| `GET` | `/register` | Tampilkan halaman register |
| `POST` | `/register` | Proses registrasi |
| `POST` | `/logout` | Logout user |
| `GET` | `/choose-role` | Pilih role setelah login |
| `POST` | `/choose-role` | Simpan pilihan role |

---

### Admin

Admin adalah **super user** yang mengelola seluruh platform. Berikut semua aktivitas yang bisa dilakukan admin:

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN ACTIVITY DIAGRAM                      │
└─────────────────────────────────────────────────────────────────┘

                          ┌──────────────┐
                          │ Admin Login  │
                          └──────┬───────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │   Admin Dashboard     │
                     │                       │
                     │ KPI Metrics:          │
                     │ • Total Users         │
                     │ • Total Courses       │
                     │ • Active Enrollments  │
                     │ • Revenue             │
                     │                       │
                     │ Widgets:              │
                     │ • Top 5 Courses       │
                     │ • Recent Enrollments  │
                     │ • Recent Courses      │
                     └───────────┬───────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
          ▼                      ▼                      ▼
  ┌───────────────┐   ┌──────────────────┐   ┌──────────────────┐
  │ Course        │   │ Content          │   │ User & Review    │
  │ Management    │   │ Management       │   │ Management       │
  └───────┬───────┘   └────────┬─────────┘   └────────┬─────────┘
          │                    │                       │
          ▼                    ▼                       ▼
┌─────────────────┐  ┌─────────────────┐    ┌─────────────────┐
│ • List Courses  │  │ • CRUD Category │    │ • List Users    │
│   (semua status)│  │ • CRUD Tags     │    │ • View User     │
│ • Create Course │  └─────────────────┘    │ • Update User   │
│ • View/Edit     │                         │                 │
│ • Delete Course │                         │ • Moderate      │
│ • Preview       │                         │   Reviews       │
│ • Approve &     │                         │   (approve/     │
│   Publish       │                         │    reject/      │
│ • Set Certificate                         │    delete)      │
│   Template      │                         │                 │
│                 │                         │ • Moderate      │
│ Module CRUD:    │                         │   Comments      │
│ • Add Module    │                         │   (approve/     │
│ • Edit Module   │                         │    reject/      │
│ • Delete Module │                         │    delete)      │
│ • Reorder Module│                         └─────────────────┘
│                 │
│ Material CRUD:  │
│ • Add Material  │
│ • Edit Material │
│ • Delete Material
│ • Reorder       │
│                 │
│ Content CRUD:   │
│ • Add Content   │
│   (video/text/  │
│    file/ppt/    │
│    quiz)        │
│ • Edit Content  │
│ • Delete Content│
│ • Reorder       │
│                 │
│ Quiz CRUD:      │
│ • Add Questions │
│ • Edit Questions│
│ • Delete Ques.  │
│ • Set Options   │
│ • Mark Correct  │
└─────────────────┘
```

#### Admin Activity Detail

| # | Aktivitas | Deskripsi | Route |
|---|-----------|-----------|-------|
| 1 | **Dashboard** | Melihat KPI: total users, courses, enrollments, revenue. Lihat top courses & recent enrollments. | `GET /admin/dashboard` |
| 2 | **List Courses** | Melihat semua kursus di platform (semua status: draft, review, published) dengan pagination. | `GET /admin/courses` |
| 3 | **Create Course** | Membuat kursus baru (judul, deskripsi, thumbnail, level, tipe, harga, kategori, tags). | `POST /admin/courses` |
| 4 | **View Course** | Melihat detail kursus beserta modul, materi, dan konten. | `GET /admin/courses/{slug}` |
| 5 | **Edit Course** | Mengubah informasi kursus. | `PUT /admin/courses/{slug}` |
| 6 | **Delete Course** | Menghapus kursus (soft delete, termasuk semua modul & materi). | `DELETE /admin/courses/{slug}` |
| 7 | **Preview Course** | Preview kursus sebagai tampilan learning page. | `GET /admin/courses/{slug}/preview` |
| 8 | **Approve & Publish** | Menyetujui kursus dari instructor (status: review → published). | `PUT /admin/courses/{slug}/approve` |
| 9 | **Certificate Template** | Mengatur template sertifikat kursus (warna, tanda tangan, teks). | `GET/PUT /admin/courses/{slug}/certificate-template` |
| 10 | **Module CRUD** | Membuat, mengedit, menghapus, dan reorder modul dalam kursus. | `POST/PUT/DELETE /admin/courses/{slug}/modules/{module}` |
| 11 | **Material CRUD** | Membuat, mengedit, menghapus, dan reorder materi dalam modul. | `POST/PUT/DELETE .../modules/{module}/materials/{material}` |
| 12 | **Content CRUD** | Membuat konten materi (video, teks, file, PPT, quiz). | `POST/PUT/DELETE .../materials/{material}/contents/{content}` |
| 13 | **Quiz CRUD** | Membuat pertanyaan quiz, opsi jawaban, dan menandai jawaban benar. | `GET/POST/PUT/DELETE .../contents/{content}/quiz-questions` |
| 14 | **Category CRUD** | Membuat, mengedit, dan menghapus kategori kursus. | `GET/POST/PUT/DELETE /admin/categories` |
| 15 | **Tag CRUD** | Membuat, mengedit, dan menghapus tag kursus. | `GET/POST/PUT/DELETE /admin/tags` |
| 16 | **User Management** | Melihat daftar user, detail user, dan update data user. | `GET /admin/users` |
| 17 | **Review Moderation** | Melihat semua review, approve, reject, atau hapus review. | `GET/PUT/DELETE /admin/reviews` |
| 18 | **Comment Moderation** | Melihat semua komentar, approve, reject, atau hapus komentar. | `GET/PUT/DELETE /admin/comments` |

---

### Instructor

Instructor membuat dan mengelola kursus mereka sendiri. Kursus harus di-approve oleh admin sebelum bisa diakses student.

```
┌─────────────────────────────────────────────────────────────────┐
│                   INSTRUCTOR ACTIVITY DIAGRAM                    │
└─────────────────────────────────────────────────────────────────┘

                      ┌──────────────────┐
                      │ Instructor Login │
                      └────────┬─────────┘
                               │
                               ▼
                  ┌────────────────────────┐
                  │  Instructor Dashboard  │
                  │                        │
                  │  Stats:                │
                  │  • My Courses (list)   │
                  │  • Total Students      │
                  │  • Total Earnings      │
                  │  • Average Rating      │
                  │  • Recent Enrollments  │
                  └────────────┬───────────┘
                               │
               ┌───────────────┼───────────────┐
               │               │               │
               ▼               ▼               ▼
      ┌────────────┐  ┌────────────────┐  ┌──────────────┐
      │ Create New │  │ Manage My      │  │ Certificate  │
      │ Course     │  │ Courses        │  │ Template     │
      └─────┬──────┘  └───────┬────────┘  └──────┬───────┘
            │                 │                   │
            ▼                 ▼                   ▼
   ┌─────────────────┐ ┌──────────────┐  ┌──────────────────┐
   │ Fill Course Info│ │ View Detail  │  │ Customize cert   │
   │                 │ │ Edit Course  │  │ colors, text,    │
   │ • Title         │ │ Delete Course│  │ signature        │
   │ • Description   │ │ Preview      │  └──────────────────┘
   │ • Thumbnail     │ └──────┬───────┘
   │ • Level         │        │
   │ • Type & Price  │        ▼
   │ • Categories    │ ┌───────────────────────────────────────┐
   │ • Tags          │ │        COURSE LIFECYCLE               │
   └────────┬────────┘ │                                       │
            │          │  ┌───────┐  submit   ┌────────┐       │
            └─────────▶│  │ DRAFT │──────────▶│ REVIEW │       │
                       │  └───────┘  for      └───┬────┘       │
                       │     ▲       review       │            │
                       │     │                    │ admin      │
                       │     │ reject             │ approve    │
                       │     │                    ▼            │
                       │     │              ┌───────────┐      │
                       │     └──────────────│ PUBLISHED │      │
                       │                    └───────────┘      │
                       └───────────────────────────────────────┘
```

#### Instructor Activity Detail

| # | Aktivitas | Deskripsi | Route |
|---|-----------|-----------|-------|
| 1 | **Dashboard** | Melihat daftar kursus sendiri, total students, earnings, average rating, dan recent enrollments. | `GET /instructor/dashboard` |
| 2 | **List My Courses** | Melihat semua kursus yang dibuat (filter by status). | `GET /instructor/courses` |
| 3 | **Create Course** | Membuat kursus baru dengan informasi lengkap. | `POST /instructor/courses` |
| 4 | **View Course Detail** | Melihat detail kursus beserta struktur modul & materi. | `GET /instructor/courses/{slug}` |
| 5 | **Edit Course** | Mengubah informasi kursus (hanya course milik sendiri). | `PUT /instructor/courses/{slug}` |
| 6 | **Delete Course** | Menghapus kursus milik sendiri. | `DELETE /instructor/courses/{slug}` |
| 7 | **Preview Course** | Preview kursus dalam tampilan learning page sebelum publish. | `GET /instructor/courses/{slug}/preview` |
| 8 | **Submit for Review** | Mengirim kursus ke admin untuk direview & di-approve. Syarat: title, description, level, thumbnail, minimal 1 modul, dan minimal 1 kategori harus terisi. | `PUT /instructor/courses/{slug}/submit-review` |
| 9 | **Certificate Template** | Mengatur desain sertifikat: warna primer, warna aksen, style background, tanda tangan, judul custom, dan catatan footer. | `GET/PUT /instructor/courses/{slug}/certificate-template` |

#### Course Approval Flow

```
Instructor                    Admin                      Platform
    │                           │                           │
    │  1. Create course (draft) │                           │
    │──────────────────────────▶│                           │
    │                           │                           │
    │  2. Add modules,          │                           │
    │     materials, content    │                           │
    │──────────────────────────▶│                           │
    │                           │                           │
    │  3. Submit for review     │                           │
    │──────────────────────────▶│                           │
    │                           │                           │
    │                           │  4. Review course         │
    │                           │     (check quality)       │
    │                           │                           │
    │                           │  5a. Approve ────────────▶│  Status: published
    │                           │                           │  Visible to students
    │                           │                           │
    │                           │  5b. Reject ─────────────▶│  Status: back to draft
    │                           │                           │
```

---

### Student (User)

Student adalah pengguna utama platform yang belajar melalui kursus online.

```
┌─────────────────────────────────────────────────────────────────┐
│                    STUDENT ACTIVITY DIAGRAM                       │
└─────────────────────────────────────────────────────────────────┘

                      ┌────────────────┐
                      │ Student Login  │
                      └───────┬────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │   Student Dashboard    │
                 │                        │
                 │ • Enrolled Courses     │
                 │   (with progress bar)  │
                 │ • Total Completed      │
                 │ • Overall Progress %   │
                 │ • Completed Materials  │
                 │ • Learning Minutes     │
                 │ • AI Recommended       │
                 │   Courses              │
                 └───────────┬────────────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       │                     │                     │
       ▼                     ▼                     ▼
┌──────────────┐   ┌──────────────────┐   ┌────────────────┐
│ Browse       │   │ My Learning      │   │ My             │
│ Course       │   │                  │   │ Certificates   │
│ Catalog      │   │                  │   │                │
└──────┬───────┘   └────────┬─────────┘   └───────┬────────┘
       │                    │                      │
       ▼                    ▼                      ▼
┌──────────────┐   ┌──────────────────┐   ┌────────────────┐
│ • Search     │   │ Continue         │   │ • View List    │
│ • Filter     │   │ Learning         │   │ • Download PDF │
│   (level,    │   │                  │   └────────────────┘
│    type,     │   │ ┌──────────────┐ │
│    category) │   │ │ Content      │ │
│ • Toggle AI  │   │ │ Viewer       │ │
│   Recommend  │   │ │              │ │
└──────┬───────┘   │ │ • Video      │ │
       │           │ │ • Text       │ │
       ▼           │ │ • File       │ │
┌──────────────┐   │ │ • PPT        │ │
│ Course       │   │ │ • Quiz       │ │
│ Detail Page  │   │ └──────┬───────┘ │
│              │   │        │         │
│ • Info       │   │        ▼         │
│ • Syllabus   │   │ ┌──────────────┐ │
│ • Reviews    │   │ │ Mark as      │ │
│ • Comments   │   │ │ Complete     │ │
│ • Tags       │   │ └──────┬───────┘ │
│              │   │        │         │
│ [Enroll Now] │   │        ▼         │
└──────┬───────┘   │ ┌──────────────┐ │
       │           │ │ 100% Done?   │ │
       ▼           │ │              │ │
┌──────────────┐   │ │ YES ──▶ Auto │ │
│ Enrolled!    │   │ │ generate     │ │
│              │───▶ │ Certificate  │ │
│ Start        │   │ └──────────────┘ │
│ Learning     │   └──────────────────┘
└──────────────┘

       ┌─────────────────────────────────┐
       │     REVIEW & DISCUSSION         │
       │                                 │
       │  After enrolling, student can:  │
       │                                 │
       │  Write Review (1-5 rating)   │
       │  Update own review           │
       │  Delete own review           │
       │                                 │
       │  Post comment / discussion   │
       │  Reply to comments           │
       │  Edit own comments           │
       │  Delete own comments         │
       └─────────────────────────────────┘
```

#### Student Activity Detail

| # | Aktivitas | Deskripsi | Route |
|---|-----------|-----------|-------|
| 1 | **Dashboard** | Melihat enrolled courses dengan progress bar, total completed, learning minutes, dan AI recommended courses. | `GET /student/dashboard` |
| 2 | **Browse Catalog** | Menjelajahi semua kursus published dengan search & filter (level, type, tags). Toggle mode AI recommendation. | `GET /course` |
| 3 | **View Course Detail** | Melihat detail kursus: deskripsi, instructor, level, harga, silabus, reviews, komentar. | `GET /course/{slug}` |
| 4 | **Enroll Course** | Mendaftar ke kursus gratis (kursus berbayar belum aktif). | `POST /course/{slug}/enroll` |
| 5 | **My Courses** | Melihat daftar kursus yang sudah di-enroll. | `GET /student/courses` |
| 6 | **Learning Page** | Mengakses halaman belajar: konten viewer (video/text/file/ppt/quiz), sidebar navigasi, progress tracking. | `GET /student/courses/{slug}` |
| 7 | **Mark Progress** | Menandai materi sebagai selesai. Progress dihitung dari total materi yang selesai. | `POST /student/courses/{slug}/progress` |
| 8 | **Submit Quiz** | Mengerjakan quiz dan melihat hasil (score & passed/failed). | `POST /student/courses/{slug}/quiz/{content}/submit` |
| 9 | **Auto Certificate** | Ketika 100% materi selesai, sertifikat PDF otomatis di-generate dengan nomor unik (format: `KRSIO-YYYYMM-XXXXXXXX`). | Otomatis saat progress 100% |
| 10 | **My Certificates** | Melihat daftar sertifikat yang sudah didapat. | `GET /student/certificates` |
| 11 | **Download Certificate** | Mengunduh sertifikat dalam format PDF. | `GET /student/certificates/{id}/download` |
| 12 | **Write Review** | Menulis review & rating (1-5 bintang) untuk kursus yang sudah di-enroll. Satu review per user per course. | `POST /student/courses/{slug}/reviews` |
| 13 | **Delete Review** | Menghapus review milik sendiri. | `DELETE /student/courses/{slug}/reviews/{review}` |
| 14 | **Post Comment** | Menulis komentar/diskusi di kursus (top-level atau reply). Hanya enrolled student yang bisa berkomentar. | `POST /student/courses/{slug}/comments` |
| 15 | **Edit Comment** | Mengubah komentar milik sendiri. | `PUT /student/courses/{slug}/comments/{comment}` |
| 16 | **Delete Comment** | Menghapus komentar milik sendiri. | `DELETE /student/courses/{slug}/comments/{comment}` |

#### Learning Flow Detail

```
Student membuka course ──▶ Load Learning Page
                           │
                           ├──▶ Sidebar: Module list + Material list
                           ├──▶ Content Viewer (multi-type):
                           │    ├── Video Player
                           │    ├── Rich Text
                           │    ├── File Download
                           │    ├── PPT Viewer
                           │    └── Quiz Interface
                           │
                           ├──▶ Progress Tracking:
                           │    └── Mark material complete ──▶ Progress bar updates
                           │                                       │
                           │                                       ▼
                           │                                  All materials done?
                           │                                       │
                           │                              YES ─────┴───── NO
                           │                               │               │
                           │                               ▼               │
                           │                    Auto-generate          Continue
                           │                    Certificate PDF        Learning
                           │                    (DomPDF)
                           │
                           ├──▶ Quiz Submission:
                           │    └── Submit answers ──▶ Calculate score
                           │                          ──▶ Save attempt
                           │                          ──▶ Track event (AI)
                           │
                           ├──▶ Discussion Tab:
                           │    ├── Post comment
                           │    └── Reply to comment
                           │
                           └──▶ Review Tab:
                                ├── Write/Update review
                                └── View all reviews + rating stats
```

---

### AI Recommendation Engine

Sistem rekomendasi KursusIO menggunakan **arsitektur hybrid dual-engine** dengan automatic fallback:

```
┌─────────────────────────────────────────────────────────────────────┐
│                  AI RECOMMENDATION ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────┐
  │                   EVENT TRACKING LAYER                         │
  │                                                                │
  │  User actions yang di-track untuk AI:                          │
  │                                                                │
  │  ┌──────────────────┬──────────┬──────────────────────────┐   │
  │  │ Event Type       │ Weight   │ Trigger                  │   │
  │  ├──────────────────┼──────────┼──────────────────────────┤   │
  │  │ course_view      │ 1.0      │ View course detail page  │   │
  │  │ course_enroll    │ 5.0      │ Enroll to a course       │   │
  │  │ material_view    │ 2.0      │ Open a material/lesson   │   │
  │  │ material_complete│ 4.0      │ Mark material done       │   │
  │  │ quiz_attempt     │ 3.0      │ Submit quiz answers      │   │
  │  │ quiz_complete    │ 4.0      │ Complete quiz (passed)   │   │
  │  └──────────────────┴──────────┴──────────────────────────┘   │
  │                                                                │
  │  Features:                                                     │
  │  • Throttling: course_view & material_view dibatasi            │
  │    1x per 5 menit untuk mencegah spam event                    │
  │  • Auto-invalidate: recommendation cache dihapus saat          │
  │    terjadi event signifikan (enroll, complete, quiz)            │
  └────────────────────────────────────────────────────────────────┘
                                │
                                ▼
  ┌────────────────────────────────────────────────────────────────┐
  │              DUAL-ENGINE RECOMMENDATION SYSTEM                 │
  │                                                                │
  │  ┌────────────────────────────────────────────────────────┐   │
  │  │  ENGINE 1: Python FastAPI ML Microservice (Primary)    │   │
  │  │                                                        │   │
  │  │  Algoritma:                                            │   │
  │  │  ┌──────────────────────────────────────────────────┐  │   │
  │  │  │ 1. Collaborative Filtering                       │  │   │
  │  │  │    • User-Item interaction matrix                 │  │   │
  │  │  │    • Implicit feedback (weighted events)          │  │   │
  │  │  │                                                   │  │   │
  │  │  │ 2. Content-Based Filtering                        │  │   │
  │  │  │    • Tag cosine similarity                        │  │   │
  │  │  │    • Course-Course similarity matrix              │  │   │
  │  │  │                                                   │  │   │
  │  │  │ 3. Hybrid Scoring                                 │  │   │
  │  │  │    score = Σ(sim × weight) + (popularity × 0.1)   │  │   │
  │  │  │                                                   │  │   │
  │  │  │ 4. Popularity Backfill                            │  │   │
  │  │  │    If hybrid < limit, fill with popular courses   │  │   │
  │  │  └──────────────────────────────────────────────────┘  │   │
  │  │                                                        │   │
  │  │  Endpoints:                                            │   │
  │  │  • GET  /api/v1/health                                 │   │
  │  │  • GET  /api/v1/recommendations/guest?limit=N          │   │
  │  │  • GET  /api/v1/recommendations/user/{id}?limit=N      │   │
  │  │  • POST /api/v1/recommend {user_id, limit}             │   │
  │  │  • POST /course {user_id, limit}                       │   │
  │  └────────────────────────────────────────────────────────┘   │
  │                         │                                      │
  │                    FAIL │ (timeout / offline)                   │
  │                         ▼                                      │
  │  ┌────────────────────────────────────────────────────────┐   │
  │  │  ENGINE 2: Laravel Native Engine (Fallback)            │   │
  │  │                                                        │   │
  │  │  Algoritma:                                            │   │
  │  │  ┌──────────────────────────────────────────────────┐  │   │
  │  │  │ 1. Content-Based Filtering (Tag Overlap)         │  │   │
  │  │  │    • Hitung tag preference dari interaction       │  │   │
  │  │  │    • Score candidate courses by tag match         │  │   │
  │  │  │                                                   │  │   │
  │  │  │ 2. Popularity Fallback                            │  │   │
  │  │  │    • Composite: views × 1.5 + enrolls × 3.0      │  │   │
  │  │  │                   + rating × 2.0                  │  │   │
  │  │  │    • Window: 30 hari terakhir                     │  │   │
  │  │  │                                                   │  │   │
  │  │  │ 3. Cold-Start Handling                            │  │   │
  │  │  │    • User baru tanpa event → popular courses      │  │   │
  │  │  │    • Guest → popular courses                      │  │   │
  │  │  └──────────────────────────────────────────────────┘  │   │
  │  └────────────────────────────────────────────────────────┘   │
  └────────────────────────────────────────────────────────────────┘
                                │
                                ▼
  ┌────────────────────────────────────────────────────────────────┐
  │                    CACHING LAYER (Redis)                        │
  │                                                                │
  │  Cache Key Pattern:                                            │
  │  • recommendations:user:{id}:limit:{n}   (TTL: 2 hours)       │
  │  • recommendations:guest:limit:{n}       (TTL: 2 hours)       │
  │                                                                │
  │  Auto-invalidation on:                                         │
  │  • course_enroll event                                         │
  │  • material_complete event                                     │
  │  • quiz_complete event                                         │
  └────────────────────────────────────────────────────────────────┘
```

#### Recommendation Data Pipeline

```
┌──────────────────────────────────────────────────────────────────────┐
│                    ML TRAINING PIPELINE                               │
│                                                                      │
│  Step 1: Export Data (Laravel → CSV)                                 │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  php artisan recommendation:export                           │    │
│  │                                                              │    │
│  │  Output files:                                               │    │
│  │  • storage/app/ml/events.csv          (raw user events)      │    │
│  │  • storage/app/ml/user_item_matrix.csv (weighted pairs)      │    │
│  │  • storage/app/ml/courses.csv         (course catalog+tags)  │    │
│  │  • storage/app/ml/dataset_summary.json (analytics + gate)    │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  Step 2: Gate Check (ML Readiness Evaluation)                        │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Criteria:                                                   │    │
│  │  ✓ Total events ≥ 100                                        │    │
│  │  ✓ Active users ≥ 10                                         │    │
│  │  ✓ ≥ 50% users have ≥ 5 events                              │    │
│  │  ✓ ≥ 30 distinct user-course pairs                           │    │
│  │                                                              │    │
│  │  Result: READY_FOR_PHASE_4 or STAY_ON_PHASE_2_BASELINE       │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  Step 3: Train Model (Python scikit-learn)                           │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  php artisan recommendation:train                            │    │
│  │                                                              │    │
│  │  Process:                                                    │    │
│  │  1. Load CSV datasets                                        │    │
│  │  2. Build tag vectors → content feature matrix               │    │
│  │  3. Calculate cosine similarity (item-item)                  │    │
│  │  4. Build user-item collaborative matrix                     │    │
│  │  5. Calculate popularity scores                              │    │
│  │  6. Save model → recommender_model.pkl                       │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  Step 4: Serve Recommendations (FastAPI)                             │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  uvicorn app.main:app --port 8001                            │    │
│  │                                                              │    │
│  │  Request Flow:                                               │    │
│  │  Laravel → HTTP GET → FastAPI → Load Model → Score →         │    │
│  │  Return {course_id, score, reason, matching_tags}            │    │
│  └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

#### Recommendation Output Example

Setiap course yang direkomendasikan memiliki metadata:

```json
{
  "id": 5,
  "title": "Advanced React Patterns",
  "slug": "advanced-react-patterns",
  "thumbnail_url": "/storage/thumbnails/react.jpg",
  "recommendation_score": 12.45,
  "recommendation_reason": "Based on your interests in React, JavaScript, TypeScript",
  "matching_tags": ["React", "JavaScript", "TypeScript"]
}
```

#### Dimana Rekomendasi Ditampilkan

| Halaman | Deskripsi |
|---------|-----------|
| **Student Dashboard** | Section "Recommended Courses" — 4 kursus yang dipersonalisasi |
| **Course Catalog** | Toggle "AI Recommendations" untuk melihat kursus yang direkomendasikan |
| **Landing Page** | Section featured courses berdasarkan popularitas |
| **API Endpoint** | `GET /courses/recommended` — JSON response untuk integrasi |

---

## API Routes Reference

### Public Routes (No Auth)

| Method | Route | Controller | Deskripsi |
|--------|-------|-----------|-----------|
| `GET` | `/` | `LandingController@show` | Landing page |
| `GET` | `/course` | Closure | Course catalog |
| `GET` | `/course/{slug}` | Closure | Course detail + reviews + comments |
| `GET` | `/certificate/{number}` | `CertificateController@verify` | Public certificate verification |
| `GET` | `/courses/recommended` | `RecommendationController@index` | AI recommendations (JSON/redirect) |

### Auth Routes (Guest Only)

| Method | Route | Controller | Deskripsi |
|--------|-------|-----------|-----------|
| `GET` | `/login` | `AuthControllers@show` | Login page |
| `POST` | `/login` | `AuthControllers@store` | Process login |
| `GET` | `/register` | `AuthControllers@showRegister` | Register page |
| `POST` | `/register` | `AuthControllers@register` | Process registration |
| `POST` | `/logout` | `AuthControllers@logout` | Logout |

### Admin Routes (`/admin/*`)

| Method | Route | Controller | Deskripsi |
|--------|-------|-----------|-----------|
| `GET` | `/admin/dashboard` | `DashboardController@admin` | Admin dashboard |
| `GET` | `/admin/courses` | `CourseController@index` | List all courses |
| `GET` | `/admin/courses/{slug}` | `CourseController@show` | Course detail |
| `GET` | `/admin/courses/{slug}/preview` | `CourseController@preview` | Preview course |
| `POST` | `/admin/courses` | `CourseController@store` | Create course |
| `PUT` | `/admin/courses/{slug}` | `CourseController@update` | Update course |
| `PUT` | `/admin/courses/{slug}/approve` | `CourseApprovalController@approve` | Approve & publish |
| `DELETE` | `/admin/courses/{slug}` | `CourseController@destroy` | Delete course |
| `GET/PUT` | `/admin/courses/{slug}/certificate-template` | `CertificateTemplateController` | Certificate template |
| `POST` | `/admin/courses/{slug}/modules` | `ModuleController@store` | Create module |
| `GET` | `/admin/courses/{slug}/modules/{module}` | `ModuleController@show` | View module |
| `PUT` | `/admin/courses/{slug}/modules/{module}` | `ModuleController@update` | Update module |
| `DELETE` | `/admin/courses/{slug}/modules/{module}` | `ModuleController@destroy` | Delete module |
| `PUT` | `.../modules/{module}/move` | `ModuleController@move` | Reorder module |
| `POST` | `.../modules/{module}/materials` | `MaterialController@store` | Create material |
| `PUT` | `.../materials/{material}` | `MaterialController@update` | Update material |
| `DELETE` | `.../materials/{material}` | `MaterialController@destroy` | Delete material |
| `PUT` | `.../materials/{material}/move` | `MaterialController@move` | Reorder material |
| `POST` | `.../materials/{material}/contents` | `MaterialContentController@store` | Create content |
| `GET` | `.../contents/{content}` | `MaterialContentController@show` | View content |
| `PUT` | `.../contents/{content}` | `MaterialContentController@update` | Update content |
| `DELETE` | `.../contents/{content}` | `MaterialContentController@destroy` | Delete content |
| `PUT` | `.../contents/{content}/move` | `MaterialContentController@move` | Reorder content |
| `GET` | `.../contents/{content}/edit` | `MaterialContentController@edit` | Edit content page |
| `GET/POST/PUT/DELETE` | `.../quiz-questions` | `QuizController` | Quiz CRUD |
| `GET` | `/admin/categories` | Closure | List categories |
| `POST` | `/admin/categories` | `CategoryController@store` | Create category |
| `PUT` | `/admin/categories/{category}` | `CategoryController@update` | Update category |
| `DELETE` | `/admin/categories/{category}` | `CategoryController@destroy` | Delete category |
| `GET` | `/admin/tags` | `TagController@index` | List tags |
| `POST` | `/admin/tags` | `TagController@store` | Create tag |
| `PUT` | `/admin/tags/{tag}` | `TagController@update` | Update tag |
| `DELETE` | `/admin/tags/{tag}` | `TagController@destroy` | Delete tag |
| `GET` | `/admin/users` | `UserController@index` | List users |
| `GET` | `/admin/reviews` | Closure | List all reviews |
| `PUT` | `/admin/reviews/{review}/approve` | `ReviewController@approve` | Approve review |
| `PUT` | `/admin/reviews/{review}/reject` | `ReviewController@reject` | Reject review |
| `DELETE` | `/admin/reviews/{review}` | `ReviewController@adminDestroy` | Delete review |
| `GET` | `/admin/comments` | Closure | List all comments |
| `PUT` | `/admin/comments/{comment}/approve` | `CommentController@approve` | Approve comment |
| `PUT` | `/admin/comments/{comment}/reject` | `CommentController@reject` | Reject comment |
| `DELETE` | `/admin/comments/{comment}` | `CommentController@adminDestroy` | Delete comment |

### Instructor Routes (`/instructor/*`)

| Method | Route | Controller | Deskripsi |
|--------|-------|-----------|-----------|
| `GET` | `/instructor/dashboard` | `DashboardController@instructor` | Instructor dashboard |
| `GET` | `/instructor/courses` | `CourseController@index` | My courses |
| `GET` | `/instructor/courses/{slug}` | `CourseController@show` | Course detail |
| `GET` | `/instructor/courses/{slug}/preview` | `CourseController@preview` | Preview course |
| `POST` | `/instructor/courses` | `CourseController@store` | Create course |
| `PUT` | `/instructor/courses/{slug}` | `CourseController@update` | Update course |
| `PUT` | `/instructor/courses/{slug}/submit-review` | `CourseController@submitForReview` | Submit for review |
| `DELETE` | `/instructor/courses/{slug}` | `CourseController@destroy` | Delete course |
| `GET/PUT` | `/instructor/courses/{slug}/certificate-template` | `CertificateTemplateController` | Certificate template |

### Student Routes (`/student/*`)

| Method | Route | Controller | Deskripsi |
|--------|-------|-----------|-----------|
| `GET` | `/student/dashboard` | `DashboardController@student` | Student dashboard |
| `GET` | `/student/courses` | Closure | My enrolled courses |
| `GET` | `/student/courses/{slug}` | `EnrollmentController@show` | Learning page |
| `POST` | `/student/courses/{slug}/progress` | `EnrollmentController@markProgress` | Mark progress |
| `POST` | `/student/courses/{slug}/quiz/{content}/submit` | `EnrollmentController@submitQuiz` | Submit quiz |
| `GET` | `/student/certificates` | `CertificateController@index` | My certificates |
| `GET` | `/student/certificates/{certificate}/download` | `CertificateController@download` | Download PDF |
| `POST` | `/student/courses/{slug}/reviews` | `ReviewController@store` | Write review |
| `DELETE` | `/student/courses/{slug}/reviews/{review}` | `ReviewController@destroy` | Delete review |
| `POST` | `/student/courses/{slug}/comments` | `CommentController@store` | Post comment |
| `PUT` | `/student/courses/{slug}/comments/{comment}` | `CommentController@update` | Edit comment |
| `DELETE` | `/student/courses/{slug}/comments/{comment}` | `CommentController@destroy` | Delete comment |

### Python ML Microservice Routes (Port 8001)

| Method | Route | Deskripsi |
|--------|-------|-----------|
| `GET` | `/` | Service info |
| `GET` | `/docs` | Swagger/OpenAPI docs |
| `GET` | `/api/v1/health` | Health check + model status |
| `GET` | `/api/v1/recommendations/guest?limit=N` | Guest recommendations |
| `GET` | `/api/v1/recommendations/user/{id}?limit=N` | User recommendations |
| `POST` | `/api/v1/recommend` | Recommend (body: `{user_id, limit}`) |
| `POST` | `/course` | Recommend (body: `{user_id, limit}`) |

---

## Artisan Commands

### Recommendation Commands

| Command | Deskripsi |
|---------|-----------|
| `php artisan recommendation:export` | Export event data, user-item matrix, dan course catalog ke CSV untuk ML training. Output di `storage/app/ml/`. |
| `php artisan recommendation:train` | Jalankan full pipeline: export data → training Python ML model → save `recommender_model.pkl`. |
| `php artisan recommendation:train --no-export` | Training model tanpa re-export data (gunakan CSV yang sudah ada). |
| `php artisan recommendation:status` | Cek status recommendation engine (Python online/offline, fallback status). |
| `php artisan recommendation:stats` | Tampilkan analytics detail: event counts, user engagement, gate check readiness. |
| `php artisan recommendation:evaluate` | Evaluasi kualitas rekomendasi (precision, recall metrics). |
| `php artisan recommendation:seed-events` | Generate dummy event data untuk testing. |

### Standard Laravel Commands

| Command | Deskripsi |
|---------|-----------|
| `composer dev` | Start development servers (Laravel, Queue, Pail logs, Vite) |
| `composer setup` | Full setup: install deps, generate key, migrate, build |
| `php artisan migrate` | Run database migrations |
| `php artisan db:seed` | Seed database with sample data |

---

## Instalasi & Setup

### Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+ & npm
- MySQL / PostgreSQL
- Redis
- Python 3.11+ (untuk ML recommendation engine)

### Step 1: Clone & Install Dependencies

```bash
git clone https://github.com/your-repo/course-sale.git
cd course-sale

# Install PHP dependencies
composer install

# Install Node.js dependencies
npm install
```

### Step 2: Environment Setup

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` dengan konfigurasi database, Redis, dan recommendation:

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

# Recommendation Engine Config
RECOMMENDATION_ENABLED=true
RECOMMENDATION_DRIVER=python
RECOMMENDATION_PYTHON_URL=http://127.0.0.1:8001
RECOMMENDATION_PYTHON_TIMEOUT=2.0
RECOMMENDATION_PYTHON_FALLBACK=true
RECOMMENDATION_CACHE_TTL=7200
```

### Step 3: Database & Storage

```bash
php artisan migrate
php artisan storage:link
```

### Step 4: Setup Python ML Service

```bash
cd recommendation-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Go back to project root
cd ..
```

### Step 5: Train ML Model (Optional — requires data)

```bash
# Export interaction data from database
php artisan recommendation:export

# Train the model
php artisan recommendation:train
```

### Step 6: Run Development Servers

```bash
# Option 1: Run everything with one command
composer dev

# Option 2: Run separately
# Terminal 1: Laravel server
php artisan serve

# Terminal 2: Vite dev server
npm run dev

# Terminal 3: Queue worker
php artisan queue:listen

# Terminal 4: Python ML service
cd recommendation-service
source venv/bin/activate
uvicorn app.main:app --port 8001 --reload
```

Akses aplikasi di: **http://localhost:8000**

---

## Struktur Folder

```
course-sale/
├── app/
│   ├── Console/Commands/           # Artisan commands (6 recommendation commands)
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/              # CourseApprovalController
│   │   │   ├── Course/             # CourseController, ModuleController,
│   │   │   │                       # MaterialController, MaterialContentController,
│   │   │   │                       # QuizController
│   │   │   ├── AuthControllers.php
│   │   │   ├── CertificateController.php
│   │   │   ├── CertificateTemplateController.php
│   │   │   ├── CommentController.php
│   │   │   ├── DashboardController.php
│   │   │   ├── EnrollmentController.php
│   │   │   ├── LandingController.php
│   │   │   ├── RecommendationController.php
│   │   │   ├── ReviewController.php
│   │   │   ├── RoleController.php
│   │   │   ├── TagController.php
│   │   │   └── UserController.php
│   │   ├── Middleware/
│   │   │   ├── EnsureRoleSelected.php
│   │   │   ├── HandleInertiaRequests.php
│   │   │   └── RoleMiddleware.php
│   │   └── Requests/               # Form Request validation (20+ files)
│   ├── Models/                     # 26 Eloquent models
│   └── Services/                   # 20 service classes (business logic)
├── database/
│   ├── factories/
│   ├── migrations/                 # 32 migration files
│   └── seeders/
├── recommendation-service/         # Python ML Microservice
│   ├── app/
│   │   ├── api/recommend.py        # FastAPI endpoints
│   │   ├── main.py                 # FastAPI app entry
│   │   └── schemas.py              # Pydantic schemas
│   ├── ml/
│   │   ├── data/build_matrix.py    # Data preprocessing
│   │   ├── train.py                # Model training script
│   │   └── evaluate.py             # Model evaluation
│   ├── models/                     # Trained model (.pkl)
│   ├── tests/                      # Pytest test files
│   ├── requirements.txt            # Python dependencies
│   └── venv/                       # Python virtual environment
├── resources/
│   └── js/
│       ├── components/             # React components (atoms, molecules, organisms)
│       └── pages/                  # Inertia pages
│           ├── admin/              # Admin pages
│           ├── auth/               # Login, Register
│           ├── course/             # Public course catalog & detail
│           └── user/               # Student & Instructor pages
├── routes/
│   └── web.php                     # All application routes (472 lines)
├── storage/
│   └── app/ml/                     # ML training datasets (CSV)
├── composer.json
├── package.json
├── design.md                       # Design & feature analysis
├── task.md                         # Task tracking
└── README.md                       # ← You are here
```

---

## License

MIT License — lihat file [LICENSE](LICENSE) untuk detail.
