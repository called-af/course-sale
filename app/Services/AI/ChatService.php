<?php

namespace App\Services\AI;

use App\Models\ChatSession;
use App\Models\ChatMessage;
use Illuminate\Support\Facades\DB;

class ChatService
{
    protected AIOrchestrator $orchestrator;
    protected PromptService $promptService;

    public function __construct(AIOrchestrator $orchestrator, PromptService $promptService)
    {
        $this->orchestrator = $orchestrator;
        $this->promptService = $promptService;
    }

    public function getOrCreateSession($user, $sessionId = null, $title = 'Chat Baru')
    {
        if ($sessionId) {
            $session = ChatSession::where('user_id', $user->id)->findOrFail($sessionId);
            return $session;
        }

        return ChatSession::create([
            'user_id' => $user->id,
            'title' => $title,
        ]);
    }

    public function sendMessage(ChatSession $session, string $content)
    {
        DB::beginTransaction();
        try {
            // Save user message
            $userMessage = ChatMessage::create([
                'chat_session_id' => $session->id,
                'role' => 'user',
                'content' => $content,
            ]);

            // Build context
            $context = $this->buildContext($session);

            // Send to orchestrator which handles tools and NVIDIA
            $aiResponse = $this->orchestrator->handleChat($context, $session);

            // Save assistant response
            $assistantMessage = ChatMessage::create([
                'chat_session_id' => $session->id,
                'role' => 'assistant',
                'content' => $aiResponse['content'] ?? null,
            ]);

            DB::commit();

            return [
                'user_message' => $userMessage,
                'assistant_message' => $assistantMessage,
                'metadata' => $aiResponse['metadata'] ?? [],
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    protected function buildContext(ChatSession $session): array
    {
        $messages = [];
        
        // 1. System Prompt
        $messages[] = $this->promptService->getSystemPrompt();

        // 2. Chat History (last 10 messages to save context)
        $history = $session->messages()
            ->orderBy('created_at', 'asc')
            ->take(20)
            ->get();

        foreach ($history as $msg) {
            $formatted = [
                'role' => $msg->role,
                'content' => $msg->content,
            ];
            
            if ($msg->tool_call_id) {
                $formatted['tool_call_id'] = $msg->tool_call_id;
            }
            if ($msg->tool_name) {
                $formatted['name'] = $msg->tool_name;
            }
            if ($msg->metadata && $msg->role === 'assistant' && isset($msg->metadata['tool_calls'])) {
                $formatted['tool_calls'] = $msg->metadata['tool_calls'];
            }

            $messages[] = $formatted;
        }

        return $messages;
    }
}
