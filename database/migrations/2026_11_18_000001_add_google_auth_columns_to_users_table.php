<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'google_id')) {
                $table->string('google_id')->nullable()->after('password');
            }

            if (! Schema::hasColumn('users', 'remember_token')) {
                $table->rememberToken()->after('email_verified_at');
            }
        });

        if (Schema::hasColumn('users', 'password')) {
            // Google-authenticated users may not have a local password.
            DB::statement('ALTER TABLE `users` MODIFY `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL');
        }

        $this->ensureGoogleIdUniqueIndex();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        $this->dropGoogleIdUniqueIndex();

        Schema::table('users', function (Blueprint $table): void {
            $columns = array_values(array_filter([
                Schema::hasColumn('users', 'google_id') ? 'google_id' : null,
                Schema::hasColumn('users', 'remember_token') ? 'remember_token' : null,
            ]));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });

        if (Schema::hasColumn('users', 'password')) {
            DB::statement('ALTER TABLE `users` MODIFY `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL');
        }
    }

    private function ensureGoogleIdUniqueIndex(): void
    {
        if (! Schema::hasColumn('users', 'google_id') || $this->hasIndex('users', 'users_google_id_unique')) {
            return;
        }

        Schema::table('users', function (Blueprint $table): void {
            $table->unique('google_id', 'users_google_id_unique');
        });
    }

    private function dropGoogleIdUniqueIndex(): void
    {
        if (! $this->hasIndex('users', 'users_google_id_unique')) {
            return;
        }

        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique('users_google_id_unique');
        });
    }

    private function hasIndex(string $table, string $index): bool
    {
        $connection = Schema::getConnection();
        $database = $connection->getDatabaseName();

        $result = $connection->selectOne(
            'select count(*) as aggregate from information_schema.statistics where table_schema = ? and table_name = ? and index_name = ?',
            [$database, $table, $index]
        );

        return (int) ($result->aggregate ?? 0) > 0;
    }
};
