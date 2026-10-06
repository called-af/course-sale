<?php

namespace App\Services\AI;

use App\Models\ChatSession;
use App\Models\ChatMessage;
use App\Services\AI\Tool\CourseSearchTool;
use App\Services\AI\Tool\RecommendationTool;
use App\Services\AI\Tool\CourseComparisonTool;
use App\Services\AI\Tool\LearningPathTool;
use App\Services\AI\Tool\CourseDetailTool;
use App\Services\AI\Tool\UserProgressTool;
use Exception;
use Illuminate\Support\Facades\Log;

class AIOrchestrator
{
    protected NvidiaService $nvidiaService;
    protected array $tools = [];

    public function __construct(
        NvidiaService $nvidiaService,
        CourseSearchTool $courseSearch,
        CourseDetailTool $courseDetail,
        RecommendationTool $recommendationTool,
        UserProgressTool $userProgress,
        CourseComparisonTool $courseComparison,
        LearningPathTool $learningPath
    ) {
        $this->nvidiaService = $nvidiaService;
        
        $this->tools = [
            'search_courses' => $courseSearch,
            'get_course' => $courseDetail,
            'get_recommendations' => $recommendationTool,
            'get_user_progress' => $userProgress,
            'compare_courses' => $courseComparison,
            'create_learning_path' => $learningPath,
        ];
    }

    public function handleChat(array $messages, ChatSession $session)
    {
        $toolDefinitions = $this->getToolDefinitions();
        
        // 1. Initial call to NVIDIA
        $response = $this->nvidiaService->chat($messages, $toolDefinitions);
        $message = $response['choices'][0]['message'] ?? null;

        if (!$message) {
            throw new Exception('Invalid response from AI');
        }

        // 2. Handle Tool Calls
        while (isset($message['tool_calls']) && count($message['tool_calls']) > 0) {
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

            // Call NVIDIA again with tool results
            $response = $this->nvidiaService->chat($messages, $toolDefinitions);
            $message = $response['choices'][0]['message'] ?? null;
            
            if (!$message) {
                throw new Exception('Invalid response from AI after tool calls');
            }
        }

        return [
            'content' => $message['content'] ?? '',
            'metadata' => [
                'usage' => $response['usage'] ?? null,
            ]
        ];
    }

    protected function getToolDefinitions(): array
    {
        $definitions = [];
        foreach ($this->tools as $name => $tool) {
            $definitions[] = [
                'type' => 'function',
                'function' => array_merge(['name' => $name], $tool->getDefinition())
            ];
        }
        return $definitions;
    }

    protected function executeTool(string $name, array $arguments, $userId)
    {
        if (!isset($this->tools[$name])) {
            throw new Exception("Tool {$name} not found");
        }
        
        // Pass userId if the tool requires user context
        if (method_exists($this->tools[$name], 'setUserId')) {
            $this->tools[$name]->setUserId($userId);
        }

        return $this->tools[$name]->execute($arguments);
    }
}
