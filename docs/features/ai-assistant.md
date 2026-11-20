# AI Assistant Chat

> Part of the [Feature Documentation](../FEATURES.md) index.

## Overview

Students and instructors can chat with a role-aware AI assistant. Each user has
up to five chat sessions. The assistant can call read-only course tools, but it
cannot change data or claim to have performed an action. Providers and models are
configured in [AI integrations](ai-integrations.md).

## Roles

- **Student** — can use course information, recommendations and own progress tools.
- **Instructor** — can additionally use tools for own courses, students and analytics.
- **Admin** — configures AI but does not have a chat route in the current UI.

## Flow

### 1. Open a chat

1. Signed-in student or instructor opens the floating chat UI.
2. The app calls `GET /ai/chat/sessions` to list sessions.
3. User opens an existing session with `GET /ai/chat/{session}` or creates one
   with `POST /ai/chat`.
4. A new session is titled `New Chat`; the first prompt renames it.

### 2. Send a message

1. User types a message up to 1000 characters.
2. `POST /ai/chat/{session}/messages` is throttled to 10 requests per minute.
3. `ChatService` stores the user message.
4. The service builds a role-aware system prompt and includes the latest 20 messages.
5. `AIOrchestrator` selects tools, calls the configured provider, and stores
   assistant and tool messages.
6. The reply is shown in the chat UI.

### 3. Read history and delete

- `GET /ai/chat/{session}/messages` returns stored messages.
- `DELETE /ai/chat/{session}` removes a session owned by the user.
- Session and message ownership is enforced with 403.

## Available tools

The assistant may call these read-only tools:

- `search_courses`
- `get_course`
- `get_recommendations`
- `get_user_progress`
- `compare_courses`
- `get_instructor_students`
- `get_instructor_analytics`

Students cannot see other users' data or private instructor analytics.
Instructors can query only their own courses, students and earnings.

## Rules and guards

- Maximum 5 chat sessions per user.
- Message maximum 1000 characters.
- Message endpoint throttled to 10 per minute.
- Tool loop is capped at 5 rounds.
- The assistant must not invent data or claim to perform actions.
- Session and message ownership is enforced.
- Global AI disable or missing configuration returns a 503 JSON error:
  `ai_disabled` or `ai_not_configured`.
- Unexpected provider failures return a generic `ai_temporarily_unavailable` 503.

## Where to find it

- **UI:** `resources/js/pages/components/ai/FloatingAIChat.tsx`.
- **Routes:** `GET /ai/chat/sessions`, `POST /ai/chat`,
  `GET/DELETE /ai/chat/{session}`, `GET/POST /ai/chat/{session}/messages`.

## Key implementation files

- `app/Http/Controllers/AI/ChatController.php`
- `app/Services/AI/ChatService.php`
- `app/Services/AI/AIOrchestrator.php`
- `app/Services/AI/PromptService.php`
- Tool classes under `app/Services/AI/Tools/`

## Edge cases

- Tool calls and results are persisted as chat messages.
- Exceptions are reported internally but not leaked to the user.
- Streaming chat is not public in the current implementation.
- A provider failure does not expose credentials in the response.

## Related guides

- [AI integrations](ai-integrations.md)
- [Recommendation engine](recommendation-engine.md)
- [Course catalogue and course detail](course-catalog.md)
