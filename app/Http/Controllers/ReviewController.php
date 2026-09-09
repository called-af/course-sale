<?php

namespace App\Http\Controllers;

use App\Http\Requests\Review\StoreReviewRequest;
use App\Models\Course;
use App\Models\Review;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function __construct(private ReviewService $reviewService) {}

    /**
     * POST /student/courses/{course:slug}/reviews
     * Student menyimpan atau update review — returns JSON.
     */
    public function store(StoreReviewRequest $request, Course $course): JsonResponse
    {
        try {
            $review = $this->reviewService->storeOrUpdate(
                course: $course,
                userId: $request->user()->id,
                rating: (int) $request->validated('rating'),
                comment: $request->validated('comment') ?: null,
            );

            // Reload dengan relasi user
            $review->load('user:id,name,avatar');

            return response()->json([
                'success' => true,
                'message' => 'Your review has been submitted. Thank you!',
                'review'  => [
                    'id'          => $review->id,
                    'rating'      => $review->rating,
                    'comment'     => $review->comment,
                    'is_approved' => $review->is_approved,
                    'created_at'  => $review->created_at,
                    'user'        => [
                        'id'         => $review->user->id,
                        'name'       => $review->user->name,
                        'avatar_url' => $review->user->avatar_url ?? null,
                    ],
                ],
                // Kirim ulang rating stats yang sudah diupdate
                'rating_stats' => $this->reviewService->getRatingStats($course),
            ]);
        } catch (\DomainException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * DELETE /student/courses/{course:slug}/reviews/{review}
     * Student menghapus review miliknya — returns JSON.
     */
    public function destroy(Request $request, Course $course, Review $review): JsonResponse
    {
        try {
            $this->reviewService->destroy($review, $request->user()->id);

            return response()->json([
                'success'      => true,
                'message'      => 'Your review has been removed.',
                'rating_stats' => $this->reviewService->getRatingStats($course),
            ]);
        } catch (\DomainException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ADMIN
    |--------------------------------------------------------------------------
    */

    /**
     * PUT /admin/reviews/{review}/approve
     */
    public function approve(Review $review): RedirectResponse
    {
        $this->reviewService->setApproval($review, true);

        return back()->with('success', 'Review approved.');
    }

    /**
     * PUT /admin/reviews/{review}/reject
     */
    public function reject(Review $review): RedirectResponse
    {
        $this->reviewService->setApproval($review, false);

        return back()->with('success', 'Review hidden from public.');
    }

    /**
     * DELETE /admin/reviews/{review}
     * Bug fix: hapus dulu, jangan panggil setApproval setelah delete.
     */
    public function adminDestroy(Review $review): RedirectResponse
    {
        $course = $review->course;
        $review->delete();

        // Recalculate setelah delete (tanpa setApproval yang akan error karena sudah dihapus)
        $this->reviewService->recalculateCourseRatingPublic($course);

        return back()->with('success', 'Review deleted.');
    }
}
