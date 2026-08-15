<?php

namespace App\Http\Controllers\Course;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuizQuestion\StoreQuizQuestionRequest;
use App\Http\Requests\QuizQuestion\UpdateQuizQuestionRequest;
use App\Http\Requests\QuizQuestion\ListQuizQuestionRequest;
use App\Models\Course;
use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\Module;
use App\Models\QuizQuestion;
use App\Services\QuizService;
use App\Services\CourseStructureService;
use Illuminate\Http\JsonResponse;

class QuizController extends Controller
{
    public function __construct(
        private QuizService $quizService,
        private CourseStructureService $structureService,
    ) {}

    public function index(
        ListQuizQuestionRequest $request,
        Course $course,
        Module $module,
        Material $material,
        MaterialContent $content,
    ): JsonResponse
    {
        $this->structureService->ensureContentHierarchy($course, $module, $material, $content);
        $questions = $this->quizService->getQuestions($content->id);

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
        $this->structureService->ensureContentHierarchy($course, $module, $material, $content);
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
        $this->structureService->ensureContentHierarchy($course, $module, $material, $content);
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
        $this->structureService->ensureContentHierarchy($course, $module, $material, $content);
        $this->authorize('update', $content);
        abort_unless($quizQuestion->material_content_id === $content->id, 404);
        $this->quizService->deleteQuestion($quizQuestion);

        return back()->with('success', 'Quiz question deleted successfully.');
    }
}
