<?php

use App\Models\User;
use App\Services\AI\AIOrchestrator;
use App\Services\AI\AiService;
use App\Services\AI\Tool\CourseComparisonTool;
use App\Services\AI\Tool\CourseDetailTool;
use App\Services\AI\Tool\CourseSearchTool;
use App\Services\AI\Tool\RecommendationTool;
use App\Services\AI\Tool\UserProgressTool;

class TestableAIOrchestrator extends AIOrchestrator
{
    public function exposeToolDefinitions(?User $user = null): array
    {
        return $this->getToolDefinitions($user);
    }

    public function exposeExecuteTool(string $name, array $arguments, $userId): array
    {
        return $this->executeTool($name, $arguments, $userId);
    }
}

it('only exposes read-only course information and instructor tools', function () {
    $orchestrator = new TestableAIOrchestrator(
        Mockery::mock(AiService::class),
        new CourseSearchTool,
        new CourseDetailTool,
        new RecommendationTool,
        new UserProgressTool,
        new CourseComparisonTool,
    );

    $definitions = $orchestrator->exposeToolDefinitions();
    $toolNames = collect($definitions)->pluck('function.name')->all();

    expect($toolNames)->toBe([
        'search_courses',
        'get_course',
        'get_recommendations',
        'get_user_progress',
        'compare_courses',
        'get_instructor_students',
        'get_instructor_analytics',
    ]);
});

it('filters instructor tools for student users', function () {
    $student = new User(['role' => 'student']);

    $orchestrator = new TestableAIOrchestrator(
        Mockery::mock(AiService::class),
        new CourseSearchTool,
        new CourseDetailTool,
        new RecommendationTool,
        new UserProgressTool,
        new CourseComparisonTool,
    );

    $definitions = $orchestrator->exposeToolDefinitions($student);
    $toolNames = collect($definitions)->pluck('function.name')->all();

    expect($toolNames)->not->toContain('get_instructor_students')
        ->and($toolNames)->not->toContain('get_instructor_analytics')
        ->and($toolNames)->toBe([
            'search_courses',
            'get_course',
            'get_recommendations',
            'get_user_progress',
            'compare_courses',
        ]);
});

it('exposes instructor tools for instructor users', function () {
    $instructor = new User(['role' => 'instructor']);

    $orchestrator = new TestableAIOrchestrator(
        Mockery::mock(AiService::class),
        new CourseSearchTool,
        new CourseDetailTool,
        new RecommendationTool,
        new UserProgressTool,
        new CourseComparisonTool,
    );

    $definitions = $orchestrator->exposeToolDefinitions($instructor);
    $toolNames = collect($definitions)->pluck('function.name')->all();

    expect($toolNames)->toContain('get_instructor_students')
        ->and($toolNames)->toContain('get_instructor_analytics');
});

it('rejects tools that can perform actions outside course information', function () {
    $orchestrator = new TestableAIOrchestrator(
        Mockery::mock(AiService::class),
        new CourseSearchTool,
        new CourseDetailTool,
        new RecommendationTool,
        new UserProgressTool,
        new CourseComparisonTool,
    );

    $this->expectException(Exception::class);
    $this->expectExceptionMessage('Tool create_learning_path not found');

    $orchestrator->exposeExecuteTool('create_learning_path', ['goal' => 'Backend Developer'], 1);
});
