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
    | Cache Settings
    |--------------------------------------------------------------------------
    |
    | Duration in seconds to cache computed recommendations.
    |
    */

    'cache_ttl' => (int) env('RECOMMENDATION_CACHE_TTL', 7200), // 2 hours

    /*
    |--------------------------------------------------------------------------
    | Cache Store
    |--------------------------------------------------------------------------
    |
    | Leave empty to use the application's default cache store.
    |
    */

    'cache_store' => env('RECOMMENDATION_CACHE_STORE'),

    /*
    |--------------------------------------------------------------------------
    | Native Laravel Engine Weights & Rules
    |--------------------------------------------------------------------------
    |
    | Event weights and popularity signals used by the Laravel recommendation
    | engine (content-based + popularity fallback).
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
