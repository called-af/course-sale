<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LandingSetting extends Model
{
    public const SECTION_HERO = 'hero';

    public const SECTION_ABOUT = 'about';

    public const SECTION_COURSES = 'courses';

    public const SECTION_CAREER = 'career';

    public const SECTION_TESTIMONIAL = 'testimonial';

    public const SECTION_CTA = 'cta';

    public const SECTION_FOOTER = 'footer';

    /**
     * Sections in the order they appear on the landing page.
     *
     * @var list<string>
     */
    public const SECTIONS = [
        self::SECTION_HERO,
        self::SECTION_ABOUT,
        self::SECTION_COURSES,
        self::SECTION_CAREER,
        self::SECTION_TESTIMONIAL,
        self::SECTION_CTA,
        self::SECTION_FOOTER,
    ];

    public const LABELS = [
        self::SECTION_HERO => 'Hero',
        self::SECTION_ABOUT => 'About',
        self::SECTION_COURSES => 'Courses',
        self::SECTION_CAREER => 'Career',
        self::SECTION_TESTIMONIAL => 'Testimonial',
        self::SECTION_CTA => 'CTA',
        self::SECTION_FOOTER => 'Footer',
    ];

    protected $fillable = [
        'section',
        'content',
    ];

    protected function casts(): array
    {
        return [
            'content' => 'array',
        ];
    }

    /** @var array<string, array<string, mixed>>|null */
    private static ?array $cache = null;

    /**
     * Default content for every landing section.
     *
     * @return array<string, array<string, mixed>>
     */
    public static function defaults(): array
    {
        return [
            self::SECTION_HERO => [
                'badge' => "Indonesia's #1 Learning Platform",
                'title_lead' => 'Master Skills',
                'title_highlight' => 'With Expert.',
                'subtitle' => 'Join thousands of learners who have transformed their careers through high-quality courses and experienced mentors.',
                'primary_label' => 'Explore Courses',
                'primary_href' => '/course',
                'secondary_label' => 'Watch Demo',
                'secondary_href' => '#',
                'rating' => '4.9',
                'learners_label' => '50,000+',
                'learners_suffix' => 'active learners',
                'avatars' => [
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80&fit=crop&crop=face',
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80&fit=crop&crop=face',
                    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80&fit=crop&crop=face',
                    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80&fit=crop&crop=face',
                ],
                'photos' => [
                    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80&fit=crop',
                    'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&q=80&fit=crop',
                    'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&q=80&fit=crop',
                    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80&fit=crop',
                    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80&fit=crop',
                ],
            ],

            self::SECTION_ABOUT => [
                'title_lead' => "We're here to ",
                'title_highlight' => 'transform',
                'title_tail' => ' the way people learn',
                'paragraph_1' => '{brand} was born from the belief that quality education should be accessible to everyone, everywhere. We bring together the best instructors, industry-relevant curriculum, and a community that supports each other.',
                'paragraph_2' => "Since 2019, we've helped tens of thousands of learners develop their digital skills and land their dream jobs — from local startups to Fortune 500 companies.",
                'highlights' => [
                    'Expert-led, industry-relevant curriculum',
                    'Learn at your own pace, from anywhere',
                    'A community that supports each other',
                ],
                'stats' => [
                    ['value' => '2019', 'label' => 'Founded'],
                    ['value' => '50K+', 'label' => 'Active Learners'],
                    ['value' => '200+', 'label' => 'Courses Available'],
                    ['value' => '98%', 'label' => 'Satisfaction Rate'],
                ],
                'eyebrow' => 'By the numbers',
                'since_label' => 'Since 2019',
                'cta_label' => 'Discover our story',
                'cta_href' => '/#about',
            ],

            self::SECTION_COURSES => [
                'badge' => 'Explore Courses',
                'title_lead' => "Find the Course That's ",
                'title_highlight' => 'Right for You',
                'description' => 'Learn from industry practitioners through curated courses designed to move your career forward.',
                'limit' => 8,
                'cta_label' => 'View All Courses',
                'cta_href' => '/course',
            ],

            self::SECTION_CAREER => [
                'badge' => 'Career Paths',
                'title_lead' => 'Choose the Career Path ',
                'title_highlight' => 'You Want',
                'description' => "Each path is designed with industry practitioners to ensure you're job-ready.",
                'cta_label' => 'Explore All Paths',
                'cta_href' => '/course',
            ],

            self::SECTION_TESTIMONIAL => [
                'badge' => 'Testimonials',
                'title_lead' => 'What Our ',
                'title_highlight' => 'Learners Say',
                'description' => 'Real stories from people who changed their careers with us — from first lesson to first offer.',
                'limit' => 6,
                'min_rating' => 4,
            ],

            self::SECTION_CTA => [
                'title_line_1' => 'Ready to Turn Complexity',
                'title_line_2' => 'into',
                'title_highlight' => 'Clarity?',
                'primary_label' => 'Start Now',
                'primary_href' => '/register',
                'secondary_label' => 'Book a Demo',
                'secondary_href' => '/course',
            ],

            self::SECTION_FOOTER => [
                'address' => 'Jl. Jend. Sudirman Kav. 52, Jakarta 12190, Indonesia',
                'phone' => '+62 21 5050 5050',
                'email' => '',
                'columns' => [
                    [
                        'title' => 'Product',
                        'links' => [
                            ['label' => 'Courses', 'href' => '/course'],
                            ['label' => 'Recommended Courses', 'href' => '/courses/recommended'],
                        ],
                    ],
                    [
                        'title' => 'Account',
                        'links' => [
                            ['label' => 'Sign In', 'href' => '/login'],
                            ['label' => 'Create Account', 'href' => '/register'],
                        ],
                    ],
                ],
                'socials' => [
                    ['name' => 'LinkedIn', 'href' => 'https://www.linkedin.com/'],
                    ['name' => 'Facebook', 'href' => 'https://www.facebook.com/'],
                    ['name' => 'YouTube', 'href' => 'https://www.youtube.com/'],
                ],
                'legal' => [
                    ['label' => 'Terms of Service', 'href' => '/terms'],
                    ['label' => 'Privacy Policy', 'href' => '/privacy'],
                ],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function defaultsFor(string $section): array
    {
        return self::defaults()[$section] ?? [];
    }

    /**
     * All landing sections merged with their stored overrides.
     *
     * @return array<string, array<string, mixed>>
     */
    public static function allSections(): array
    {
        if (self::$cache !== null) {
            return self::$cache;
        }

        $stored = self::query()->get()->keyBy('section');
        $settings = [];

        foreach (self::defaults() as $section => $default) {
            $row = $stored->get($section);
            $content = $row && is_array($row->content) ? $row->content : [];

            $settings[$section] = self::merge($default, $content);
        }

        return self::$cache = $settings;
    }

    /**
     * @return array<string, mixed>
     */
    public static function content(string $section): array
    {
        return self::allSections()[$section] ?? [];
    }

    /**
     * @param  array<string, mixed>  $content
     */
    public static function put(string $section, array $content): void
    {
        $merged = self::merge(self::defaultsFor($section), $content);

        self::query()->updateOrCreate(
            ['section' => $section],
            ['content' => $merged],
        );

        self::$cache = null;
    }

    /**
     * Merge stored content over defaults. Associative arrays merge deeply,
     * list arrays (stats, links, photos...) are replaced as a whole.
     *
     * @param  array<string, mixed>  $defaults
     * @param  array<string, mixed>  $content
     * @return array<string, mixed>
     */
    private static function merge(array $defaults, array $content): array
    {
        $result = $defaults;

        foreach ($content as $key => $value) {
            $default = $defaults[$key] ?? null;

            if (
                is_array($value)
                && is_array($default)
                && ! array_is_list($value)
                && ! array_is_list($default)
            ) {
                $result[$key] = self::merge($default, $value);

                continue;
            }

            $result[$key] = $value;
        }

        return $result;
    }
}
