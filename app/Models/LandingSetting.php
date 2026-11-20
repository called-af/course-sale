<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LandingSetting extends Model
{
    public const SECTION_HERO = 'hero';

    public const SECTION_ABOUT = 'about';

    public const SECTION_COURSES = 'courses';

    public const SECTION_CAREER = 'career';

    public const SECTION_INSTRUCTOR = 'instructor';

    public const SECTION_HOW_IT_WORKS = 'how_it_works';

    public const SECTION_BENEFIT = 'benefit';

    public const SECTION_CERTIFICATE = 'certificate';

    public const SECTION_TESTIMONIAL = 'testimonial';

    public const SECTION_FAQ = 'faq';

    public const SECTION_TRUST = 'trust';

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
        self::SECTION_INSTRUCTOR,
        self::SECTION_HOW_IT_WORKS,
        self::SECTION_BENEFIT,
        self::SECTION_CERTIFICATE,
        self::SECTION_TESTIMONIAL,
        self::SECTION_FAQ,
        self::SECTION_TRUST,
        self::SECTION_CTA,
        self::SECTION_FOOTER,
    ];

    public const LABELS = [
        self::SECTION_HERO => 'Hero',
        self::SECTION_ABOUT => 'About',
        self::SECTION_COURSES => 'Courses',
        self::SECTION_CAREER => 'Career',
        self::SECTION_INSTRUCTOR => 'Instructors',
        self::SECTION_HOW_IT_WORKS => 'How it works',
        self::SECTION_BENEFIT => 'Benefits',
        self::SECTION_CERTIFICATE => 'Certificate',
        self::SECTION_TESTIMONIAL => 'Testimonials',
        self::SECTION_FAQ => 'FAQ',
        self::SECTION_TRUST => 'Trust bar',
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
                'show' => true,
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
                'show' => true,
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
                'show' => true,
                'badge' => 'Explore Courses',
                'title_lead' => "Find the Course That's ",
                'title_highlight' => 'Right for You',
                'description' => 'Learn from industry practitioners through curated courses designed to move your career forward.',
                'limit' => 8,
                'cta_label' => 'View All Courses',
                'cta_href' => '/course',
            ],

            self::SECTION_CAREER => [
                'show' => true,
                'badge' => 'Career Paths',
                'title_lead' => 'Choose the Career Path ',
                'title_highlight' => 'You Want',
                'description' => "Each path is designed with industry practitioners to ensure you're job-ready.",
                'cta_label' => 'Explore All Paths',
                'cta_href' => '/course',
            ],

            self::SECTION_INSTRUCTOR => [
                'show' => true,
                'badge' => 'Instructors',
                'title_lead' => 'Learn From ',
                'title_highlight' => 'Practitioners',
                'description' => 'Every course is taught by someone who does the work, not just talks about it.',
                'cta_label' => 'Browse all instructors',
                'cta_href' => '/course',
                // 'selected' shows only chosen instructors; 'all' shows every instructor.
                'mode' => 'selected',
                'selected_ids' => [],
                // 'selected' preserves admin order, otherwise sort by courses/students/name.
                'sort' => 'courses',
                'limit' => 4,
                'default_role' => 'Instructor',
            ],

            self::SECTION_HOW_IT_WORKS => [
                'show' => true,
                'badge' => 'How it works',
                'title_lead' => 'From Sign Up to ',
                'title_highlight' => 'Certificate',
                'description' => 'Four simple steps. No hidden fees, no complicated enrolment.',
                'note' => 'Most learners finish their first lesson within ten minutes of checkout.',
                'steps' => [
                    ['title' => 'Pick your course', 'description' => 'Browse by category or search directly. Every course page shows the full curriculum before you commit.', 'icon' => 'search'],
                    ['title' => 'Checkout securely', 'description' => 'Pay with a bank transfer, e-wallet or card. Your seat is confirmed the moment payment clears.', 'icon' => 'credit-card'],
                    ['title' => 'Learn at your pace', 'description' => 'Lifetime access to every lesson, resource and future update — on desktop or mobile.', 'icon' => 'play-circle'],
                    ['title' => 'Earn your certificate', 'description' => 'Finish the course and download a verifiable certificate you can add to your CV and LinkedIn.', 'icon' => 'award'],
                ],
            ],

            self::SECTION_BENEFIT => [
                'show' => true,
                'badge' => 'Why learn with us',
                'title_lead' => 'Everything You Need to ',
                'title_highlight' => 'Keep Growing',
                'description' => 'The support system around the course matters as much as the lessons themselves.',
                'audiences' => ['Career switchers', 'Working professionals', 'Students & fresh graduates'],
                'benefits' => [
                    ['title' => 'Lifetime access', 'description' => 'Buy once and revisit every lesson whenever you need it. No subscriptions, no expiry date.', 'icon' => 'infinity'],
                    ['title' => 'Always up to date', 'description' => 'When the industry moves, the curriculum follows. Updates are included at no extra cost.', 'icon' => 'refresh'],
                    ['title' => 'Verified certificate', 'description' => 'Finish the course and get a certificate with a unique number anyone can verify online.', 'icon' => 'award'],
                    ['title' => 'Community & mentoring', 'description' => 'Ask questions, share work and get feedback from instructors and fellow learners.', 'icon' => 'messages'],
                    ['title' => 'Downloadable resources', 'description' => 'Slides, templates, datasets and code samples are yours to keep and use in real projects.', 'icon' => 'download'],
                    ['title' => '7-day money back', 'description' => 'Not the right fit? Request a refund within seven days of purchase, no questions asked.', 'icon' => 'shield'],
                ],
            ],

            self::SECTION_CERTIFICATE => [
                'show' => true,
                'badge' => 'Certificate',
                'title_lead' => 'Proof of Work, ',
                'title_highlight' => 'Not Just Points',
                'description' => 'Every completed course ends with a certificate you can actually use — share it, print it, or let employers verify it in seconds.',
                'points' => [
                    'Downloadable PDF, ready for LinkedIn',
                    'Unique certificate number anyone can verify',
                    'Recognised by our hiring and industry partners',
                ],
                'cta_label' => 'Start learning',
                'cta_href' => '/course',
                // 'latest' auto-fills from real issued certificates; 'featured' uses chosen IDs.
                'mode' => 'latest',
                'featured_ids' => [],
                'limit' => 3,
                'rotate' => true,
                'rotate_seconds' => 6,
                // On a fresh site (no certificates yet) show a clearly-labelled preview.
                'show_sample_when_empty' => true,
            ],

            self::SECTION_TESTIMONIAL => [
                'show' => true,
                'badge' => 'Testimonials',
                'title_lead' => 'What Our ',
                'title_highlight' => 'Learners Say',
                'description' => 'Real stories from people who changed their careers with us — from first lesson to first offer.',
                'limit' => 6,
                'min_rating' => 4,
            ],

            self::SECTION_FAQ => [
                'show' => true,
                'badge' => 'FAQ',
                'title_lead' => 'Questions, ',
                'title_highlight' => 'Answered',
                'description' => 'Still unsure about something? These are the things learners ask us most often before enrolling.',
                'items' => [
                    ['question' => 'How long do I have access to a course?', 'answer' => 'Forever. Once you enrol, the course stays in your account with no expiry date, including all future updates to its lessons and resources.'],
                    ['question' => 'Do I get a certificate when I finish?', 'answer' => 'Yes. Every course issues a certificate with a unique number as soon as you complete the final lesson. You can download the PDF and share a public verification link.'],
                    ['question' => 'What payment methods are supported?', 'answer' => 'Bank transfer (BCA, Mandiri, BNI, BRI), e-wallets (GoPay, OVO, DANA, ShopeePay), QRIS, and credit or debit cards. All payments are processed through a secure payment gateway.'],
                    ['question' => 'Can I get a refund if the course is not for me?', 'answer' => 'You can request a refund within seven days of purchase as long as you have not completed more than a small portion of the course. Refunds are processed back to your original payment method.'],
                    ['question' => 'Are the lessons live or recorded?', 'answer' => 'Lessons are recorded so you can learn on your own schedule. Some courses also include live Q&A sessions and community discussions with the instructor.'],
                    ['question' => 'Can I download the course materials?', 'answer' => 'Yes, where the instructor provides them. Slides, templates, code samples and datasets attached to a lesson are available to download from your dashboard.'],
                    ['question' => 'Do I need prior experience to start?', 'answer' => 'Each course page lists its level and prerequisites. Beginner courses start from the fundamentals, while advanced courses assume you already know the basics.'],
                    ['question' => 'Can I access courses on my phone?', 'answer' => 'Yes. The platform is responsive and works in any modern mobile browser, so you can continue watching lessons on the go.'],
                ],
            ],

            self::SECTION_TRUST => [
                'show' => true,
                'payment_methods' => ['BCA', 'Mandiri', 'BNI', 'BRI', 'QRIS', 'GoPay', 'OVO', 'DANA', 'Visa', 'Mastercard'],
                // Admin-uploaded logos, keyed by normalized payment-method label.
                'payment_logos' => [],
                'guarantees' => ['7-day money-back guarantee', 'Encrypted payment gateway', 'Instant course access'],
            ],

            self::SECTION_CTA => [
                'show' => true,
                'title_line_1' => 'Ready to Turn Complexity',
                'title_line_2' => 'into',
                'title_highlight' => 'Clarity?',
                'primary_label' => 'Start Now',
                'primary_href' => '/register',
                'secondary_label' => 'Book a Demo',
                'secondary_href' => '/course',
            ],

            self::SECTION_FOOTER => [
                'show' => true,
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

    /** Whether an admin has chosen to show this section on the landing page. */
    public static function visible(string $section): bool
    {
        return (bool) (self::content($section)['show'] ?? true);
    }

    /**
     * Read a clamped integer setting, ignoring malformed admin input.
     */
    public static function intSetting(string $section, string $key, int $default, int $min, int $max): int
    {
        $value = self::content($section)[$key] ?? $default;

        return max($min, min($max, (int) $value));
    }

    /**
     * Read a list of non-empty strings, ignoring malformed admin input.
     *
     * @return list<string>
     */
    public static function stringList(string $section, string $key): array
    {
        $value = self::content($section)[$key] ?? [];

        if (! is_array($value)) {
            return [];
        }

        return array_values(array_filter($value, fn ($item) => is_string($item) && trim($item) !== ''));
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
