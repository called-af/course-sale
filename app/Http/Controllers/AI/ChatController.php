<?php

namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use App\Models\ChatSession;
use App\Services\AI\ChatService;
use App\Services\AiSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    protected ChatService $chatService;

    public function __construct(ChatService $chatService)
    {
        $this->chatService = $chatService;
    }

    public function getSessions()
    {
        return response()->json(
            ChatSession::where('user_id', Auth::id())
                ->orderBy('updated_at', 'desc')
                ->get()
        );
    }

    public function store(Request $request)
    {
        if ($unavailable = $this->aiUnavailableResponse()) {
            return $unavailable;
        }

        $sessionCount = ChatSession::where('user_id', Auth::id())->count();
        if ($sessionCount >= 5) {
            return response()->json(['error' => 'Maksimal 5 chat session tercapai. Hapus chat lama untuk membuat yang baru.'], 422);
        }

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
        ]);

        $session = $this->chatService->getOrCreateSession(
            Auth::user(),
            null,
            $validated['title'] ?? 'Chat Baru'
        );

        return response()->json($session);
    }

    public function show(ChatSession $session)
    {
        if ($session->user_id !== Auth::id()) {
            abort(403);
        }

        return response()->json($session);
    }

    public function messages(ChatSession $session)
    {
        if ($session->user_id !== Auth::id()) {
            abort(403);
        }

        // Return only user and assistant messages to frontend
        $messages = $session->messages()
            ->whereIn('role', ['user', 'assistant'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    public function storeMessage(Request $request, ChatSession $session)
    {
        if ($session->user_id !== Auth::id()) {
            abort(403);
        }

        if ($unavailable = $this->aiUnavailableResponse()) {
            return $unavailable;
        }

        $validated = $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        try {
            // Auto rename the first session using the first user prompt.
            if (in_array($session->title, ['Chat Baru', 'New Chat'], true)) {
                $newTitle = \Illuminate\Support\Str::limit($validated['message'], 30, '...');
                $session->update(['title' => $newTitle]);
            }

            $response = $this->chatService->sendMessage($session, $validated['message']);

            // Update session updated_at
            $session->touch();

            return response()->json([
                'user_message' => $response['user_message'],
                'assistant_message' => $response['assistant_message'],
                'session_title' => $session->title, // return new title to frontend if changed
            ]);
        } catch (\Throwable $e) {
            // Log the real error for operators, but never leak internal
            // exception details to the chat client.
            report($e);

            return response()->json([
                'error' => 'Maaf, layanan AI sedang mengalami gangguan. Silakan coba lagi beberapa saat lagi.',
                'code' => 'ai_temporarily_unavailable',
            ], 503);
        }
    }

    public function destroy(ChatSession $session)
    {
        if ($session->user_id !== Auth::id()) {
            abort(403);
        }

        $session->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Return a friendly JSON response when the AI assistant is off or not
     * configured, instead of letting the orchestrator throw a 500.
     */
    protected function aiUnavailableResponse(): ?JsonResponse
    {
        $settings = app(AiSettings::class);

        if (! $settings->enabled()) {
            return response()->json([
                'error' => 'AI assistant sedang dinonaktifkan oleh administrator.',
                'code' => 'ai_disabled',
            ], 503);
        }

        if (! $settings->isConfigured()) {
            return response()->json([
                'error' => 'AI assistant belum dikonfigurasi. Hubungi administrator.',
                'code' => 'ai_not_configured',
            ], 503);
        }

        return null;
    }
}
