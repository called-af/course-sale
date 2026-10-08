<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('courses')->where('type', 'free')->update(['price' => null]);

        DB::table('courses')->select('id')->orderBy('id')->chunkById(100, function ($courses): void {
            foreach ($courses as $course) {
                $stats = DB::table('reviews')
                    ->where('course_id', $course->id)
                    ->where('is_approved', true)
                    ->selectRaw('AVG(rating) as average_rating, COUNT(*) as rating_count')
                    ->first();

                DB::table('courses')->where('id', $course->id)->update([
                    'rating_avg' => round((float) ($stats->average_rating ?? 0), 2),
                    'rating_count' => (int) ($stats->rating_count ?? 0),
                ]);
            }
        });
    }

    public function down(): void
    {
    }
};