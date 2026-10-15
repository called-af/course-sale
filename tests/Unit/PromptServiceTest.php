<?php

use App\Models\User;
use App\Services\AI\PromptService;

it('generates system prompt for instructor with access rules for own enrolled students', function () {
    $instructor = new User([
        'name' => 'John Instructor',
        'role' => 'instructor',
    ]);
    $instructor->id = 42;

    $service = new PromptService();
    $prompt = $service->getSystemPrompt($instructor);

    expect($prompt['role'])->toBe('system');
    $content = $prompt['content'];

    // Contains instructor context
    expect($content)->toContain('Role: instructor')
        ->and($content)->toContain('User ID: 42')
        ->and($content)->toContain('get_instructor_students');

    // Allows access to students enrolled in their own courses
    expect($content)->toContain('Instructors ARE AUTHORIZED to access the count and details of students who enrolled in courses created/owned by this instructor');

    // Strictly forbids accessing users who did not enroll in their courses
    expect($content)->toContain('Instructors are STRICTLY FORBIDDEN from accessing any users or students who did NOT enroll in their courses');
});

it('generates system prompt for student preventing access to other users and instructor lists', function () {
    $student = new User([
        'name' => 'Alice Student',
        'role' => 'student',
    ]);
    $student->id = 99;

    $service = new PromptService();
    $prompt = $service->getSystemPrompt($student);

    $content = $prompt['content'];

    expect($content)->toContain('Role: student')
        ->and($content)->toContain('User ID: 99')
        ->and($content)->toContain('Students are NOT allowed to access other users\' personal information, student enrollment counts for instructors, or student lists')
        ->and($content)->toContain('get_user_progress');
});

it('generates default system prompt containing role-based rules when user is null', function () {
    $service = new PromptService();
    $prompt = $service->getSystemPrompt(null);

    $content = $prompt['content'];

    expect($content)->toContain('Role-Based Access Rules')
        ->and($content)->toContain('Users with the \'instructor\' role can access the number and data of students who enrolled in courses they created/own')
        ->and($content)->toContain('Instructors are strictly forbidden from accessing users who did not enroll in their courses');
});
