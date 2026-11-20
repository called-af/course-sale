# Certificates

> Part of the [Feature Documentation](../FEATURES.md) index.

## Overview

A certificate is generated automatically when a student completes a course. The
PDF is rendered from a global template with optional course-level signature
overrides. Template changes queue PDF regeneration instead of regenerating
synchronously. Any visitor can verify a certificate by its public number.

## Roles

- **Student** — views and downloads their own certificates.
- **Instructor** — overrides the signature name/image for their own course.
- **Admin** — manages the global certificate template.
- **Public visitor** — verifies a certificate number.
- **Queue worker** — regenerates PDFs after template changes.

## Flow

### 1. Generate a certificate

1. A content completion triggers `CertificateService::generateIfCompleted()`.
2. The service checks that the student does not already have a certificate for
   the course and that the course is fully complete.
3. A certificate is created with number `KRSIO-YYYYMM-XXXXXXXX`.
4. The template payload starts from the global `AppearanceSetting` template and
   applies course-level signature overrides.
5. DomPDF renders `pdf.certificate` on A4 landscape.
6. The PDF is stored at `certificates/{number}.pdf` on the public disk and the
   path is saved on the certificate.
7. The PDF includes the public verification URL `/certificate/{number}`.

### 2. Download a certificate

1. Student opens `/student/certificates`.
2. The list shows certificates whose course still exists.
3. Student clicks download on `/student/certificates/{certificate}/download`.
4. The controller verifies ownership.
5. If the PDF file is missing, it is regenerated on demand.
6. The PDF is streamed as an attachment.

### 3. Verify a certificate

1. Any visitor opens `GET /certificate/{certificateNumber}`.
2. The controller finds the certificate, including certificates whose user or
   course was soft-deleted.
3. A missing certificate or course renders `valid: false`.
4. A valid result shows student, course, issue date and certificate number.

### 4. Design the global template

1. Admin opens `/admin/certificate-template`.
2. Admin edits colors, background style, title, footer, signature settings and
   element coordinates, font sizes, colors, alignment and visibility.
3. A background image can be uploaded as `jpg`, `jpeg`, `png` or `webp`, up to
   5120 KB.
4. A signature image must be PNG, up to 2048 KB, and pass the transparent-PNG rule.
5. Saving dispatches `RegenerateCertificatePdfJob` for all certificates with a
   saved PDF path.

### 5. Override a course signature

1. Instructor opens the certificate signature settings for their own course.
2. Instructor sets a signature name up to 100 characters and an optional
   transparent PNG up to 2048 KB.
3. Saving dispatches `RegenerateCertificatePdfJob` for certificates of that course.

### 6. Queued regeneration

`RegenerateCertificatePdfJob` retries up to 3 times with a 110-second timeout.
It skips certificates or courses that no longer exist, then re-renders and
overwrites the PDF. A running queue worker is required.

## Rules and guards

- One certificate per `(user_id, course_id)`.
- Certificate numbers are unique.
- Download is owner-only; verification is intentionally public.
- Signature images must be transparent PNG files.
- Template edits do not change old PDFs until the queued regeneration runs.
- Missing PDF files are regenerated during student download.

## Where to find it

- **Student UI:** `resources/js/pages/student/certificates/page.tsx`.
- **Verification UI:** `resources/js/pages/certificate/[number]/page.tsx`.
- **Admin UI:** `resources/js/pages/admin/certificate-template/page.tsx`.
- **Routes:** `GET /certificate/{certificateNumber}`,
  `GET /student/certificates`,
  `GET /student/certificates/{certificate}/download`,
  `GET/PUT /admin/certificate-template`,
  `PUT /instructor/courses/{course:slug}/certificate-template/signature`.

## Key implementation files

- `app/Services/CertificateService.php`
- `app/Http/Controllers/CertificateController.php`
- `app/Http/Controllers/CertificateTemplateController.php`
- `app/Jobs/RegenerateCertificatePdfJob.php`
- `app/Rules/TransparentPng.php`
- `resources/views/pdf/certificate.blade.php`

## Edge cases

- Full completion does not duplicate an existing certificate.
- Deleted courses are hidden from the student list but handled in verification.
- The job silently skips certificates whose course was deleted.
- PDFs require `FILESYSTEM_DISK=public` and `php artisan storage:link`.

## Related guides

- [Learning and progress](learning-and-progress.md)
- [Settings and branding](settings-and-branding.md)
- [Scheduled maintenance](scheduled-maintenance.md)
