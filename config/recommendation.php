<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Recommendation System Master Switch
    |--------------------------------------------------------------------------
    |
    | When set to false, all recommendation queries will return an empty array
    | and recommendation widgets in the UI will cleanly hide themselves.
    |
    */

    'enabled' => env('RECOMMENDATION_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Recommendation Engine Driver
    |--------------------------------------------------------------------------
    |
    | Supported drivers:
    | - "python"  : Uses the FastAPI Python microservice (with automatic fallback to Laravel)
    | - "laravel" : Uses the native PHP Content-Based + Popularity filtering engine directly
    |
    */

    'driver' => env('RECOMMENDATION_DRIVER', 'python'),

    /*
    |--------------------------------------------------------------------------
    | Cache Settings
    |--------------------------------------------------------------------------
    |
    | Duration in seconds to cache computed recommendations in Redis/Cache store.
    |
    */

    'cache_ttl' => (int) env('RECOMMENDATION_CACHE_TTL', 7200), // 2 hours

    /*
    |--------------------------------------------------------------------------
    | Python Microservice Configuration
    |--------------------------------------------------------------------------
    |
    | Connection details for the Python FastAPI recommendation service.
    |
    */

    'python' => [
        'url' => env('RECOMMENDATION_PYTHON_URL', 'http://127.0.0.1:8001'),
        'timeout' => (float) env('RECOMMENDATION_PYTHON_TIMEOUT', 2.0), // seconds
        'retry' => (int) env('RECOMMENDATION_PYTHON_RETRY', 1),
        'fallback_to_laravel' => env('RECOMMENDATION_FALLBACK_TO_LARAVEL', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Native Laravel Engine Weights & Rules
    |--------------------------------------------------------------------------
    |
    | Event weights used for implicit interaction scoring in the Laravel fallback.
    |
    */

    'laravel' => [
        'weights' => [
            'course_enroll' => 5,
            'quiz_complete' => 4,
            'material_complete' => 4,
            'quiz_attempt' => 3,
            'material_view' => 2,
            'course_view' => 1,
        ],
        'popularity' => [
            'views_weight' => 1.5,
            'enrollments_weight' => 3.0,
            'rating_weight' => 2.0,
            'window_days' => 30,
        ],
    ],

];
