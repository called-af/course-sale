<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Course;
use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\Module;
use App\Models\User;
use Illuminate\Database\Seeder;

class CourseApprovalSeeder extends Seeder
{
    /**
     * Create one complete instructor course that is ready for admin approval.
     */
    public function run(): void
    {
        $instructor = User::where('email', 'budi@example.com')->firstOrFail();
        $category = Category::where('slug', 'web-development')->firstOrFail();

        $course = Course::firstOrCreate(
            ['slug' => 'laravel-course-ready-for-approval'],
            [
                'creator_id' => $instructor->id,
                'title' => 'Laravel: Course Ready for Admin Approval',
                'description' => 'Course Laravel lengkap dari instructor yang sudah dikirim untuk ditinjau dan disetujui admin.',
                'thumbnail' => 'assets/landscape.jpeg',
                'type' => 'free',
                'price' => null,
                'level' => 'beginner',
                'status' => 'review',
                'published_at' => null,
            ],
        );

        $course->categories()->syncWithoutDetaching([$category->id]);

        $module = Module::firstOrCreate(
            ['course_id' => $course->id, 'sort_order' => 1],
            ['title' => 'Dasar Laravel', 'status' => 'published'],
        );

        $material = Material::firstOrCreate(
            ['module_id' => $module->id, 'sort_order' => 1],
            [
                'title' => 'Pengenalan Routing Laravel',
                'description' => 'Memahami routing dasar untuk aplikasi Laravel.',
                'status' => 'published',
            ],
        );

        MaterialContent::firstOrCreate(
            ['material_id' => $material->id, 'sort_order' => 1],
            [
                'type' => 'text',
                'title' => 'Materi Routing Laravel',
                'content_text' => [[
                    'type' => 'paragraph',
                    'children' => [['text' => 'Route menghubungkan URL dengan aksi pada aplikasi Laravel.']],
                ]],
                'duration' => 10,
                'status' => 'published',
            ],
        );
    }
}
