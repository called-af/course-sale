<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\Course;
use App\Models\Enrollment;

class CommentService
{
    /**
     * Ambil semua top-level comment untuk sebuah kursus, dengan replies-nya.
     */
    public function getCourseComments(Course $course): array
    {
        $comments = Comment::where('course_id', $course->id)
            ->whereNull('parent_id')
            ->where('is_approved', true)
            ->with([
                'user:id,name,avatar',
                'replies' => function ($query) {
                    $query->where('is_approved', true)
                        ->with('user:id,name,avatar')
                        ->orderBy('created_at');
                },
            ])
            ->latest()
            ->get()
            ->map(fn (Comment $c) => $this->formatComment($c, true));

        return $comments->values()->all();
    }

    /**
     * Tambah comment baru (top-level atau reply).
     */
    public function store(Course $course, int $userId, string $body, ?int $parentId = null): Comment
    {
        $isEnrolled = Enrollment::where('user_id', $userId)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->exists();

        if (! $isEnrolled) {
            throw new \DomainException('You must be enrolled in this course to post a comment.');
        }

        if ($parentId) {
            $parent = Comment::find($parentId);
            if (! $parent || $parent->course_id !== $course->id) {
                throw new \DomainException('Invalid parent comment.');
            }
            // Hanya boleh reply ke top-level comment (satu level saja)
            if (! is_null($parent->parent_id)) {
                throw new \DomainException('Nested replies are not supported. Reply to the top-level comment instead.');
            }
        }

        $comment = Comment::create([
            'user_id' => $userId,
            'course_id' => $course->id,
            'parent_id' => $parentId,
            'body' => $body,
        ]);

        return $comment->load('user:id,name,avatar');
    }

    /**
     * Update comment (hanya oleh owner).
     */
    public function update(Comment $comment, int $userId, string $body): Comment
    {
        if ($comment->user_id !== $userId) {
            throw new \DomainException('You are not authorized to edit this comment.');
        }

        $comment->update(['body' => $body]);

        return $comment->load('user:id,name,avatar');
    }

    /**
     * Hapus comment (oleh owner atau admin).
     */
    public function destroy(Comment $comment, int $userId, bool $isAdmin = false): void
    {
        if (! $isAdmin && $comment->user_id !== $userId) {
            throw new \DomainException('You are not authorized to delete this comment.');
        }

        // Hapus semua replies terlebih dahulu
        $comment->replies()->delete();
        $comment->delete();
    }

    /**
     * Admin: set approval status.
     */
    public function setApproval(Comment $comment, bool $approved): void
    {
        $comment->update(['is_approved' => $approved]);
    }

    /**
     * Admin: ambil semua comment dengan filter.
     */
    public function getAdminComments(?string $status = null, ?int $courseId = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = Comment::with(['user:id,name,avatar', 'course:id,title,slug'])
            ->latest();

        if ($status === 'pending') {
            $query->where('is_approved', false);
        } elseif ($status === 'approved') {
            $query->where('is_approved', true);
        }

        if ($courseId) {
            $query->where('course_id', $courseId);
        }

        return $query->get();
    }

    /**
     * Format comment ke array yang siap dikirim ke frontend.
     */
    private function formatComment(Comment $comment, bool $withReplies = false): array
    {
        $data = [
            'id' => $comment->id,
            'body' => $comment->body,
            'parent_id' => $comment->parent_id,
            'created_at' => $comment->created_at,
            'updated_at' => $comment->updated_at,
            'user' => [
                'id' => $comment->user?->id,
                'name' => $comment->user?->name ?? 'Deleted user',
                'avatar_url' => $comment->user?->avatar_url,
            ],
        ];

        if ($withReplies) {
            $data['replies'] = $comment->replies
                ->map(fn (Comment $reply) => $this->formatComment($reply, false))
                ->values()
                ->all();
        }

        return $data;
    }
}
