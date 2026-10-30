<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Review;
use App\Models\User;
use App\Services\AI\Tool\InstructorAnalyticsTool;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(Tests\TestCase::class, RefreshDatabase::class);

it('denies execution when user context is not provided', function () {
    $tool = new InstructorAnalyticsTool;
    $result = $tool->execute([]);

    expect($result)->toHaveKey('error')
        ->and($result['error'])->toBe('User context not available');
});

it('denies execution when user is not an instructor or admin', function () {
    $student = User::factory()->create(['role' => 'student']);

    $tool = new InstructorAnalyticsTool;
    $tool->setUserId($student->id);

    $result = $tool->execute([]);

    expect($result)->toHaveKey('error')
        ->and($result['error'])->toContain('Akses ditolak');
});

it('denies access when instructor attempts to query another instructor id', function () {
    $instructor1 = User::factory()->create(['role' => 'instructor']);
    $instructor2 = User::factory()->create(['role' => 'instructor']);

    $tool = new InstructorAnalyticsTool;
    $tool->setUserId($instructor1->id);

    $result = $tool->execute(['instructor_id' => $instructor2->id]);

    expect($result)->toHaveKey('error')
        ->and($result['error'])->toContain('Akses ditolak. Anda tidak berhak mengakses data instructor lain');
});

it('denies access when instructor attempts to query a course belonging to another instructor', function () {
    $instructor1 = User::factory()->create(['role' => 'instructor']);
    $instructor2 = User::factory()->create(['role' => 'instructor']);

    $otherCourse = Course::factory()->create([
        'creator_id' => $instructor2->id,
        'title' => 'Secret Python Course',
    ]);

    $tool = new InstructorAnalyticsTool;
    $tool->setUserId($instructor1->id);

    // Try query by course_id
    $resultId = $tool->execute(['course_id' => $otherCourse->id]);
    expect($resultId)->toHaveKey('error')
        ->and($resultId['error'])->toContain('Akses ditolak');

    // Try query by course_title
    $resultTitle = $tool->execute(['course_title' => 'Secret Python Course']);
    expect($resultTitle)->toHaveKey('error')
        ->and($resultTitle['error'])->toContain('Akses ditolak');
});

it('returns full analytics overview including earnings, ratings, and reviews for own courses', function () {
    $instructor = User::factory()->create(['role' => 'instructor', 'name' => 'Prof. Alex']);
    $student1 = User::factory()->create(['role' => 'student', 'name' => 'Alice']);
    $student2 = User::factory()->create(['role' => 'student', 'name' => 'Bob']);

    // Course 1: Paid course
    $course1 = Course::factory()->create([
        'creator_id' => $instructor->id,
        'title' => 'Mastering Laravel 11',
        'type' => 'paid',
        'price' => 250000,
        'rating_avg' => 4.80,
        'rating_count' => 2,
    ]);

    // Enrollments
    Enrollment::factory()->create(['user_id' => $student1->id, 'course_id' => $course1->id, 'status' => 'active']);
    Enrollment::factory()->create(['user_id' => $student2->id, 'course_id' => $course1->id, 'status' => 'active']);

    // Reviews
    Review::factory()->create([
        'user_id' => $student1->id,
        'course_id' => $course1->id,
        'rating' => 5,
        'comment' => 'Kursus mantap sekali!',
        'is_approved' => true,
    ]);
    Review::factory()->create([
        'user_id' => $student2->id,
        'course_id' => $course1->id,
        'rating' => 4,
        'comment' => 'Sangat bermanfaat.',
        'is_approved' => true,
    ]);

    // Course 2: Free course
    $course2 = Course::factory()->create([
        'creator_id' => $instructor->id,
        'title' => 'Intro to Programming',
        'type' => 'free',
        'price' => null,
        'rating_avg' => 5.00,
        'rating_count' => 1,
    ]);
    Enrollment::factory()->create(['user_id' => $student1->id, 'course_id' => $course2->id, 'status' => 'active']);
    Review::factory()->create([
        'user_id' => $student1->id,
        'course_id' => $course2->id,
        'rating' => 5,
        'comment' => 'Bagus untuk pemula.',
        'is_approved' => true,
    ]);

    $tool = new InstructorAnalyticsTool;
    $tool->setUserId($instructor->id);

    $result = $tool->execute([]);

    expect($result)->toHaveKey('instructor')
        ->and($result['instructor']['name'])->toBe('Prof. Alex')
        ->and($result)->toHaveKey('summary')
        ->and($result['summary']['total_courses'])->toBe(2)
        ->and($result['summary']['total_enrolled_students'])->toBe(3)
        ->and($result['summary']['total_unique_students'])->toBe(2)
        ->and($result['summary']['total_earnings'])->toBe(500000.0)
        ->and($result['summary']['formatted_total_earnings'])->toBe('Rp 500.000')
        ->and($result['summary']['total_reviews'])->toBe(3)
        ->and($result['summary']['average_rating'])->toBe(4.9) // avg of 4.80 and 5.00
        ->and($result)->toHaveKey('courses')
        ->and($result)->toHaveKey('recent_reviews')
        ->and(count($result['recent_reviews']))->toBe(3);
});

