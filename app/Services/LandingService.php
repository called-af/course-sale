<?php

namespace App\Services;

use App\Models\LandingSetting;
use App\Models\Review;

class LandingService
{
    /**
     * Testimonials are pulled from approved course reviews — never static copy.
     *
     * @return list<array<string, mixed>>
     */
    public function testimonials(): array
    {
        $settings = LandingSetting::content(LandingSetting::SECTION_TESTIMONIAL);
        $limit = max(1, min(24, (int) ($settings['limit'] ?? 6)));
        $minRating = max(1, min(5, (int) ($settings['min_rating'] ?? 4)));

        return Review::query()
            ->where('is_approved', true)
            ->whereNotNull('comment')
            ->where('comment', '<>', '')
            ->where('rating', '>=', $minRating)
            ->with(['user:id,name,avatar', 'course:id,title,slug'])
            ->latest()
            ->take($limit)
            ->get()
            ->map(function (Review $review) {
                $name = $review->user?->name ?? 'Learner';
                $avatar = $review->user?->avatar_url;

                return [
                    'id' => $review->id,
                    'name' => $name,
                    'role' => $review->course
                        ? 'Student · '.$review->course->title
                        : 'Student',
                    'avatar' => $avatar ?: 'https://ui-avatars.com/api/?name='.urlencode($name).'&background=7c3aed&color=ffffff',
                    'comment' => $review->comment,
                    'rating' => (int) $review->rating,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * How many courses the landing "Courses" section shows.
     */
    public function courseLimit(): int
    {
        $settings = LandingSetting::content(LandingSetting::SECTION_COURSES);

        return max(1, min(24, (int) ($settings['limit'] ?? 8)));
    }
}
