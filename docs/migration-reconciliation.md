# Rekonsiliasi Migrasi (DB Existing → Set Migrasi Konsolidasi)

Dokumen ini untuk environment yang **sudah punya database dengan riwayat migrasi lama**, sementara kode saat ini memakai **set migrasi create-only yang terkonsolidasi** (`database/migrations/2026_01_01_000001_*` s.d. `000064_*`) yang merepresentasikan skema final.

> Tujuan: skema DB == skema final kode, dan tabel `migrations` selaras dengan set konsolidasi, **tanpa kehilangan data**.

## Kenapa ini perlu

- Tabel `migrations` pada DB lama berisi nama/batch file migrasi lama yang **tidak ada** di set baru.
- Banyak file konsolidasi melakukan `dropIfExists` + `CREATE TABLE`. Jika dijalankan ulang terhadap DB berisi data, ini **destruktif**.
- Karena itu, untuk DB berdata kita **tidak** mengeksekusi ulang file-file konsolidasi tersebut; kita menyelaraskan skema bila perlu lalu **menandai (baseline)** riwayatnya.

Migrasi rekonsiliasi yang diketahui:
- `2026_11_18_000001_add_google_auth_columns_to_users_table.php` — idempotent (aman dijalankan berulang / no-op bila skema sudah sesuai) untuk kolom/indeks Google auth di `users`.

---

## Prinsip wajib (semua opsi)

1. **Backup penuh** (database + `storage/` file upload/sertifikat/dokumen) dan **uji restore**.
2. **Latihan dulu di staging** yang merupakan salinan/clone data produksi.
3. Jalankan pada **maintenance window** bila memungkinkan; siapkan rencana rollback.
4. Setelah selesai: cek `php artisan migrate:status`, jalankan smoke test aplikasi (auth/Google login, belajar & progress, kuis, pembayaran/webhook, sertifikat, resource, dashboard).

---

## Opsi A — DB baru / data boleh di-reset (paling sederhana)

Cocok untuk local/dev/staging kosong atau instalasi baru.

```bash
# pastikan backup bila ada data penting
php artisan migrate:fresh --seed
```

- Membuat ulang skema dari 64 migrasi final.
- Migrasi rekonsiliasi idempotent akan no-op bila tidak diperlukan.

---

## Opsi B — DB existing, skema sudah (hampir) sama dengan final (baseline riwayat)

Cocok bila struktur tabel/kolom/index/FK di DB produksi sudah mencerminkan skema final dan hanya riwayat `migrations` yang tidak selaras.

1. **Backup + staging clone** (wajib).
2. **Bandingkan skema** staging vs skema final kode (tabel, kolom, tipe, nullable/default, index/unique, FK).
   - Perhatikan perubahan yang diketahui: `users.google_id` (nullable, unique), `users.password` nullable, `users.remember_token`, serta tabel/kolom fitur yang ada di set final.
3. **Perbaiki selisih skema secara aditif/idempotent** (tanpa drop data). Contoh:
   ```bash
   php artisan migrate --path=database/migrations/2026_11_18_000001_add_google_auth_columns_to_users_table.php
   ```
   Tambahkan migrasi idempotent baru bila ditemukan drift lain (cek `Schema::hasTable/hasColumn`, cek index sebelum membuat).
4. **Selaraskan tabel `migrations` (baseline)** agar file konsolidasi yang skemanya sudah ada dianggap *sudah dijalankan*:
   - Simpan/catat isi `migrations` lama untuk audit.
   - Pastikan setiap file dari `2026_01_01_000001_*` s.d. `000064_*` yang merepresentasikan skema yang sudah ada di DB tercatat di `migrations` (batch sesuai kebijakan tim), **tanpa** mengeksekusi DDL create/drop file-file tersebut.
   - Tandai juga migrasi rekonsiliasi sebagai ran bila sudah diterapkan/diperlukan.
   - Lakukan dengan hati-hati (transaction/maintenance window bila memungkinkan). Jangan jalankan `php artisan migrate` yang akan menjalankan ulang create-only pada tabel berdata.
5. **Verifikasi**:
   ```bash
   php artisan migrate:status
   php artisan migrate
   ```
   `migrate` berikutnya seharusnya tidak menjalankan DDL destruktif; hanya migrasi baru ke depan.
6. **Rekonsiliasi data turunan progress (disarankan)**:
   ```bash
   php artisan progress:sync-materials --dry-run
   php artisan progress:sync-materials
   ```
   (Idempotent; menyelaraskan cache `material_progress` dari `material_content_progress`.)

---

## Opsi C — DB existing, skema berbeda/unknown (diff → migrasi forward-only)

Cocok bila tidak yakin skema sudah sama dengan final.

1. **Backup + staging clone**.
2. Inventaris perbedaan skema aktual vs final.
3. Tulis migrasi **forward-only & idempotent** untuk membawa DB ke skema final **tanpa drop data** (pola seperti migrasi rekonsiliasi `users`).
4. Setelah skema match, lakukan **baseline riwayat** seperti Opsi B langkah 4–6.
5. Hindari `migrate:fresh` pada data produksi.

---

## Checklist pasca-rekonsiliasi

- [ ] `php artisan migrate:status` bersih/sesuai harapan
- [ ] `php artisan progress:sync-materials` (bila ada data belajar)
- [ ] `php artisan storage:link` & permission storage benar
- [ ] Queue/scheduler berjalan (jika dipakai)
- [ ] Smoke test: login/Google OAuth, enrollment & learning, progress/resume, kuis, checkout & webhook pembayaran, sertifikat, resource, dashboard
- [ ] Monitoring/log bebas error migrasi & query skema

## Catatan

- Baseline riwayat migrasi adalah tindakan operasional; pastikan dicatat (siapa/kapan/DB mana/batch apa) untuk audit.
- Untuk perbaikan progress ganda (material vs content), sistem kini memperlakukan `material_content_progress` sebagai sumber kebenaran dan `material_progress` sebagai cache turunan yang disinkronkan/direvokasi oleh backend; gunakan `progress:sync-materials` untuk backfill/pemulihan konsistensi data.
