<?php

namespace App\Http\Controllers;

use App\Http\Requests\Comment\StoreCommentRequest;
use App\Http\Requests\Comment\UpdateCommentRequest;
use App\Models\Comment;
use App\Models\Course;
use App\Services\CommentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function __construct(private CommentService $commentService) {}

    /**
     * POST /student/courses/{course:slug}/comments
     * Student menambah komentar atau reply.
     */
    public function store(StoreCommentRequest $request, Course $course): JsonResponse
    {
        try {
            $comment = $this->commentService->store(
                course: $course,
                userId: $request->user()->id,
                body: $request->validated('body'),
                parentId: $request->validated('parent_id'),
            );

            return response()->json([
                'success' => true,
                'comment' => [
                    'id' => $comment->id,
                    'body' => $comment->body,
                    'parent_id' => $comment->parent_id,
                    'created_at' => $comment->created_at,
                    'updated_at' => $comment->updated_at,
                    'replies' => [],
                    'user' => [
                        'id' => $comment->user?->id,
                        'name' => $comment->user?->name ?? 'Deleted user',
                        'avatar_url' => $comment->user?->avatar_url ?? null,
                    ],
                ],
            ]);
        } catch (\DomainException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * PUT /student/courses/{course:slug}/comments/{comment}
     * Student mengedit komentar miliknya.
     */
    public function update(UpdateCommentRequest $request, Course $course, Comment $comment): JsonResponse
    {
        try {
            $updated = $this->commentService->update(
                comment: $comment,
                userId: $request->user()->id,
                body: $request->validated('body'),
            );

            return response()->json([
                'success' => true,
                'comment' => [
                    'id' => $updated->id,
                    'body' => $updated->body,
                    'updated_at' => $updated->updated_at,
                ],
            ]);
        } catch (\DomainException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * DELETE /student/courses/{course:slug}/comments/{comment}
     * Student menghapus komentar miliknya.
     */
    public function destroy(Request $request, Course $course, Comment $comment): JsonResponse
    {
        try {
            $this->commentService->destroy($comment, $request->user()->id);

            return response()->json(['success' => true]);
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
     * PUT /admin/comments/{comment}/approve
     */
    public function approve(Comment $comment): RedirectResponse
    {
        $this->commentService->setApproval($comment, true);

        return back()->with('success', 'Comment approved.');
    }

    /**
     * PUT /admin/comments/{comment}/reject
     */
    public function reject(Comment $comment): RedirectResponse
    {
        $this->commentService->setApproval($comment, false);

        return back()->with('success', 'Comment hidden from public.');
    }

    /**
     * DELETE /admin/comments/{comment}
     */
    public function adminDestroy(Comment $comment): RedirectResponse
    {
        $this->commentService->destroy($comment, $comment->user_id, isAdmin: true);

        return back()->with('success', 'Comment deleted.');
    }
}
