# Migration Reconciliation (Existing DB → Consolidated Migration Set)

This document is for environments that **already have a database with an old
migration history**, while the current code uses a **consolidated create-only
migration set** (`database/migrations/2026_01_01_000001_*` to `000064_*`)
representing the final schema.

> Goal: the database schema matches the final code schema, and the `migrations`
> table matches the consolidated set, **without losing data**.

## Why this is needed

- The `migrations` table on an old database contains names/batches of legacy
  migration files that no longer exist in the new set.
- Many consolidated files call `dropIfExists` followed by `CREATE TABLE`.
  Re-running them against a database with data is **destructive**.
- Therefore, for a database that already contains data, we do **not** re-run
  those consolidated files. We align the schema if needed and then **baseline**
  the migration history.

Known reconciliation migration:

- `2026_11_18_000001_add_google_auth_columns_to_users_table.php` — idempotent
  (safe to run repeatedly; no-op if the schema already matches) for Google auth
  columns/indexes on `users`.

---

## Mandatory principles (all options)

1. Take a **full backup** (database plus `storage/` uploads, certificates and
   documents) and **test the restore**.
2. Rehearse first on **staging** using a clone of production data.
3. Run inside a **maintenance window** where possible; prepare a rollback plan.
4. Afterwards: check `php artisan migrate:status` and run smoke tests (auth/Google
   login, learning and progress, quizzes, payments/webhook, certificates,
   resources, dashboards).

---

## Option A — New DB / data can be reset (simplest)

Suitable for empty local/dev/staging environments or fresh installs.

```bash
# take a backup first if any important data exists
php artisan migrate:fresh --seed
```

- Recreates the schema from the 64 final migrations.
- The idempotent reconciliation migration becomes a no-op if not needed.

---

## Option B — Existing DB, schema already (nearly) matches final (baseline history)

Suitable when the production table/column/index/FK structure already reflects
the final schema and only the `migrations` history is out of sync.

1. **Backup + staging clone** (mandatory).
2. **Compare the staging schema** with the final code schema (tables, columns,
   types, nullable/default, indexes/uniques, FKs).
    - Known changes to check: `users.google_id` (nullable, unique),
      `users.password` nullable, `users.remember_token`, plus tables/columns from
      newer features in the final set.
3. **Fix schema differences additively/idempotently** (never drop data).
   Example:

    ```bash
    php artisan migrate --path=database/migrations/2026_11_18_000001_add_google_auth_columns_to_users_table.php
    ```

    Add new idempotent migrations if other drift is found (check
    `Schema::hasTable` / `hasColumn` and check indexes before creating them).

4. **Baseline the `migrations` table** so consolidated files whose schema is
   already present are marked as run:
    - Save the old `migrations` contents for audit.
    - Ensure every file from `2026_01_01_000001_*` to `000064_*` representing
      an existing schema is recorded in `migrations` (choose a batch according to
      team policy), **without executing its create/drop DDL**.
    - Also mark the reconciliation migration as run if it was applied or needed.
    - Do this carefully, in a transaction/maintenance window where possible.
      Do **not** run plain `php artisan migrate`, which would re-run create-only
      migrations on populated tables.
5. **Verify**:

    ```bash
    php artisan migrate:status
    php artisan migrate
    ```

    The next `migrate` should not execute destructive DDL; only new future
    migrations should run.

6. **Reconcile derived progress data (recommended)**:

    ```bash
    php artisan progress:sync-materials --dry-run
    php artisan progress:sync-materials
    ```

    (Idempotent; resynchronizes the `material_progress` cache from
    `material_content_progress`.)

---

## Option C — Existing DB, schema unknown/different (diff → forward-only migration)

Suitable when you are not sure the schema already matches the final one.

1. **Backup + staging clone**.
2. Inventory differences between the actual schema and the final schema.
3. Write **forward-only, idempotent** migrations to bring the DB to the final
   schema **without dropping data** (follow the `users` reconciliation pattern).
4. Once the schema matches, baseline the history as in Option B steps 4–6.
5. Never run `migrate:fresh` on production data.

---

## Post-reconciliation checklist

- [ ] `php artisan migrate:status` is clean/as expected
- [ ] `php artisan progress:sync-materials` (if learning data exists)
- [ ] `php artisan storage:link` and storage permissions are correct
- [ ] Queue worker and scheduler are running (if used)
- [ ] Smoke test: login/Google OAuth, enrollment and learning, progress/resume,
      quizzes, checkout and payment webhook, certificates, resources, dashboards
- [ ] Monitoring/logs are free of migration and schema errors

---

## Notes

- Baseline migration history is an operational action. Record who/when/which DB/
  which batch for audit.
- For the previous dual-progress issue (material vs content), the system now
  treats `material_content_progress` as the source of truth and
  `material_progress` as a derived cache synchronized/revoked by the backend.
  Use `progress:sync-materials` for backfill and recovery.
