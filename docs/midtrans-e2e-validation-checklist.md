# Midtrans E2E Validation Checklist (Sandbox / Production-like)

Checklist konkret untuk memvalidasi alur pembayaran Midtrans end-to-end pada environment **sandbox** atau **production-like** (staging dengan kredensial/konfigurasi yang menyerupai produksi).

> **Prinsip**
> - Webhook Midtrans adalah sumber kebenaran status akhir; polling/cek status dari UI hanya best-effort.
> - Semua verifikasi harus dilakukan di environment yang terisolasi dari data produksi nyata.
> - Catat: `order_number`, `payment_id`, `transaction_id`, payload webhook (header/body relevan, tanpa membocorkan secret), log aplikasi, dan tangkapan layar untuk setiap skenario.

---

## 0) Prasyarat & konfigurasi

- [ ] **App/infra**
  - [ ] `APP_ENV`, `APP_URL` (HTTPS), trusted proxy, session secure cookie, dan timezone sesuai environment.
  - [ ] Storage link/permission OK; queue worker & scheduler aktif (`php artisan schedule:work` / cron `schedule:run`, `queue:work` bila diperlukan notifikasi/job).
  - [ ] DB backup/staging snapshot tersedia; migrasi & seeding payment (`midtrans` provider/methods, payment settings) sudah sesuai.
- [ ] **Konfigurasi Midtrans** (`services.payment.midtrans.*` / admin settings)
  - [ ] Mode sesuai environment: **sandbox** (`MIDTRANS_IS_PRODUCTION=false`, key `SB-...`, host sandbox) atau **production-like/production** (`MIDTRANS_IS_PRODUCTION=true`, key production, host production). Jangan campur key/host/mode.
  - [ ] `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_MERCHANT_ID` terisi valid.
  - [ ] Currency **IDR** (Snap hanya IDR).
  - [ ] `services.payment.midtrans.timeout` wajar; diagnostics/health di admin settings tidak menunjukkan isu kritis.
- [ ] **Webhook**
  - [ ] URL publik dapat diakses Midtrans: `POST {APP_URL}/payments/midtrans/webhook` (route `payment.webhook.midtrans`, throttled `payment-webhooks`).
  - [ ] HTTPS valid (production-like), tidak terblokir auth/CSRF/firewall/WAF secara keliru.
  - [ ] Signature diverifikasi (SHA512 `order_id+status_code+gross_amount+server_key`); amount/gross diverifikasi terhadap payment.
- [ ] **Akun uji**
  - [ ] Student, instructor (dengan rekening payout lengkap bila uji payout), admin.
  - [ ] Course paid (published, punya instructor/creator untuk payout ledger) dan/atau course free untuk kontrol.
- [ ] **Scheduler/command**
  - [ ] `php artisan orders:expire` terjadwal (setiap ~10 menit, tanpa overlap) dan dapat dijalankan manual: `php artisan orders:expire`.

## 1) Checkout & pembuatan order/transaksi

- [ ] **Happy path (paid course)**
  - [ ] Student checkout course paid → order `pending` + payment `pending` dibuat, redirect/Inertia location ke Snap URL, `payment_url`/reference tersimpan.
  - [ ] Item/order amount, currency (IDR), customer detail, expiry dikirim sesuai; order memiliki `expires_at`.
- [ ] **Enrollment guard**
  - [ ] Student yang sudah enrolled/aktif **tidak** bisa membuat order baru / dikenakan biaya ganda (redirect/info sesuai).
  - [ ] Course free mengaktifkan enrollment langsung (bukan flow Midtrans).
- [ ] **Metode/gateway**
  - [ ] Hanya metode provider Midtrans aktif yang tersedia; jika gateway/mode/config tidak siap → error yang jelas, tidak membuat transaksi setengah jadi yang menyesatkan.
- [ ] **Idempotensi/retry checkout**
  - [ ] Klik checkout ganda / request paralel tidak menghasilkan duplikasi order/transaksi bermasalah; order pending yang masih valid dapat dipakai ulang.
  - [ ] Jika transaksi gateway sebelumnya cancel/expire/not_found → order lama dirilis (failed/expired) dan checkout membuat transaksi/order baru yang valid.
  - [ ] Jika gateway sudah settlement (dibayar) saat retry/resolve → order ditandai paid dan enrollment diberikan (tanpa double-charge flow baru).
  - [ ] **Order number collision** (langka): pembuatan order tetap sukses via retry/generate unik; tidak gagal karena bentrok nomor.

## 2) Pending, halaman pembayaran, dan expiry

