<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appearance_settings', function (Blueprint $table) {
            $table->string('app_name')->nullable()->after('palette');
            $table->string('contact_email')->nullable()->after('app_name');
        });
    }

    public function down(): void
    {
        Schema::table('appearance_settings', function (Blueprint $table) {
            $table->dropColumn(['app_name', 'contact_email']);
        });
    }
};
