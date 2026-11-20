# Scheduler, Queue Worker and Data Retention

> Part of the [Feature Documentation](../FEATURES.md) index.

## Overview

Several features depend on background work: certificate regeneration, WhatsApp
notifications, order expiry, failed-job cleanup, data pruning and progress
reconciliation. Cron runs the Laravel scheduler every minute; Supervisor runs a
persistent queue worker. `QUEUE_CONNECTION=sync` must not be used in production.

## Roles

- **Operations** — installs cron and Supervisor and monitors jobs.
- **System** — runs scheduled commands and queued jobs.
- No web UI is involved.

## Scheduled tasks

From `php artisan schedule:list`:

| Schedule | Command | Purpose |
|----------|---------|---------|
| Every 10 minutes | `orders:expire` | Release pending orders past their 24-hour window. |
| Daily at 00:00 | `queue:prune-failed --hours=168` | Remove failed jobs older than 7 days. |
| Daily at 03:15 | `system:prune-data` | Prune sessions, cache and operational logs. |
| Sunday 03:30 | `progress:sync-materials` | Reconcile material completion for active enrollments. |

All scheduled commands use `withoutOverlapping()` and `onOneServer()` where
appropriate.

## Queue worker

Queued work includes:

- `RegenerateCertificatePdfJob` after certificate template or signature changes.
- `SendWhatsAppEnrollmentNotificationJob` after enrollment.
- `SendPayoutPaidNotificationJob` after payout payment.
- Event tracking and other provider jobs.

Recommended Supervisor command:

```bash
php /var/www/course-sale/artisan queue:work database \
  --queue=default --sleep=3 --tries=3 --timeout=120 --max-time=3600
```

`retry_after` must be greater than the worker timeout. The default is
`DB_QUEUE_RETRY_AFTER=150` for database queue and `REDIS_QUEUE_RETRY_AFTER=150`
for Redis.

## Data retention

`system:prune-data` prunes:

- `sessions` — 14 days by default.
- `job_batches` — 7 days by default.
- `user_events`, AI logs, WhatsApp logs and webhook logs — 90 days by default.
- `payment_logs` — 365 days by default.
- `chat_messages` — 180 days by default.

`--days=N` overrides the operational-log retention for manual runs. A very large
value such as `--days=99999` effectively disables pruning for a verification run.

## Redis for higher traffic

For roughly 500+ concurrent active users, use Redis for cache, sessions and
queue:

```dotenv
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
REDIS_CLIENT=phpredis
REDIS_QUEUE_RETRY_AFTER=150
```

Redis queue uses DB 0 and cache uses DB 1 by default. Pruning is still needed
for database tables and logs not stored in Redis.

## Rules and guards

- Cron entry:
  `* * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1`
- Production deployment path in `deploy/cron` is `/var/www/course-sale`.
- Worker timeout must be lower than `retry_after` to avoid duplicate processing.
- `progress:sync-materials` supports `--user`, `--course` and `--dry-run`.
- `system:prune-data` supports `--days`.
- Database pruning does not replace Redis memory and eviction monitoring.

## Where to find it

- **Files:** `routes/console.php`, `deploy/cron`, `deploy/supervisor.conf`,
  `config/queue.php`, `config/cache.php`, `config/maintenance.php`.
- **Commands:** `php artisan schedule:list`, `php artisan queue:work`,
  `php artisan system:prune-data`, `php artisan progress:sync-materials`.

## Key implementation files

- `app/Console/Commands/ExpirePendingOrders.php`
- `app/Console/Commands/PruneApplicationDataCommand.php`
- `app/Console/Commands/SyncMaterialProgressCommand.php`
- `app/Jobs/RegenerateCertificatePdfJob.php`
- `app/Jobs/SendWhatsAppEnrollmentNotificationJob.php`
- `app/Jobs/SendPayoutPaidNotificationJob.php`
- `config/maintenance.php`
- `config/queue.php`

## Edge cases

- Without a worker, certificate PDFs are not regenerated after template changes.
- Without cron, pending orders never expire automatically and material progress
  is not reconciled.
- Missing `storage:link` prevents PDF and upload downloads from `/storage`.
- Overlapping scheduled runs are prevented where configured.

## Related guides

- [Certificates](certificates.md)
- [Orders, refunds and chargebacks](orders-refunds-and-chargebacks.md)
- [Learning and progress](learning-and-progress.md)
- [`production-deployment-readiness.md`](../production-deployment-readiness.md)
