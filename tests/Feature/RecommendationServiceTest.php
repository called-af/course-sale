<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\RecommendationSetting;
use App\Models\Tag;
use App\Models\User;
use App\Models\UserEvent;
use App\Services\RecommendationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class RecommendationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected Course $course1;

    protected Course $course2;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('recommendation.enabled', true);
        Config::set('cache.default', 'array');
        Config::set('recommendation.cache_store', null);
        Cache::flush();

        RecommendationSetting::query()->delete();

        $this->user = User::factory()->create(['name' => 'Student Test']);

        $tag1 = Tag::create(['name' => 'Laravel', 'slug' => 'laravel']);
        $tag2 = Tag::create(['name' => 'Python', 'slug' => 'python']);

        $this->course1 = Course::factory()->create([
            'title' => 'Laravel Mastery',
            'status' => 'published',
            'rating_avg' => 4.8,
            'rating_count' => 10,
        ]);
        $this->course1->tags()->attach([$tag1->id]);

        $this->course2 = Course::factory()->create([
            'title' => 'Python for ML',
            'status' => 'published',
            'rating_avg' => 4.5,
            'rating_count' => 5,
        ]);
        $this->course2->tags()->attach([$tag2->id]);

        UserEvent::create([
            'user_id' => $this->user->id,
            'course_id' => $this->course1->id,
            'event_type' => UserEvent::TYPE_COURSE_VIEW,
            'created_at' => now(),
        ]);
    }

    public function test_recommendations_return_empty_when_globally_disabled(): void
    {
        Config::set('recommendation.enabled', false);

        $service = app(RecommendationService::class);
        $result = $service->getRecommendations($this->user, 4);

        $this->assertSame([], $result);
    }

    public function test_recommendations_return_empty_when_admin_toggle_is_disabled(): void
    {
        RecommendationSetting::create(['id' => 1, 'enabled' => false]);

        $service = app(RecommendationService::class);

        $this->assertSame([], $service->getRecommendations($this->user, 4));
        $this->assertSame('DISABLED', $service->getStatus()['active_engine']);
    }

    public function test_recommendations_compute_using_laravel_native_engine(): void
    {
        $service = app(RecommendationService::class);
        $result = $service->computeRecommendations($this->user, 3);

        $this->assertNotEmpty($result);
        $this->assertArrayHasKey('recommendation_score', $result[0]);
        $this->assertArrayHasKey('recommendation_reason', $result[0]);
    }

    public function test_guest_recommendations_return_popular_courses(): void
    {
        $service = app(RecommendationService::class);
        $result = $service->computeRecommendations(null, 2);

        $this->assertNotEmpty($result);
        $this->assertArrayHasKey('id', $result[0]);
    }

    public function test_status_reports_native_engine_when_enabled(): void
    {
        $service = app(RecommendationService::class);
        $status = $service->getStatus();

        $this->assertTrue($status['enabled']);
        $this->assertTrue($status['admin_enabled']);
        $this->assertSame('LARAVEL_NATIVE', $status['active_engine']);
    }
}
