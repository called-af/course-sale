<?php

namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use App\Models\ChatSession;
use App\Services\AI\ChatService;
use Illuminate\Http\Request;
use Inertia\Inertia;
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
        $sessionCount = ChatSession::where('user_id', Auth::id())->count();
        if ($sessionCount >= 5) {
            return response()->json(['error' => 'Maksimal 5 chat session tercapai. Hapus chat lama untuk membuat yang baru.'], 422);
        }

        $validated = $request->validate([
            'title' => 'nullable|string|max:255'
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

        $validated = $request->validate([
            'message' => 'required|string|max:1000'
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
                'session_title' => $session->title // return new title to frontend if changed
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal memproses pesan: ' . $e->getMessage()], 500);
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
}
