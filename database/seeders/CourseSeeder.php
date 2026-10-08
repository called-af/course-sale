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
use Illuminate\Support\Str;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        $adminUser = User::where('role', 'admin')->first();

        if (! $adminUser) {
            $adminUser = User::create([
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => bcrypt('password'),
                'role' => 'admin',
            ]);
        }

        // Ambil semua instructor (lebih dari 1)
        $instructors = User::where('role', 'instructor')->get();

        if ($instructors->isEmpty()) {
            $instructors = collect([$adminUser]);
        }

        $ytUrl = 'https://www.youtube.com/watch?v=0xyxtzD54rM&list=RD0xyxtzD54rM&start_radio=1';
        $pdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
        $pptUrl = 'https://www.slideshare.net';

        $categoriesMap = Category::all()->keyBy('name');

        // Mapping: course index => instructor index (round-robin di antara 3 instructor)
        // 10 courses total, distribusi: Budi(0,3,6,9), Rina(1,4,7), Dika(2,5,8)
        $coursesData = [
            // === Budi Santoso (index 0) ===
            [
                'title' => 'Fullstack Modern Web Architecture',
                'category' => 'Web Development',
                'type' => 'paid',
                'price' => 350000,
                'level' => 'intermediate',
                'status' => 'published',
                'description' => 'Master fullstack modern web development with RESTful APIs, database design, modern frontend frameworks, and clean code architecture.',
                'modules' => [
                    [
                        'title' => 'Module 1: Architecture & API Fundamentals',
                        'materials' => [
                            [
                                'title' => 'Introduction to Clean Architecture',
                                'desc' => 'Core principles of web system architecture and API design.',
                                'contents' => [
                                    ['type' => 'video', 'title' => 'System Architecture Overview Video', 'url' => $ytUrl, 'duration' => 20],
                                    ['type' => 'text', 'title' => 'REST API Design Guidelines & Best Practices', 'duration' => 15, 'text' => 'RESTful APIs communicate using HTTP methods. Ensure stateless endpoints, standardized JSON responses, and proper HTTP status codes.'],
                                    ['type' => 'file', 'title' => 'REST API Quick Reference Card (PDF)', 'url' => $pdfUrl, 'duration' => 5],
                                ],
                            ],
                            [
                                'title' => 'Database Normalization & Query Tuning',
                                'desc' => 'Database relationships, indexes, and performance optimization.',
                                'contents' => [
                                    ['type' => 'video', 'title' => 'Database Schema Design Tutorial', 'url' => $ytUrl, 'duration' => 25],
                                    ['type' => 'file', 'title' => 'Database Schema Cheat Sheet (PDF)', 'url' => $pdfUrl, 'duration' => 5],
                                    ['type' => 'text', 'title' => 'Index Strategy & Query Optimization Tips', 'duration' => 12, 'text' => 'Proper indexing reduces query execution time from O(n) to O(log n). Use EXPLAIN to analyze slow queries.'],
                                ],
                            ],
                            [
                                'title' => 'Authentication & Authorization Patterns',
                                'desc' => 'JWT, OAuth2, and RBAC implementation strategies.',
                                'contents' => [
                                    ['type' => 'video', 'title' => 'JWT Authentication Deep Dive', 'url' => $ytUrl, 'duration' => 18],
                                    ['type' => 'text', 'title' => 'RBAC vs ABAC Authorization Models', 'duration' => 10, 'text' => 'Role-Based Access Control assigns permissions to roles. Attribute-Based Access Control evaluates policies based on attributes.'],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Module 2: Interactive Testing & Knowledge Evaluation',
                        'materials' => [
                            [
                                'title' => 'Fullstack Skills Assessment',
                                'desc' => 'Evaluate your knowledge with interactive quiz and essay exercises.',
                                'contents' => [
                                    [
                                        'type' => 'quiz',
                                        'title' => 'Web Architecture Evaluation Quiz',
                                        'duration' => 20,
                                        'questions' => [
                                            [
                                                'q' => 'What is the main advantage of RESTful statelessness?',
                                                'type' => 'multiple_choice',
                                                'options' => [
                                                    ['text' => 'Allows server to maintain client session memory', 'correct' => false],
                                                    ['text' => 'Improves scalability as any server can process any request', 'correct' => true],
                                                    ['text' => 'Directly executes SQL queries on client side', 'correct' => false],
                                                    ['text' => 'Eliminates the need for HTTP headers', 'correct' => false],
                                                ],
                                            ],
                                            [
                                                'q' => 'Which HTTP code indicates created resource?',
                                                'type' => 'multiple_choice',
                                                'options' => [
                                                    ['text' => '200 OK', 'correct' => false],
                                                    ['text' => '201 Created', 'correct' => true],
                                                    ['text' => '400 Bad Request', 'correct' => false],
                                                    ['text' => '500 Server Error', 'correct' => false],
                                                ],
                                            ],
                                            [
                                                'q' => 'Explain the differences between SQL and NoSQL databases.',
                                                'type' => 'essay',
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Module 3: Slides & Deployment Resources',
                        'materials' => [
                            [
                                'title' => 'Deployment & Production Assets',
                                'desc' => 'Download course slides and deployment cheat sheets.',
                                'contents' => [
                                    ['type' => 'ppt', 'title' => 'Production Architecture Presentation Deck', 'url' => $pptUrl, 'duration' => 15],
                                    ['type' => 'file', 'title' => 'Deployment Checklist & Config (PDF)', 'url' => $pdfUrl, 'duration' => 10],
                                    ['type' => 'video', 'title' => 'Zero-Downtime Deployment Strategies', 'url' => $ytUrl, 'duration' => 14],
                                ],
                            ],
                        ],
                    ],
                ],
            ],

            // === Rina Wijaya (index 1) ===
            [
                'title' => 'UI/UX Design Systems & Figma Mastery',
                'category' => 'UI/UX Design',
                'type' => 'free',
                'price' => 0,
                'level' => 'beginner',
                'status' => 'published',
                'description' => 'Learn professional UI/UX design systems, component libraries, auto layout, and interactive prototyping in Figma.',
                'modules' => [
                    [
                        'title' => 'Module 1: Figma Foundations & Components',
                        'materials' => [
                            [
                                'title' => 'Figma Basics & Interface Guide',
                                'desc' => 'Navigating Figma workspace and essential shortcut keys.',
                                'contents' => [
                                    ['type' => 'video', 'title' => 'Figma Crash Course Video', 'url' => $ytUrl, 'duration' => 18],
                                    ['type' => 'text', 'title' => 'Design Token & Typography System Guide', 'duration' => 12, 'text' => 'Design tokens capture visual properties like color, font size, and spacing into reusable code variables across platforms.'],
                                    ['type' => 'file', 'title' => 'Figma Shortcut Reference Sheet (PDF)', 'url' => $pdfUrl, 'duration' => 3],
                                ],
                            ],
                            [
                                'title' => 'Auto Layout & Component Variants',
                                'desc' => 'Master Figma Auto Layout and build reusable component variants.',
                                'contents' => [
                                    ['type' => 'video', 'title' => 'Auto Layout Masterclass', 'url' => $ytUrl, 'duration' => 22],
                                    ['type' => 'text', 'title' => 'Component Variants & Interactive States', 'duration' => 10, 'text' => 'Variants allow you to organize related component variations within a single component set.'],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Module 2: User Testing & Quiz Evaluation',
                        'materials' => [
                            [
                                'title' => 'Design Knowledge Check',
                                'desc' => 'Test your understanding of UI/UX principles.',
                                'contents' => [
                                    [
                                        'type' => 'quiz',
                                        'title' => 'UI/UX Design Principles Quiz',
                                        'duration' => 15,
                                        'questions' => [
                                            [
                                                'q' => 'What is the primary objective of Auto Layout in Figma?',
                                                'type' => 'multiple_choice',
                                                'options' => [
                                                    ['text' => 'To convert vector shapes into raster images', 'correct' => false],
                                                    ['text' => 'To build dynamic responsive components that adapt to content size', 'correct' => true],
                                                    ['text' => 'To compress exported PNG files', 'correct' => false],
                                                    ['text' => 'To generate database schemas automatically', 'correct' => false],
                                                ],
                                            ],
                                            [
                                                'q' => 'Describe the 60-30-10 color rule in UI design.',
                                                'type' => 'essay',
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Module 3: Design Assets & Presentation',
                        'materials' => [
                            [
                                'title' => 'Figma UI Kits & Presentation Slides',
                                'desc' => 'Download UI kit templates and design presentation decks.',
                                'contents' => [
                                    ['type' => 'ppt', 'title' => 'UI/UX Case Study Presentation Deck', 'url' => $pptUrl, 'duration' => 20],
                                    ['type' => 'file', 'title' => 'UI Design Systems Guidelines (PDF)', 'url' => $pdfUrl, 'duration' => 10],
                                    ['type' => 'video', 'title' => 'Presenting Your Design to Stakeholders', 'url' => $ytUrl, 'duration' => 12],
                                ],
                            ],
                        ],
                    ],
                ],
            ],

            // === Dika Pratama (index 2) ===
            [
                'title' => 'Flutter & Dart Cross-Platform Mobile Apps',
                'category' => 'Mobile Development',
                'type' => 'paid',
                'price' => 450000,
                'level' => 'intermediate',
                'status' => 'published',
                'description' => 'Build high-performance native iOS and Android apps from a single codebase using Flutter 3 and Dart.',
                'modules' => [
                    [
                        'title' => 'Module 1: Flutter Widgets & State Management',
                        'materials' => [
                            [
                                'title' => 'Stateless vs Stateful Widgets',
                                'desc' => 'Understanding Flutter widget tree lifecycle and rendering.',
                                'contents' => [
                                    ['type' => 'video', 'title' => 'Flutter Widget Architecture Tutorial', 'url' => $ytUrl, 'duration' => 22],
                                    ['type' => 'text', 'title' => 'Dart Async & Reactive Programming', 'duration' => 15, 'text' => 'Futures and Streams in Dart handle asynchronous data flow efficiently.'],
                                    ['type' => 'file', 'title' => 'Flutter Widget Reference Guide (PDF)', 'url' => $pdfUrl, 'duration' => 5],
                                ],
                            ],
                            [
                                'title' => 'State Management with Riverpod & Bloc',
                                'desc' => 'Comparing state management solutions in Flutter apps.',
                                'contents' => [
                                    ['type' => 'video', 'title' => 'Riverpod vs Bloc State Management', 'url' => $ytUrl, 'duration' => 28],
                                    ['type' => 'text', 'title' => 'Provider Pattern vs Riverpod Best Practices', 'duration' => 12, 'text' => 'Riverpod improves on Provider by removing context dependency and enabling compile-time safety.'],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Module 2: Flutter Assessment & Hands-On Quiz',
                        'materials' => [
                            [
                                'title' => 'Flutter Skill Evaluation',
                                'desc' => 'Test your Flutter knowledge with interactive quizzes.',
                                'contents' => [
                                    [
                                        'type' => 'quiz',
                                        'title' => 'Flutter State Management Quiz',
                                        'duration' => 15,
                                        'questions' => [
                                            [
                                                'q' => 'Which keyword in Dart marks a function as asynchronous?',
                                                'type' => 'multiple_choice',
                                                'options' => [
                                                    ['text' => 'defer', 'correct' => false],
                                                    ['text' => 'async', 'correct' => true],
                                                    ['text' => 'thread', 'correct' => false],
                                                    ['text' => 'isolate', 'correct' => false],
                                                ],
                                            ],
                                            [
                                                'q' => 'How does Flutter achieve high frame-rate native rendering?',
                                                'type' => 'essay',
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Module 3: Flutter Resources & Slide Deck',
                        'materials' => [
                            [
                                'title' => 'App Publishing & Architecture Slides',
                                'desc' => 'Download App Store / Play Store release guides.',
                                'contents' => [
                                    ['type' => 'ppt', 'title' => 'Flutter App Architecture Presentation', 'url' => $pptUrl, 'duration' => 15],
                                    ['type' => 'file', 'title' => 'Play Store / App Store Release Checklist (PDF)', 'url' => $pdfUrl, 'duration' => 10],
                                    ['type' => 'video', 'title' => 'Publishing Flutter App to Production', 'url' => $ytUrl, 'duration' => 18],
                                ],
                            ],
                        ],
                    ],
                ],
            ],

            // === Budi Santoso (index 3) ===
            [
                'title' => 'Python Data Science & Machine Learning Bootcamp',
                'category' => 'Data Science & AI',
                'type' => 'paid',
                'price' => 599000,
                'level' => 'advanced',
                'status' => 'published',
                'description' => 'Comprehensive data science bootcamp covering Pandas, NumPy, Scikit-Learn, TensorFlow, and predictive machine learning models.',
                'modules' => [
                    [
                        'title' => 'Module 1: Data Analysis with Pandas & NumPy',
                        'materials' => [
                            [
                                'title' => 'Data Wrangling & Cleaning',
                                'desc' => 'Cleaning raw datasets and feature engineering.',
                                'contents' => [
                                    ['type' => 'video', 'title' => 'Pandas Dataframes Masterclass Video', 'url' => $ytUrl, 'duration' => 30],
                                    ['type' => 'text', 'title' => 'Exploratory Data Analysis (EDA) Techniques', 'duration' => 15, 'text' => 'EDA uses summary statistics and visualization to discover data patterns and anomalies before model training.'],
                                    ['type' => 'file', 'title' => 'Pandas & NumPy Cheat Sheet (PDF)', 'url' => $pdfUrl, 'duration' => 5],
                                ],
                            ],
                            [
                                'title' => 'Data Visualization with Matplotlib & Seaborn',
                                'desc' => 'Create insightful charts and statistical plots.',
                                'contents' => [
                                    ['type' => 'video', 'title' => 'Data Visualization Masterclass', 'url' => $ytUrl, 'duration' => 25],
                                    ['type' => 'text', 'title' => 'Choosing the Right Chart for Your Data', 'duration' => 10, 'text' => 'Bar charts for categorical comparisons, line charts for trends, scatter plots for correlations.'],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Module 2: Machine Learning Models & Evaluation',
                        'materials' => [
                            [
                                'title' => 'Supervised & Unsupervised Learning Quiz',
                                'desc' => 'Interactive quiz on classification and regression algorithms.',
                                'contents' => [
                                    [
                                        'type' => 'quiz',
                                        'title' => 'Machine Learning Fundamentals Quiz',
                                        'duration' => 20,
                                        'questions' => [
                                            [
                                                'q' => 'Which metric is best suited for imbalanced classification tasks?',
                                                'type' => 'multiple_choice',
                                                'options' => [
                                                    ['text' => 'Accuracy', 'correct' => false],
                                                    ['text' => 'F1-Score / AUC-ROC', 'correct' => true],
                                                    ['text' => 'Mean Squared Error', 'correct' => false],
                                                    ['text' => 'R-Squared', 'correct' => false],
                                                ],
                                            ],
                                            [
                                                'q' => 'Explain overfitting and methods to prevent it.',
                                                'type' => 'essay',
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Module 3: ML Resources & Slide Deck',
                        'materials' => [
                            [
                                'title' => 'Machine Learning Slides & Cheat Sheets',
                                'desc' => 'Download Jupyter notebooks and model presentation decks.',
                                'contents' => [
                                    ['type' => 'ppt', 'title' => 'Machine Learning Pipeline Presentation', 'url' => $pptUrl, 'duration' => 20],
                                    ['type' => 'file', 'title' => 'Python Data Science Formula Sheet (PDF)', 'url' => $pdfUrl, 'duration' => 10],
                                    ['type' => 'video', 'title' => 'Deploying ML Models to Production', 'url' => $ytUrl, 'duration' => 22],
                                ],
                            ],
                        ],
                    ],
                ],
            ],

            // === Rina Wijaya (index 4) ===
            [
                'title' => 'Laravel 11 RESTful API & Microservices Guide',
                'category' => 'Web Development',
                'type' => 'paid',
                'price' => 299000,
                'level' => 'advanced',
                'status' => 'published',
                'description' => 'Build robust enterprise APIs in Laravel 11 using Sanctum, API Resources, Service Pattern, and Queue Workers.',
                'modules' => [
                    [
                        'title' => 'Module 1: Laravel Service Layer & DTOs',
                        'materials' => [
                            [
                                'title' => 'Decoupling Controllers with Services',
                                'desc' => 'Refactoring fat controllers into dedicated Domain Services.',
                                'contents' => [
                                    ['type' => 'video', 'title' => 'Laravel Clean Architecture Video Lesson', 'url' => $ytUrl, 'duration' => 25],
                                    ['type' => 'text', 'title' => 'Form Request Validation & Custom Rules', 'duration' => 12, 'text' => 'Form Requests isolate validation logic cleanly away from HTTP handling.'],
                                    ['type' => 'file', 'title' => 'Laravel Service Pattern Reference (PDF)', 'url' => $pdfUrl, 'duration' => 5],
                                ],
                            ],
                            [
                                'title' => 'API Resources & Data Transformation',
                                'desc' => 'Transform Eloquent models into consistent API responses.',
                                'contents' => [
                                    ['type' => 'video', 'title' => 'Laravel API Resources & Pagination', 'url' => $ytUrl, 'duration' => 20],
                                    ['type' => 'text', 'title' => 'Versioning Your API Endpoints', 'duration' => 10, 'text' => 'Use URL prefix versioning (/api/v1/) or header-based versioning for backward compatibility.'],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Module 2: API Security & Testing Quiz',
                        'materials' => [
                            [
                                'title' => 'Laravel Security Evaluation',
                                'desc' => 'Test authentication, rate limiting, and RBAC knowledge.',
                                'contents' => [
                                    [
                                        'type' => 'quiz',
                                        'title' => 'Laravel API Security Quiz',
                                        'duration' => 15,
                                        'questions' => [
                                            [
                                                'q' => 'Which package provides lightweight token authentication in Laravel?',
                                                'type' => 'multiple_choice',
                                                'options' => [
                                                    ['text' => 'Laravel Dusk', 'correct' => false],
                                                    ['text' => 'Laravel Sanctum', 'correct' => true],
                                                    ['text' => 'Laravel Sail', 'correct' => false],
                                                    ['text' => 'Laravel Pint', 'correct' => false],
                                                ],
                                            ],
                                            [
                                                'q' => 'Explain Laravel Middleware lifecycle and execution order.',
                                                'type' => 'essay',
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Module 3: Laravel Resources & Slides',
                        'materials' => [
                            [
                                'title' => 'Laravel Architecture Presentation Deck',
                                'desc' => 'Download architectural diagrams and API documentation slides.',
                                'contents' => [
                                    ['type' => 'ppt', 'title' => 'Laravel Microservices Architecture Deck', 'url' => $pptUrl, 'duration' => 15],
                                    ['type' => 'file', 'title' => 'Laravel Security & Performance Guide (PDF)', 'url' => $pdfUrl, 'duration' => 10],
                                    ['type' => 'video', 'title' => 'Queue Workers & Horizon in Production', 'url' => $ytUrl, 'duration' => 16],
                                ],
                            ],
                        ],
                    ],
                ],
            ],

            // === Dika Pratama (index 5) ===
            [
                'title' => 'React 19 & Next.js App Router Masterclass',
                'category' => 'Web Development',
                'type' => 'paid',
                'price' => 399000,
                'level' => 'intermediate',
                'status' => 'published',
                'description' => 'Build high-speed web apps using React 19 Server Components, Next.js App Router, Tailwind CSS, and Server Actions.',
                'modules' => [
                    [
                        'title' => 'Module 1: Server Components & Actions',
                        'materials' => [
                            [
                                'title' => 'React Server Components Deep Dive',
                                'desc' => 'Understanding SSR, Streaming, and RSC architecture.',
                                'contents' => [
                                    ['type' => 'video', 'title' => 'Next.js App Router Tutorial Video', 'url' => $ytUrl, 'duration' => 25],
                                    ['type' => 'text', 'title' => 'Server Actions & Data Mutation Guide', 'duration' => 14, 'text' => 'Server Actions allow asynchronous functions to execute directly on the server without manual API routes.'],
                                    ['type' => 'file', 'title' => 'Next.js App Router Cheat Sheet (PDF)', 'url' => $pdfUrl, 'duration' => 5],
                                ],
                            ],
                            [
                                'title' => 'Caching, Revalidation & Streaming',
                                'desc' => 'Master Next.js caching strategies for optimal performance.',
                                'contents' => [
                                    ['type' => 'video', 'title' => 'Next.js Caching & Revalidation Strategies', 'url' => $ytUrl, 'duration' => 20],
                                    ['type' => 'text', 'title' => 'ISR vs SSG vs SSR: When to Use What', 'duration' => 12, 'text' => 'ISR regenerates pages on demand. SSG builds at compile time. SSR renders fresh on every request.'],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Module 2: Next.js Performance Quiz',
                        'materials' => [
                            [
                                'title' => 'React & Next.js Quiz Check',
                                'desc' => 'Test your understanding of Next.js caching and hydration.',
                                'contents' => [
                                    [
                                        'type' => 'quiz',
                                        'title' => 'React 19 & Next.js Quiz',
                                        'duration' => 15,
                                        'questions' => [
                                            [
                                                'q' => 'Where do React Server Components render by default?',
                                                'type' => 'multiple_choice',
                                                'options' => [
                                                    ['text' => 'In client browser DOM', 'correct' => false],
                                                    ['text' => 'Exclusively on the server side', 'correct' => true],
                                                    ['text' => 'Inside Web Worker thread', 'correct' => false],
                                                    ['text' => 'In Service Worker cache', 'correct' => false],
                                                ],
                                            ],
                                            [
                                                'q' => 'Describe the difference between Static Generation and Dynamic Rendering in Next.js.',
                                                'type' => 'essay',
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Module 3: Next.js Slides & Download Assets',
                        'materials' => [
                            [
                                'title' => 'Next.js Presentation & Starter Assets',
                                'desc' => 'Download App Router architecture slides.',
                                'contents' => [
                                    ['type' => 'ppt', 'title' => 'Next.js App Router Architecture Deck', 'url' => $pptUrl, 'duration' => 15],
                                    ['type' => 'file', 'title' => 'Next.js Optimization Cheat Sheet (PDF)', 'url' => $pdfUrl, 'duration' => 10],
                                    ['type' => 'video', 'title' => 'Performance Optimization & Core Web Vitals', 'url' => $ytUrl, 'duration' => 18],
                                ],
                            ],
                        ],
                    ],
                ],
            ],

            // === Budi Santoso (index 6) ===
            [
                'title' => 'iOS App Development with Swift & SwiftUI',
                'category' => 'Mobile Development',
                'type' => 'free',
                'price' => 0,
                'level' => 'beginner',
                'status' => 'published',
                'description' => 'Learn iOS app development from scratch with Swift 5 and SwiftUI. Build responsive Apple ecosystem applications.',
                'modules' => [
                    [
                        'title' => 'Module 1: Swift & SwiftUI Views',
                        'materials' => [
                            [
                                'title' => 'SwiftUI Views & Modifiers',
                                'desc' => 'Declarative UI building with VStack, HStack, and ZStack.',
                                'contents' => [
                                    ['type' => 'video', 'title' => 'SwiftUI Intro Video Tutorial', 'url' => $ytUrl, 'duration' => 20],
                                    ['type' => 'text', 'title' => 'State Property Wrappers Guide (@State, @Binding)', 'duration' => 10, 'text' => '@State manages local view reactivity while @Binding connects parent-child state values.'],
                                    ['type' => 'file', 'title' => 'Swift 5 Syntax Reference (PDF)', 'url' => $pdfUrl, 'duration' => 5],
                                ],
                            ],
                            [
                                'title' => 'Navigation & Data Flow in SwiftUI',
                                'desc' => 'Implement NavigationStack and data passing between views.',
                                'contents' => [
                                    ['type' => 'video', 'title' => 'SwiftUI Navigation & Sheets Tutorial', 'url' => $ytUrl, 'duration' => 16],
                                    ['type' => 'text', 'title' => 'EnvironmentObject & ObservableObject Pattern', 'duration' => 10, 'text' => 'ObservableObject publishes changes to views. EnvironmentObject injects shared state through the view hierarchy.'],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Module 2: SwiftUI Quiz & Resources',
                        'materials' => [
                            [
                                'title' => 'iOS Fundamentals Check',
                                'desc' => 'Interactive quiz on Swift syntax and SwiftUI modifiers.',
                                'contents' => [
                                    [
                                        'type' => 'quiz',
                                        'title' => 'SwiftUI Basics Quiz',
                                        'duration' => 15,
                                        'questions' => [
                                            [
                                                'q' => 'Which keyword declares a view in SwiftUI?',
                                                'type' => 'multiple_choice',
                                                'options' => [
                                                    ['text' => 'class', 'correct' => false],
                                                    ['text' => 'struct ... : View', 'correct' => true],
                                                    ['text' => 'interface', 'correct' => false],
                                                    ['text' => 'package', 'correct' => false],
                                                ],
                                            ],
                                            [
                                                'q' => 'Explain the concept of Value Types vs Reference Types in Swift.',
                                                'type' => 'essay',
                                            ],
                                        ],
                                    ],
                                    ['type' => 'file', 'title' => 'Swift 5 Syntax Cheat Sheet (PDF)', 'url' => $pdfUrl, 'duration' => 5],
                                ],
                            ],
                        ],
                    ],
                ],
            ],

            // === Rina Wijaya (index 7) ===
            [
                'title' => 'AI Prompt Engineering & Generative Workflows',
                'category' => 'Data Science & AI',
                'type' => 'free',
                'price' => 0,
                'level' => 'beginner',
                'status' => 'published',
                'description' => 'Master AI prompt engineering techniques for ChatGPT, Claude, Midjourney, and LLM API integrations.',
                'modules' => [
                    [
                        'title' => 'Module 1: Prompt Frameworks & System Roles',
                        'materials' => [
                            [
                                'title' => 'Effective Prompt Structuring',
                                'desc' => 'Role-Task-Context-Constraint prompt design framework.',
                                'contents' => [
                                    ['type' => 'video', 'title' => 'Prompt Engineering Masterclass Video', 'url' => $ytUrl, 'duration' => 20],
                                    ['type' => 'text', 'title' => 'Few-Shot & Chain-of-Thought Prompting', 'duration' => 12, 'text' => 'Chain-of-thought prompting guides LLMs to reason step-by-step before outputting final answers.'],
                                    ['type' => 'file', 'title' => 'Prompt Engineering Patterns Reference (PDF)', 'url' => $pdfUrl, 'duration' => 5],
                                ],
                            ],
                            [
                                'title' => 'LLM API Integration & Parameters',
                                'desc' => 'Working with OpenAI, Anthropic, and open-source LLM APIs.',
                                'contents' => [
                                    ['type' => 'video', 'title' => 'OpenAI API Integration Tutorial', 'url' => $ytUrl, 'duration' => 18],
                                    ['type' => 'text', 'title' => 'Understanding Temperature, Top-P, and Max Tokens', 'duration' => 10, 'text' => 'Temperature controls creativity (0=deterministic, 2=very random). Top-P limits sampling to nucleus probability mass.'],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Module 2: AI Workflows Quiz & Slides',
                        'materials' => [
                            [
                                'title' => 'AI Prompting Knowledge Check',
                                'desc' => 'Test your prompt design skills.',
                                'contents' => [
                                    [
                                        'type' => 'quiz',
                                        'title' => 'Prompt Engineering Quiz',
                                        'duration' => 15,
                                        'questions' => [
                                            [
                                                'q' => 'What is temperature parameter in LLM API calls?',
                                                'type' => 'multiple_choice',
                                                'options' => [
                                                    ['text' => 'Hardware CPU temperature', 'correct' => false],
                                                    ['text' => 'Controls randomness and creativity of generated text', 'correct' => true],
                                                    ['text' => 'Token context limit size', 'correct' => false],
                                                    ['text' => 'Request timeout duration', 'correct' => false],
                                                ],
                                            ],
                                            [
                                                'q' => 'How does Retrieval-Augmented Generation (RAG) improve LLM accuracy?',
                                                'type' => 'essay',
                                            ],
                                        ],
                                    ],
                                    ['type' => 'ppt', 'title' => 'Generative AI Workflows Slide Deck', 'url' => $pptUrl, 'duration' => 15],
                                ],
                            ],
                        ],
                    ],
                ],
            ],

            // === Dika Pratama (index 8) ===
            [
                'title' => 'Product Design & Design Thinking Fundamentals',
                'category' => 'UI/UX Design',
                'type' => 'paid',
                'price' => 199000,
                'level' => 'beginner',
                'status' => 'published',
                'description' => 'Learn end-to-end design thinking methodologies: Empathize, Define, Ideate, Prototype, and Test.',
                'modules' => [
                    [
                        'title' => 'Module 1: User Research & Empathy Mapping',
                        'materials' => [
                            [
                                'title' => 'User Interview Techniques',
                                'desc' => 'Conducting qualitative user interviews and building user personas.',
                                'contents' => [
                                    ['type' => 'video', 'title' => 'Design Thinking Workshop Video', 'url' => $ytUrl, 'duration' => 20],
                                    ['type' => 'text', 'title' => 'Empathy Map & Problem Statement Guide', 'duration' => 10, 'text' => 'Empathy maps synthesize user insights into Say, Do, Think, and Feel quadrants.'],
                                    ['type' => 'file', 'title' => 'User Research Interview Template (PDF)', 'url' => $pdfUrl, 'duration' => 5],
                                ],
                            ],
                            [
                                'title' => 'Information Architecture & User Flow',
                                'desc' => 'Designing intuitive navigation structures and user journeys.',
                                'contents' => [
                                    ['type' => 'video', 'title' => 'IA & User Flow Mapping Tutorial', 'url' => $ytUrl, 'duration' => 18],
                                    ['type' => 'text', 'title' => 'Card Sorting & Tree Testing Methods', 'duration' => 10, 'text' => 'Card sorting reveals users mental models. Tree testing validates navigation structure effectiveness.'],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Module 2: Prototyping & Assessment',
                        'materials' => [
                            [
                                'title' => 'Product Design Evaluation',
                                'desc' => 'Test design thinking principles.',
                                'contents' => [
                                    [
                                        'type' => 'quiz',
                                        'title' => 'Design Thinking Quiz',
                                        'duration' => 15,
                                        'questions' => [
                                            [
                                                'q' => 'Which phase of Design Thinking focuses on generating creative ideas?',
                                                'type' => 'multiple_choice',
                                                'options' => [
                                                    ['text' => 'Empathize', 'correct' => false],
                                                    ['text' => 'Ideate', 'correct' => true],
                                                    ['text' => 'Deploy', 'correct' => false],
                                                    ['text' => 'Audit', 'correct' => false],
                                                ],
                                            ],
                                            [
                                                'q' => 'Why is rapid prototyping essential before code development?',
                                                'type' => 'essay',
                                            ],
                                        ],
                                    ],
                                    ['type' => 'file', 'title' => 'User Persona & Journey Map Template (PDF)', 'url' => $pdfUrl, 'duration' => 10],
                                ],
                            ],
                        ],
                    ],
                ],
            ],

            // === Budi Santoso (index 9) ===
            [
                'title' => 'Docker, Kubernetes & Cloud DevOps Pipeline',
                'category' => 'Web Development',
                'type' => 'paid',
                'price' => 650000,
                'level' => 'advanced',
                'status' => 'published',
                'description' => 'Containerize applications with Docker, orchestrate with Kubernetes, and build automated CI/CD deployment pipelines.',
                'modules' => [
                    [
                        'title' => 'Module 1: Docker Containers & Compose',
                        'materials' => [
                            [
                                'title' => 'Containerization Essentials',
                                'desc' => 'Writing efficient Dockerfiles and docker-compose configurations.',
                                'contents' => [
                                    ['type' => 'video', 'title' => 'Docker Containerization Masterclass Video', 'url' => $ytUrl, 'duration' => 28],
                                    ['type' => 'text', 'title' => 'Multi-Stage Docker Builds Guide', 'duration' => 15, 'text' => 'Multi-stage builds reduce final image size by copying artifacts from build stages into lean runtime images.'],
                                    ['type' => 'file', 'title' => 'Docker CLI Commands Reference (PDF)', 'url' => $pdfUrl, 'duration' => 5],
                                ],
                            ],
                            [
                                'title' => 'Docker Networking & Volume Management',
                                'desc' => 'Bridge networks, named volumes, and container communication.',
                                'contents' => [
                                    ['type' => 'video', 'title' => 'Docker Networking Deep Dive', 'url' => $ytUrl, 'duration' => 22],
                                    ['type' => 'text', 'title' => 'Container Orchestration with Docker Compose', 'duration' => 12, 'text' => 'Docker Compose defines multi-container applications as a single service stack with YAML configuration.'],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Module 2: Kubernetes Orchestration & Quiz',
                        'materials' => [
                            [
                                'title' => 'DevOps Knowledge Check',
                                'desc' => 'Evaluate container & Kubernetes orchestration knowledge.',
                                'contents' => [
                                    [
                                        'type' => 'quiz',
                                        'title' => 'Docker & Kubernetes Quiz',
                                        'duration' => 20,
                                        'questions' => [
                                            [
                                                'q' => 'What is the smallest deployable object in Kubernetes?',
                                                'type' => 'multiple_choice',
                                                'options' => [
                                                    ['text' => 'Container', 'correct' => false],
                                                    ['text' => 'Pod', 'correct' => true],
                                                    ['text' => 'Node', 'correct' => false],
                                                    ['text' => 'Cluster', 'correct' => false],
                                                ],
                                            ],
                                            [
                                                'q' => 'Explain the CI/CD pipeline steps for automated cloud deployments.',
                                                'type' => 'essay',
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                    [
                        'title' => 'Module 3: Cloud DevOps Resources & Slides',
                        'materials' => [
                            [
                                'title' => 'DevOps Architecture Slides & Config Files',
                                'desc' => 'Download Kubernetes manifests and pipeline slide decks.',
                                'contents' => [
                                    ['type' => 'ppt', 'title' => 'Cloud Native DevOps Architecture Deck', 'url' => $pptUrl, 'duration' => 20],
                                    ['type' => 'file', 'title' => 'Kubectl Commands & Docker Cheat Sheet (PDF)', 'url' => $pdfUrl, 'duration' => 10],
                                    ['type' => 'video', 'title' => 'Kubernetes HPA & Auto-Scaling in Action', 'url' => $ytUrl, 'duration' => 20],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        foreach ($coursesData as $index => $cData) {
            // Distribusi round-robin: Budi(0,3,6,9), Rina(1,4,7), Dika(2,5,8)
            $instructorIndex = $index % $instructors->count();
            $creator = $instructors[$instructorIndex];

            $course = Course::create([
                'creator_id' => $creator->id,
                'title' => $cData['title'],
                'slug' => Str::slug($cData['title']),
                'description' => $cData['description'],
                'thumbnail' => null,
                'type' => $cData['type'],
                'price' => $cData['type'] === 'free' ? null : $cData['price'],
                'level' => $cData['level'],
                'status' => $cData['status'],
                'published_at' => now(),
                'rating_avg' => 0,
                'rating_count' => 0,
            ]);

            // Sync category
            if (isset($categoriesMap[$cData['category']])) {
                $course->categories()->sync([$categoriesMap[$cData['category']]->id]);
            } elseif (! empty($categoriesMap)) {
                $course->categories()->sync([$categoriesMap->first()->id]);
            }

            // Create Modules, Materials, Contents
            foreach ($cData['modules'] as $modIndex => $modData) {
                $module = Module::create([
                    'course_id' => $course->id,
                    'title' => $modData['title'],
                    'sort_order' => $modIndex + 1,
                    'status' => 'published',
                ]);

                foreach ($modData['materials'] as $matIndex => $matData) {
                    $material = Material::create([
                        'module_id' => $module->id,
                        'title' => $matData['title'],
                        'description' => $matData['desc'],
                        'sort_order' => $matIndex + 1,
                        'status' => 'published',
                    ]);

                    foreach ($matData['contents'] as $cntIndex => $cntData) {
                        $contentType = $cntData['type'];

                        $contentPayload = [
                            'material_id' => $material->id,
                            'type' => $contentType,
                            'title' => $cntData['title'],
                            'duration' => $cntData['duration'] ?? 10,
                            'status' => 'published',
                            'sort_order' => $cntIndex + 1,
                        ];

                        if ($contentType === 'video') {
                            $contentPayload['content_url'] = $cntData['url'] ?? $ytUrl;
                        } elseif ($contentType === 'file' || $contentType === 'ppt') {
                            $contentPayload['content_url'] = $cntData['url'] ?? $pdfUrl;
                        } elseif ($contentType === 'text') {
                            $textBody = $cntData['text'] ?? 'Default lesson article text content.';
                            $contentPayload['content_text'] = [
                                [
                                    'type' => 'paragraph',
                                    'children' => [['text' => $textBody]],
                                ],
                            ];
                        }

                        $materialContent = MaterialContent::create($contentPayload);

                        // Quiz questions & options
                        if ($contentType === 'quiz' && isset($cntData['questions'])) {
                            foreach ($cntData['questions'] as $qIndex => $qData) {
                                $quizQuestion = QuizQuestion::create([
                                    'material_content_id' => $materialContent->id,
                                    'question' => $qData['q'],
                                    'type' => $qData['type'],
                                    'image' => null,
                                    'sort_order' => $qIndex + 1,
                                ]);

                                if ($qData['type'] === 'multiple_choice' && isset($qData['options'])) {
                                    foreach ($qData['options'] as $optData) {
                                        QuizOption::create([
                                            'quiz_question_id' => $quizQuestion->id,
                                            'option_text' => $optData['text'],
                                            'is_correct' => $optData['correct'],
                                        ]);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
