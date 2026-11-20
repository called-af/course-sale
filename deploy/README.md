# Deploy singkat (native VPS, tanpa Docker)

Tidak ada script `.sh`. Cukup copy konfigurasi ini, lalu jalankan perintah Laravel biasa.

## File yang dipakai

- `nginx.conf` → `/etc/nginx/sites-available/course-sale`
- `supervisor.conf` → `/etc/supervisor/conf.d/course-sale.conf`
- `cron` → isi ke `crontab -e`

Edit dulu `CHANGE_ME`, domain, dan socket PHP-FPM di `nginx.conf`.

## Install awal

Di folder aplikasi:

```bash
cp .env.example .env
# isi .env produksi: lihat docs/production-deployment-readiness.md

composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan key:generate
php artisan storage:link
php artisan migrate --force
php artisan optimize

sudo chown -R www-data:www-data storage bootstrap/cache public/build
sudo nginx -t && sudo systemctl reload nginx
sudo supervisorctl reread && sudo supervisorctl update
```

> `php artisan migrate --force` hanya untuk **DB fresh** atau setelah baseline migrasi selesai.
> Untuk DB lama, ikuti `docs/migration-reconciliation.md`.

## Update kode

```bash
git pull
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan optimize:clear
php artisan optimize
sudo supervisorctl restart 'course-sale-queue:*'
sudo systemctl reload nginx
```

Jalankan migrate hanya jika ada perubahan schema dan sudah aman.

## C cepat

- `/up`, `/`, `/login`, `/course`
- Admin → Settings → Landing → Trust bar (upload/replace/remove logo)
- Checkout + webhook Midtrans
- Sertifikat dan `/storage/...`

Kalau mau paling praktis, pakai **Laravel Forge / Plesk**: upload repo, set `.env`, lalu aktifkan queue worker dan cron. Config di folder ini tetap jadi acuan.
