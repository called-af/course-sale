<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Web Development',
                'desc' => 'Learn fullstack web development with modern tools and frameworks.',
            ],
            [
                'name' => 'UI/UX Design',
                'desc' => 'Master user interface design, user experience research, and prototyping.',
            ],
            [
                'name' => 'Mobile Development',
                'desc' => 'Build cross-platform and native mobile applications.',
            ],
            [
                'name' => 'Data Science & AI',
                'desc' => 'Explore machine learning, data analysis, and artificial intelligence.',
            ],
        ];

        foreach ($categories as $cat) {
            Category::firstOrCreate(
                ['slug' => Str::slug($cat['name'])],
                [
                    'name' => $cat['name'],
                    'desc' => $cat['desc'],
                    'img' => null,
                ]
            );
        }
    }
}
