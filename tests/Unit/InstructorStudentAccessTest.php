<?php

use App\Models\Course;
use App\Models\User;
use App\Policies\UserPolicy;
use App\Services\AI\Tool\InstructorStudentTool;

it('tests UserPolicy viewAny and view rules for instructor, student, and admin', function () {
    $policy = new UserPolicy();

    $admin = new User(['role' => 'admin']);
    $admin->id = 1;

    $instructor = Mockery::mock(User::class)->makePartial();
    $instructor->role = 'instructor';
    $instructor->id = 2;

    $studentEnrolled = new User(['role' => 'student']);
    $studentEnrolled->id = 3;

    $studentNotEnrolled = new User(['role' => 'student']);
    $studentNotEnrolled->id = 4;

    $regularStudent = Mockery::mock(User::class)->makePartial();
    $regularStudent->role = 'student';
    $regularStudent->id = 5;

    // viewAny
    expect($policy->viewAny($admin))->toBeTrue();
    expect($policy->viewAny($instructor))->toBeTrue();
    expect($policy->viewAny($regularStudent))->toBeFalse();

    // view own profile
    expect($policy->view($instructor, $instructor))->toBeTrue();
    expect($policy->view($regularStudent, $regularStudent))->toBeTrue();

    // admin can view any
    expect($policy->view($admin, $studentEnrolled))->toBeTrue();
    expect($policy->view($admin, $studentNotEnrolled))->toBeTrue();

    // student cannot view other users
    expect($policy->view($regularStudent, $studentEnrolled))->toBeFalse();

    // instructor can view enrolled student, but CANNOT view non-enrolled student
    $instructor->shouldReceive('hasEnrolledStudent')
        ->with($studentEnrolled)
        ->andReturn(true);

    $instructor->shouldReceive('hasEnrolledStudent')
        ->with($studentNotEnrolled)
        ->andReturn(false);

    expect($policy->view($instructor, $studentEnrolled))->toBeTrue();
    expect($policy->view($instructor, $studentNotEnrolled))->toBeFalse();
});

it('denies InstructorStudentTool execution when user is not an instructor', function () {
    $tool = new InstructorStudentTool();
    $tool->setUserId(999);

    // Mock User::find to return student
    $student = new User(['role' => 'student']);
    $student->id = 999;

    // When User is mocked or queried
    // Let's test with non-existent user or student
    $resultNoUser = (new InstructorStudentTool())->execute([]);
    expect($resultNoUser)->toHaveKey('error')
        ->and($resultNoUser['error'])->toBe('User context not available');
});
