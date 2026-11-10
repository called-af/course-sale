<?php

namespace App\Services\AI;

use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Models\User;
use App\Services\AI\Tool\CourseComparisonTool;
use App\Services\AI\Tool\CourseDetailTool;
use App\Services\AI\Tool\CourseSearchTool;
use App\Services\AI\Tool\InstructorAnalyticsTool;
use App\Services\AI\Tool\InstructorStudentTool;
use App\Services\AI\Tool\RecommendationTool;
use App\Services\AI\Tool\UserProgressTool;
use Exception;
use Illuminate\Support\Facades\Log;

class AIOrchestrator
{
    protected AiService $aiService;

    protected array $tools = [];

    public function __construct(
        AiService $aiService,
        CourseSearchTool $courseSearch,
        CourseDetailTool $courseDetail,
        RecommendationTool $recommendationTool,
        UserProgressTool $userProgress,
        CourseComparisonTool $courseComparison,
        ?InstructorStudentTool $instructorStudents = null,
        ?InstructorAnalyticsTool $instructorAnalytics = null
    ) {
        $this->aiService = $aiService;
        $instructorStudents ??= app(InstructorStudentTool::class);
        $instructorAnalytics ??= app(InstructorAnalyticsTool::class);

        $this->tools = [
            'search_courses' => $courseSearch,
            'get_course' => $courseDetail,
            'get_recommendations' => $recommendationTool,
            'get_user_progress' => $userProgress,
            'compare_courses' => $courseComparison,
            'get_instructor_students' => $instructorStudents,
            'get_instructor_analytics' => $instructorAnalytics,
        ];
    }

    public function handleChat(array $messages, ChatSession $session)
    {
        $toolDefinitions = $this->getToolDefinitions($session->user);

        // 1. Initial call to AI service
        $response = $this->aiService->chat($messages, $toolDefinitions);
        $message = $response['choices'][0]['message'] ?? null;

        if (! $message) {
            throw new Exception('Invalid response from AI');
        }

        // 2. Handle Tool Calls. Hard-cap the loop so a misbehaving model cannot
        // keep calling tools forever and exhaust the request timeout.
        $maxToolRounds = 5;
        $toolRound = 0;

        while (isset($message['tool_calls']) && count($message['tool_calls']) > 0) {
            if (++$toolRound > $maxToolRounds) {
                Log::warning('AI tool loop limit reached', ['session_id' => $session->id]);

                return [
                    'content' => 'Maaf, saya membutuhkan terlalu banyak langkah untuk menjawab pertanyaan ini. Silakan coba pertanyaan yang lebih spesifik.',
                    'metadata' => ['tool_loop_limit_reached' => true],
                ];
            }

            $messages[] = $message; // Add assistant message with tool calls to context

            // Save tool call message to db
            ChatMessage::create([
                'chat_session_id' => $session->id,
                'role' => 'assistant',
                'metadata' => ['tool_calls' => $message['tool_calls']],
            ]);

            foreach ($message['tool_calls'] as $toolCall) {
                $function = $toolCall['function'];
                $toolName = $function['name'];
                $arguments = json_decode($function['arguments'], true) ?? [];

                try {
                    $toolResult = $this->executeTool($toolName, $arguments, $session->user_id);
                } catch (\Exception $e) {
                    Log::error("Tool execution failed: {$toolName}", ['error' => $e->getMessage()]);
                    $toolResult = ['error' => $e->getMessage()];
                }

                $toolMessage = [
                    'role' => 'tool',
                    'tool_call_id' => $toolCall['id'],
                    'name' => $toolName,
                    'content' => is_string($toolResult) ? $toolResult : json_encode($toolResult),
                ];

                $messages[] = $toolMessage;

                // Save tool response to db
                ChatMessage::create([
                    'chat_session_id' => $session->id,
                    'role' => 'tool',
                    'tool_call_id' => $toolCall['id'],
                    'tool_name' => $toolName,
                    'content' => $toolMessage['content'],
                ]);
            }

            // Call AI service again with tool results
            $response = $this->aiService->chat($messages, $toolDefinitions);
            $message = $response['choices'][0]['message'] ?? null;

            if (! $message) {
                throw new Exception('Invalid response from AI after tool calls');
            }
        }

        return [
            'content' => $message['content'] ?? '',
            'metadata' => [
                'usage' => $response['usage'] ?? null,
            ],
        ];
    }

    protected function getToolDefinitions(?User $user = null): array
    {
        $definitions = [];
        $instructorTools = ['get_instructor_students', 'get_instructor_analytics'];

        foreach ($this->tools as $name => $tool) {
            // Only expose instructor tools to instructors (and admins), or when no user context is provided (e.g. testing)
            if (in_array($name, $instructorTools, true) && $user && ! $user->hasRole(['instructor', 'admin'])) {
                continue;
            }

            $definitions[] = [
                'type' => 'function',
                'function' => array_merge(['name' => $name], $tool->getDefinition()),
            ];
        }

        return $definitions;
    }

    protected function executeTool(string $name, array $arguments, $userId)
    {
        if (! isset($this->tools[$name])) {
            throw new Exception("Tool {$name} not found");
        }

        // Pass userId if the tool requires user context
        if (method_exists($this->tools[$name], 'setUserId')) {
            $this->tools[$name]->setUserId($userId);
        }

        return $this->tools[$name]->execute($arguments);
    }
}
