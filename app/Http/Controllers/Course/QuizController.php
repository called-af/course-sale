<?php

namespace App\Http\Controllers\Course;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuizQuestion\StoreQuizQuestionRequest;
use App\Http\Requests\QuizQuestion\UpdateQuizQuestionRequest;
use App\Models\Course;
use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\Module;
use App\Models\QuizQuestion;
use App\Services\QuizService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    public function __construct(private QuizService $quizService) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'material_content_id' => 'required|exists:material_contents,id',
        ]);

        $questions = $this->quizService->getQuestions(
            (int) $request->material_content_id
        );

        return response()->json([
            'message' => 'Quiz questions retrieved successfully.',
            'data'    => $questions,
        ]);
    }

    public function store(
        StoreQuizQuestionRequest $request,
        Course $course,
        Module $module,
        Material $material,
        MaterialContent $content
    ) {
        $data = array_merge($request->validated(), [
            'material_content_id' => $content->id,
        ]);

        $this->quizService->storeQuestions($data);

        return back()->with('success', 'Quiz questions created successfully.');
    }

    public function update(
        UpdateQuizQuestionRequest $request,
        Course $course,
        Module $module,
        Material $material,
        MaterialContent $content
    ) {
        $data = array_merge($request->validated(), [
            'material_content_id' => $content->id,
        ]);

        $this->quizService->updateQuestions($data);

        return back()->with('success', 'Quiz questions updated successfully.');
    }

    public function destroy(
        Course $course,
        Module $module,
        Material $material,
        MaterialContent $content,
        QuizQuestion $quizQuestion
    ) {
        $this->quizService->deleteQuestion($quizQuestion);

        return back()->with('success', 'Quiz question deleted successfully.');
    }
}