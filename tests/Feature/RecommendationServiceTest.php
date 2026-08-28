<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Tag;
use App\Models\User;
use App\Models\UserEvent;
use App\Services\RecommendationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
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

        // User viewed course1
        UserEvent::create([
            'user_id' => $this->user->id,
            'course_id' => $this->course1->id,
            'event_type' => UserEvent::TYPE_COURSE_VIEW,
            'created_at' => now(),
        ]);
    }

    public function test_recommendations_return_empty_when_disabled(): void
    {
        Config::set('recommendation.enabled', false);

        $service = app(RecommendationService::class);
        $result = $service->getRecommendations($this->user, 4);

        $this->assertIsArray($result);
        $this->assertEmpty($result);
    }

    public function test_recommendations_use_laravel_driver_directly(): void
    {
        Config::set('recommendation.enabled', true);
        Config::set('recommendation.driver', 'laravel');

        $service = app(RecommendationService::class);
        $result = $service->computeRecommendations($this->user, 3);

        $this->assertIsArray($result);
        $this->assertNotEmpty($result);
        $this->assertArrayHasKey('recommendation_score', $result[0]);
    }

    public function test_recommendations_fall_back_to_laravel_when_python_service_is_down(): void
    {
        Config::set('recommendation.enabled', true);
        Config::set('recommendation.driver', 'python');
        Config::set('recommendation.python.url', 'http://127.0.0.1:9999');
        Config::set('recommendation.python.timeout', 0.2);
        Config::set('recommendation.python.fallback_to_laravel', true);

        // Fake network failure
        Http::fake([
            'http://127.0.0.1:9999/*' => Http::response(null, 500),
        ]);

        $service = app(RecommendationService::class);
        $result = $service->computeRecommendations($this->user, 3);

        $this->assertIsArray($result);
        $this->assertNotEmpty($result);
        $this->assertArrayHasKey('recommendation_score', $result[0]);
    }

    public function test_recommendations_return_empty_when_python_fails_and_fallback_disabled(): void
    {
        Config::set('recommendation.enabled', true);
        Config::set('recommendation.driver', 'python');
        Config::set('recommendation.python.url', 'http://127.0.0.1:9999');
        Config::set('recommendation.python.timeout', 0.2);
        Config::set('recommendation.python.fallback_to_laravel', false);

        Http::fake([
            'http://127.0.0.1:9999/*' => Http::response(null, 500),
        ]);

        $service = app(RecommendationService::class);
        $result = $service->computeRecommendations($this->user, 3);

        $this->assertIsArray($result);
        $this->assertEmpty($result);
    }

    public function test_recommendations_consume_python_service_when_available(): void
    {
        Config::set('recommendation.enabled', true);
        Config::set('recommendation.driver', 'python');
        Config::set('recommendation.python.url', 'http://mock-recommender.test');
        Config::set('recommendation.python.fallback_to_laravel', true);

        Http::fake([
            'http://mock-recommender.test/*' => Http::response([
                'user_id' => $this->user->id,
                'recommendations' => [
                    [
                        'course_id' => $this->course2->id,
                        'score' => 99.5,
                        'reason' => 'AI Super Match from Python ML',
                        'matching_tags' => ['Python'],
                    ],
                ],
                'source' => 'python_ml',
                'count' => 1,
            ], 200),
        ]);

        $service = app(RecommendationService::class);
        $result = $service->computeRecommendations($this->user, 1);

        $this->assertIsArray($result);
        $this->assertCount(1, $result);
        $this->assertEquals($this->course2->id, $result[0]['id']);
        $this->assertEquals(99.5, $result[0]['recommendation_score']);
        $this->assertEquals('AI Super Match from Python ML', $result[0]['recommendation_reason']);
    }

    public function test_guest_recommendations_work(): void
    {
        Config::set('recommendation.enabled', true);
        Config::set('recommendation.driver', 'laravel');

        $service = app(RecommendationService::class);
        $result = $service->computeRecommendations(null, 2);

        $this->assertIsArray($result);
        $this->assertNotEmpty($result);
    }
}
