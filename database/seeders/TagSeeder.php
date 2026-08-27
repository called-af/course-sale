<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Tag;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TagSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tagsData = [
            'Laravel',
            'PHP',
            'Backend',
            'Frontend',
            'Fullstack',
            'REST API',
            'React',
            'Next.js',
            'JavaScript',
            'TypeScript',
            'Vue',
            'Tailwind CSS',
            'Python',
            'Data Science',
            'Machine Learning',
            'AI',
            'Generative AI',
            'Prompt Engineering',
            'Flutter',
            'Dart',
            'Mobile',
            'iOS',
            'Swift',
            'SwiftUI',
            'UI/UX',
            'Figma',
            'Design Systems',
            'Product Design',
            'Design Thinking',
            'User Research',
            'Docker',
            'Kubernetes',
            'DevOps',
            'Cloud',
            'CI/CD',
            'Microservices',
            'Database',
            'MySQL',
            'PostgreSQL',
            'Web Development',
            'Architecture',
            'Automation',
            'Security',
        ];

        $tags = [];
        foreach ($tagsData as $name) {
            $tags[$name] = Tag::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name]
            );
        }

        // Tag course associations based on course title keywords or matching
        $courseTagMappings = [
            'Fullstack Modern Web Architecture' => [
                'Web Development', 'Fullstack', 'Architecture', 'REST API', 'Backend', 'Frontend', 'Database',
            ],
            'UI/UX Design Systems & Figma Mastery' => [
                'UI/UX', 'Design Systems', 'Figma', 'Frontend', 'Product Design',
            ],
            'Flutter & Dart Cross-Platform Mobile Apps' => [
                'Mobile', 'Flutter', 'Dart', 'Frontend',
            ],
            'Python Data Science & Machine Learning Bootcamp' => [
                'Python', 'Data Science', 'Machine Learning', 'AI', 'Backend',
            ],
            'Laravel 11 RESTful API & Microservices Guide' => [
                'Laravel', 'PHP', 'REST API', 'Microservices', 'Backend', 'Database',
            ],
            'React 19 & Next.js App Router Masterclass' => [
                'React', 'Next.js', 'JavaScript', 'TypeScript', 'Frontend', 'Web Development',
            ],
            'iOS App Development with Swift & SwiftUI' => [
                'iOS', 'Swift', 'SwiftUI', 'Mobile',
            ],
            'AI Prompt Engineering & Generative Workflows' => [
                'AI', 'Prompt Engineering', 'Generative AI', 'Machine Learning', 'Automation',
            ],
            'Product Design & Design Thinking Fundamentals' => [
                'Product Design', 'Design Thinking', 'UI/UX', 'User Research',
            ],
            'Docker, Kubernetes & Cloud DevOps Pipeline' => [
                'Docker', 'Kubernetes', 'DevOps', 'Cloud', 'CI/CD', 'Backend',
            ],
            'Laravel: Course Ready for Admin Approval' => [
                'Laravel', 'PHP', 'Backend', 'REST API',
            ],
        ];

        foreach ($courseTagMappings as $courseTitle => $tagNames) {
            $course = Course::where('title', $courseTitle)->first();
            if ($course) {
                $tagIds = collect($tagNames)
                    ->map(fn ($name) => $tags[$name]->id ?? null)
                    ->filter()
                    ->values()
                    ->all();

                $course->tags()->sync($tagIds);
            }
        }

        // Tag any other courses not in the explicit list by checking keywords in title/desc
        $allCourses = Course::with('tags')->get();
        foreach ($allCourses as $c) {
            if ($c->tags->isEmpty()) {
                $matchedTagIds = [];
                $text = strtolower($c->title.' '.$c->description);
                foreach ($tags as $name => $tagModel) {
                    if (str_contains($text, strtolower($name))) {
                        $matchedTagIds[] = $tagModel->id;
                    }
                }
                if (empty($matchedTagIds)) {
                    // Default fallback tags
                    $matchedTagIds[] = $tags['Web Development']->id;
                }
                $c->tags()->sync($matchedTagIds);
            }
        }
    }
}