it('filters analytics by metric=earnings', function () {
    $instructor = User::factory()->create(['role' => 'instructor']);
    $student = User::factory()->create(['role' => 'student']);

    $course = Course::factory()->create([
        'creator_id' => $instructor->id,
        'title' => 'React Fullstack',
        'type' => 'paid',
        'price' => 150000,
    ]);

    Enrollment::factory()->create(['user_id' => $student->id, 'course_id' => $course->id, 'status' => 'active']);

    $tool = new InstructorAnalyticsTool;
    $tool->setUserId($instructor->id);

    $result = $tool->execute(['metric' => 'earnings']);

    expect($result)->toHaveKey('total_earnings')
        ->and($result['total_earnings'])->toBe(150000.0)
        ->and($result['formatted_total_earnings'])->toBe('Rp 150.000')
        ->and($result)->toHaveKey('earnings_by_course')
        ->and($result['earnings_by_course'][0]['title'])->toBe('React Fullstack')
        ->and($result['earnings_by_course'][0]['earnings'])->toBe(150000.0);
});

it('filters analytics by metric=ratings', function () {
    $instructor = User::factory()->create(['role' => 'instructor']);
    $student = User::factory()->create(['role' => 'student']);

    $course = Course::factory()->create([
        'creator_id' => $instructor->id,
        'title' => 'Vue.js Mastery',
        'rating_avg' => 4.75,
        'rating_count' => 1,
    ]);

    Review::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'rating' => 5,
        'comment' => 'Penjelasan jelas!',
        'is_approved' => true,
    ]);

    $tool = new InstructorAnalyticsTool;
    $tool->setUserId($instructor->id);

    $result = $tool->execute(['metric' => 'ratings']);

    expect($result)->toHaveKey('average_rating')
        ->and($result['average_rating'])->toBe(4.75)
        ->and($result['total_ratings_count'])->toBe(1)
        ->and($result)->toHaveKey('ratings_by_course')
        ->and($result)->toHaveKey('recent_reviews')
        ->and($result['recent_reviews'][0]['comment'])->toBe('Penjelasan jelas!');
});

it('allows instructor to query specific course details and reviews for their own course', function () {
    $instructor = User::factory()->create(['role' => 'instructor']);
    $student = User::factory()->create(['role' => 'student']);

    $course = Course::factory()->create([
        'creator_id' => $instructor->id,
        'title' => 'Docker for Beginners',
        'type' => 'paid',
        'price' => 200000,
        'rating_avg' => 5.0,
        'rating_count' => 1,
    ]);

    Enrollment::factory()->create(['user_id' => $student->id, 'course_id' => $course->id, 'status' => 'active']);
    Review::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'rating' => 5,
        'comment' => 'Sangat mudah dipahami.',
        'is_approved' => true,
    ]);

    $tool = new InstructorAnalyticsTool;
    $tool->setUserId($instructor->id);

    $result = $tool->execute(['course_id' => $course->id]);

    expect($result)->toHaveKey('title')
        ->and($result['title'])->toBe('Docker for Beginners')
        ->and($result['earnings'])->toBe(200000.0)
        ->and($result['formatted_earnings'])->toBe('Rp 200.000')
        ->and($result['enrolled_students_count'])->toBe(1)
        ->and($result['rating_avg'])->toBe(5.0)
        ->and($result['total_reviews'])->toBe(1)
        ->and($result['reviews'][0]['comment'])->toBe('Sangat mudah dipahami.');
});
