<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Course;
use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\Module;
use App\Models\QuizOption;
use App\Models\QuizQuestion;
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

        $contents = [
            [
                'type' => 'text',
                'title' => 'Pengenalan Routing Laravel',
                'content_text' => [[
                    'type' => 'paragraph',
                    'children' => [['text' => 'Route menghubungkan URL dengan aksi pada aplikasi Laravel.']],
                ]],
                'duration' => 10,
                'status' => 'published',
            ],
            [
                'type' => 'video',
                'title' => 'Video Praktik Routing Laravel',
                'content_url' => 'https://www.youtube.com/watch?v=0xyxtzD54rM',
                'duration' => 12,
                'status' => 'published',
            ],
            [
                'type' => 'file',
                'title' => 'Cheat Sheet Routing Laravel (PDF)',
                'content_url' => 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                'duration' => 5,
                'status' => 'published',
            ],
        ];

        foreach ($contents as $index => $content) {
            MaterialContent::firstOrCreate(
                ['material_id' => $material->id, 'sort_order' => $index + 1],
                $content,
            );
        }

        $quiz = MaterialContent::firstOrCreate(
            ['material_id' => $material->id, 'sort_order' => count($contents) + 1],
            [
                'type' => 'quiz',
                'title' => 'Kuis Dasar Routing Laravel',
                'duration' => 10,
                'status' => 'published',
            ],
        );

        if ($quiz->wasRecentlyCreated) {
            $question = QuizQuestion::create([
                'material_content_id' => $quiz->id,
                'question' => 'Method HTTP mana yang umum dipakai untuk mengambil data?',
                'type' => 'multiple_choice',
                'image' => null,
                'sort_order' => 1,
            ]);

            foreach ([
                ['text' => 'GET', 'correct' => true],
                ['text' => 'POST', 'correct' => false],
                ['text' => 'DELETE', 'correct' => false],
            ] as $option) {
                QuizOption::create([
                    'quiz_question_id' => $question->id,
                    'option_text' => $option['text'],
                    'is_correct' => $option['correct'],
                ]);
            }
        }
    }
}