- [ ] **Payment page** (`/student/orders/{order_number}` / route terkait)
  - [ ] Hanya owner (atau admin) dapat akses; menampilkan status/order/payment/course/gateway info dengan benar.
  - [ ] Refresh status best-effort (verify) tidak merusak state final; outage gateway tidak memecah halaman.
- [ ] **Expiry**
  - [ ] `orders:expire` men-expire order pending yang lewat `expires_at`: order/payment → `expired`, transaksi remote di-expire best-effort.
  - [ ] Order sudah `paid`/non-pending **tidak** tersentuh command.
  - [ ] Order pending tanpa `expires_at` tidak di-expire keliru oleh command (sesuai perilaku yang diharapkan).
  - [ ] Setelah expiry lokal/gateway, Snap lama tidak bisa mengubah state menjadi paid yang valid (dan UI mengarahkan retry/checkout baru).

## 3) Sukses (settlement/capture)

- [ ] **Webhook settlement** (`transaction_status=settlement`, signature & gross valid)
  - [ ] Payment & order → `paid`, `paid_at` terisi, enrollment aktif untuk item/course, event/log tercatat, payout ledger instruktur dibuat (gross/platform_fee/net, `available_at` sesuai hold).
  - [ ] **Idempotent**: kirim ulang notifikasi yang sama → tidak menggandakan enrollment, payout, atau efek samping.
- [ ] **Capture (kartu kredit)**
  - [ ] `capture` + `fraud_status=accept` → paid + enrollment.
  - [ ] `capture` + `fraud_status=challenge` → **tidak** paid, **tidak** grant access (pending/review sesuai).
  - [ ] `capture` + fraud lain/deny path → tidak grant access (gagal/ditolak sesuai mapping).

## 4) Gagal / ditolak / dibatalkan (sebelum & sesudah settlement)

- [ ] **Pending/unpaid**: `deny`/`cancel`/`failure`/`expire` sebelum paid → order/payment `failed`/`expired` sesuai, **tidak** ada enrollment aktif.
- [ ] **Reversal setelah paid** (mis. deny/cancel reversal)
  - [ ] Akses dicabut (enrollment revoked) dan payout pending dibatalkan; order/payment menjadi `failed` (bukan stale-expiry yang salah arah).
  - [ ] Notifikasi `expire` yang terlambat setelah settlement **tidak** mencabut akses (stale delivery aman).
- [ ] **Notifikasi tidak dikenal/invalid**
  - [ ] Signature invalid → ditolak (403) dan state tidak berubah.
  - [ ] Merchant mismatch (bila dikonfigurasi) → ditolak.
  - [ ] `gross_amount` tidak cocok dengan amount payment → ditolak (422) dan state tidak berubah.
  - [ ] Order tidak dikenal → di-ack (200) agar retry provider berhenti, tanpa efek samping berbahaya.

## 5) Webhook: retry, duplikasi, dan konsistensi

- [ ] Kirim ulang event sukses/gagal/refund/chargeback identik beberapa kali → **idempotent** (tanpa double-apply/refund ganda/enrollment ganda).
- [ ] Event datang out-of-order (mis. notify setelah state sudah final) tidak menurunkan state yang lebih “kuat” secara tidak benar (paid/refunded/chargeback terlindungi).
- [ ] Semua transisi penting tercatat di `payment_logs`/audit trail yang relevan.

## 6) Konfirmasi manual admin (mark paid) & override

- [ ] Order `pending` dengan verifikasi gateway = paid → konfirmasi berhasil, enrollment & payout tercipta, log `manual_confirmed`.
- [ ] Gateway belum konfirmasi paid → tanpa override ditolak dengan pesan status; dengan `override` + alasan → tercatat sebagai `manual_override` (gunakan hanya dengan bukti sah).
- [ ] Order sudah `paid` → info/idempotent; order `refunded`/`chargeback` → **ditolak** (tidak boleh re-aktivasi akses via mark-paid).
- [ ] Tanpa payment pending yang valid → error yang jelas, tanpa mutasi liar.

## 7) Refund (penuh/parsial, channel, async)

- [ ] **Channel mendukung API** (mis. credit_card/gopay/shopeepay/qris/dana/ovo/kredivo/akulaku sesuai kebijakan gateway)
  - [ ] **Full refund** via admin/API: memanggil Midtrans refund API, status sukses → payment/order `refunded`, akses dicabut, payout pending dibatalkan, record refund sukses.
  - [ ] **Partial refund**: payment `partial_refund`, order tetap `paid`, akses **tetap aktif**; sisa yang direfund hingga lunas → full refunded + akses dicabut.
  - [ ] **Nominal invalid** (<=0 atau melebihi sisa) ditolak.
