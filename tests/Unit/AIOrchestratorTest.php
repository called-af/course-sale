<?php

use App\Services\AI\AIOrchestrator;
use App\Services\AI\NvidiaService;
use App\Services\AI\Tool\CourseComparisonTool;
use App\Services\AI\Tool\CourseDetailTool;
use App\Services\AI\Tool\CourseSearchTool;
use App\Services\AI\Tool\RecommendationTool;
use App\Services\AI\Tool\UserProgressTool;

class TestableAIOrchestrator extends AIOrchestrator
{
    public function exposeToolDefinitions(): array
    {
        return $this->getToolDefinitions();
    }

    public function exposeExecuteTool(string $name, array $arguments, $userId): array
    {
        return $this->executeTool($name, $arguments, $userId);
    }
}

it('only exposes read-only course information tools', function () {
    $orchestrator = new TestableAIOrchestrator(
        Mockery::mock(NvidiaService::class),
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
    ]);
});

it('rejects tools that can perform actions outside course information', function () {
    $orchestrator = new TestableAIOrchestrator(
        Mockery::mock(NvidiaService::class),
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
