<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('appearance_settings', 'certificate_template')) {
            Schema::table('appearance_settings', function (Blueprint $table): void {
                $table->json('certificate_template')->nullable()->after('contact_email');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('appearance_settings', 'certificate_template')) {
            Schema::table('appearance_settings', function (Blueprint $table): void {
                $table->dropColumn('certificate_template');
            });
        }
    }
};
