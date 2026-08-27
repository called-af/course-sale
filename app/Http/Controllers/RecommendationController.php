<?php

namespace App\Http\Controllers;

use App\Services\RecommendationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RecommendationController extends Controller
{
    public function __construct(
        protected RecommendationService $recommendationService
    ) {}

    /**
     * Get recommended courses for authenticated user or guest.
     */
    public function index(Request $request): JsonResponse|\Illuminate\Http\RedirectResponse
    {
        $limit = $request->integer('limit', 6);
        $recommendations = $this->recommendationService->getRecommendations($request->user(), $limit);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => $recommendations,
            ]);
        }

        return redirect()->route('course.index', ['recommended' => 1]);
    }
}
