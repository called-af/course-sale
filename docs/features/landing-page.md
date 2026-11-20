# Landing Page, Editable Sections and Legal Pages

> Part of the [Feature Documentation](../FEATURES.md) index.

## Overview

The public landing page is a lightweight CMS. Admin edits each section from
**Settings → Landing**, and the public page reads the saved values. The trust bar
contains payment logos; bundled logos live in `public/images/payment-methods/`
as PNG assets, and custom logos are uploaded from the Trust section. Terms and
Privacy are static pages linked from the footer.

## Roles

- **Guest** — reads the landing page and legal pages.
- **Admin** — edits landing sections and uploads/replaces/removes trust logos.
- **Authenticated non-admin** — is redirected from `/` to `/home`.

## Flow

### 1. Public visit

1. Guest opens `GET /`.
2. `LandingController` loads section content merged with default values.
3. Only enabled sections are rendered.
4. Dynamic sections load real data:
   - **Courses:** published courses, latest first, limited by `courses.limit`.
   - **Testimonials:** approved reviews with a non-empty comment and rating at or
     above the configured minimum.
   - **Instructors:** instructors in selected or all mode, with derived course and
     student counts.
   - **Certificates:** real, non-deleted certificates.
   - **Certificate sample:** the global certificate template before real
     certificates exist.
5. Guest can open `/terms` and `/privacy` from the footer.

### 2. Edit a section

1. Admin opens `/admin/settings/landing`.
2. The app redirects to `/admin/settings/landing/hero`.
3. Admin selects a section tab and changes fields, visibility, links or uploads.
4. Admin submits the form using `PUT /admin/settings/landing/{section}`.
5. The controller sanitizes the payload, validates uploads, stores files on the
   public disk and saves the section content.
6. The public page reflects the saved section immediately.

Available sections: `hero`, `about`, `courses`, `career`, `instructor`,
`how_it_works`, `benefit`, `certificate`, `testimonial`, `faq`, `trust`, `cta`,
`footer`.

### 3. Manage trust-bar payment logos

1. Admin opens **Settings → Landing → Trust**.
2. Existing logos are shown by key, for example `bca`, `mandiri`, `qris`,
   `gopay`, `visa` and `mastercard`.
3. Admin uploads a replacement file in `payment_logo_files`, or supplies an
   existing `/storage/payment-logos/...` or `http(s)` URL in `payment_logos`.
4. Uploaded files are stored under `storage/app/public/payment-logos` and served
   from `/storage/payment-logos/...`.
5. Replacing or removing a stored logo deletes the previous file.
6. Unsafe paths such as `/storage/payment-logos/../../secret.txt` are dropped.

Use PNG files for custom logos so they match the bundled payment-method assets.
Confirm trademark permission before distributing the platform commercially.

## Rules and guards

- Landing settings require the `manage-settings` gate; only admin passes.
- An unknown section name returns 404.
- Unknown payload keys are removed, values are type-coerced, and text and links
  are sanitized.
- Allowed link schemes are `/`, `#`, `http`, `https`, `mailto:` and `tel:`;
  anything else becomes `#`.
- Hero uploads accept `jpg`, `jpeg`, `png`, `webp` and `gif`, up to 4096 KB each.
- Trust uploads accept image files up to 2048 KB, up to 40 files per save.
- Hidden sections do not load their server-side data, which keeps the public
  payload small.
- Testimonial minimum rating is 1–5; instructor selection allows up to 24 users;
  featured certificates allow up to 12; FAQ allows up to 30 items.

## Where to find it

- **Public UI:** `resources/js/pages/landing/page.tsx`.
- **Admin UI:** `resources/js/pages/admin/landing/Settings.tsx`.
- **Legal UI:** `resources/js/pages/legal/terms.tsx`, `privacy.tsx`.
- **Routes:** `GET /`, `GET /admin/landing`, `GET /admin/settings/landing`,
  `GET/PUT /admin/settings/landing/{section}`, `GET /terms`, `GET /privacy`.

## Key implementation files

- `app/Http/Controllers/LandingController.php`
- `app/Http/Controllers/Admin/LandingSettingsController.php`
- `app/Services/LandingService.php`
- `app/Models/LandingSetting.php`
- `app/Http/Controllers/Legal/LegalController.php`
- `public/images/payment-methods/`

## Edge cases

- Admin can preview the landing page at `/admin/landing`.
- A hidden section returns empty arrays for its dynamic data providers.
- Rejected reviews never appear as testimonials.
- Local files require `php artisan storage:link` to be served from `/storage`.
- Deleting a stored logo from the editor removes the file from disk.

## Related guides

- [Reviews, comments and moderation](reviews-and-comments.md)
- [Certificates](certificates.md)
- [Settings and branding](settings-and-branding.md)
