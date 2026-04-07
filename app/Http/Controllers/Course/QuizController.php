<?php

namespace App\Http\Controllers\Course;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuizQuestion\StoreQuizQuestionRequest;
use App\Http\Requests\QuizQuestion\UpdateQuizQuestionRequest;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Services\QuizService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class QuizController extends Controller
{
    public function __construct(private QuizService $quizService) {}

    /**
     * ADMIN: create quiz (bulk questions)
     */
    public function store(StoreQuizQuestionRequest $request)
    {
        $this->authorize('create', QuizQuestion::class);

        $this->quizService->create($request->validated());

        return response()->json([
            'message' => 'Quiz created',
        ]);
    }

    /**
     * ADMIN: update quiz
     */
    public function update(UpdateQuizQuestionRequest $request)
    {
        $this->authorize('update', QuizQuestion::class);

        $this->quizService->update($request->validated());

        return response()->json([
            'message' => 'Quiz updated',
        ]);
    }

    /**
     * USER: start quiz
     */
    public function start(Request $request)
    {
        $this->authorize('start', QuizAttempt::class);

        $attempt = $this->quizService->start(
            Auth::id(),
            $request->material_content_id
        );

        return response()->json([
            'message' => 'Quiz started',
            'data' => $attempt,
        ]);
    }

    /**
     * USER: submit quiz
     */
    public function submit(Request $request)
    {
        $attempt = QuizAttempt::findOrFail($request->attempt_id);

        $this->authorize('submit', $attempt);

        $result = $this->quizService->submit(
            $request->attempt_id,
            $request->answers
        );

        return response()->json([
            'message' => 'Quiz submitted',
            'data' => $result,
        ]);
    }
}