- [ ] **Channel tidak mendukung API** (mis. VA/echannel tertentu)
  - [ ] UI/aksi menolak refund API dan mengarahkan proses manual via dashboard Midtrans; **tidak** ada pemanggilan API refund yang keliru.
- [ ] **API error / HTTP 200 dengan status_code error**
  - [ ] Tidak diperlakukan sukses; payment/order tidak berubah ke refunded; kegagalan tercatat (audit trail/refund failed) untuk investigasi.
- [ ] **Retry refund**
  - [ ] Retry memakai `refund_key` yang sama (idempotent di sisi sistem/gateway), tidak menggandakan efek.
- [ ] **Async refund**
  - [ ] Respons pending → refund tercatat pending tanpa mencabut akses/payout prematur; webhook/notifikasi sukses berikutnya memfinalisasi → refunded + revoke akses/payout pending.
- [ ] **Webhook refund/partial_refund**
  - [ ] Memperbarui state & revokasi sesuai (tanpa memanggil API refund lagi); idempotent terhadap duplikasi.

## 8) Chargeback

- [ ] Notifikasi chargeback/partial_chargeback → payment/order `chargeback`, amount tercatat, refund/dispute record `type=chargeback` sukses, **akses dicabut**, payout pending dibatalkan.
- [ ] Idempotent terhadap notifikasi ulang (dedupe key/record).
- [ ] Order/item/payout yang sudah `paid` ke instruktur: pastikan tercatat sebagai kasus operasional/keuangan (tidak otomatis “menarik balik” transfer bank yang sudah selesai) — verifikasi sesuai proses bisnis.

## 9) Payout (pembuatan, hold, cancel, batch, export)

- [ ] **Pembuatan ledger**: saat order paid, ledger per item/course terbentuk (idempotent) dengan fee/platform split benar.
- [ ] **Hold period**: ledger belum `available` sebelum `available_at`; admin tidak bisa mark/batch/export-ready sebelum hold lewat.
- [ ] **Kelayakan**: rekening instruktur lengkap, tidak terkunci (lock setelah perubahan rekening), dan memenuhi minimum payout.
- [ ] **Mark paid (single) & batch**: hanya ledger `pending` & available & eligible; status/paid_at/reference/notes terisi; notifikasi/job terkait (bila ada) terpicu sekali sesuai perilaku.
- [ ] **Cancel**: refund penuh/chargeback/reversal membatalkan payout **pending** dengan catatan alasan; payout yang sudah **paid** tidak diubah otomatis (diverifikasi sebagai limitasi operasional).
- [ ] **Export CSV**: hanya payout siap/eligible sesuai aturan, data rekening/instruktur/total benar, akses admin-only, dan tercatat di log bila berlaku.

## 10) Efek enrollment & akses belajar

- [ ] Paid/settlement → enrollment `active` (akses materi/learning sesuai aturan).
- [ ] Refund penuh / chargeback / reversal setelah paid → enrollment `revoked` (akses belajar/sertifikat/resource/progress-gate mengikuti status revoke).
- [ ] Partial refund (belum lunas) → enrollment tetap aktif.
- [ ] Free course / alur non-payment tidak terpengaruh regresi.

## 11) Observabilitas & operasional

- [ ] `payment_logs` / log aplikasi merekam event kunci (created, paid, failed/expired, reversed, refund pending/success/failed, chargeback, manual_confirm/override) dengan konteks aman.
- [ ] Alert/monitoring: lonjakan 403/422 webhook, error verify/refund, backlog queue, kegagalan scheduler `orders:expire`.
- [ ] Uji **sandbox** dengan skenario channel berbeda (mis. QRIS/VA/e-wallet/card) dan **production-like** dengan nominal kecil + prosedur rollback/rekonsiliasi.

## 12) Kriteria lulus

- [ ] Semua skenario kritis (sukses, expiry, gagal, duplikasi webhook, refund penuh/parsial/async/unsupported, chargeback, reversal, payout hold/cancel/batch/export, guard admin/manual) lulus tanpa inkonsistensi state (order/payment/enrollment/payout/refund).
- [ ] Tidak ada double-charge, double-enroll, double-payout, atau double-apply refund pada uji idempotensi/konkurensi.
- [ ] Rekonsiliasi manual (dashboard Midtrans vs DB vs ledger payout) bersih untuk sampel uji.
