# Recommendation Engine

> Part of the [Feature Documentation](../FEATURES.md) index.

## Overview

The platform uses a native Laravel recommendation engine; no external Python
service is required. It scores course tags from user events, excludes courses the
user is already enrolled in, adds a rating bonus and backfills with popular
courses. Admin can disable it.

## Roles

- **Guest** — receives popular-course recommendations.
- **Student** — receives personalized recommendations based on tracked events.
- **Admin** — toggles the engine and views its status.
- **AI assistant** — can request recommendations as a read-only tool.

## Flow

### 1. Request recommendations

1. A page or client calls `GET /courses/recommended`.
2. The controller checks `config('recommendation.enabled')` and
   `RecommendationSetting::isEnabled()`.
3. If disabled, an empty list is returned.
4. For a user with event history, the service builds a tag score profile.
5. Courses matching those tags are ranked and filtered.
6. Enrolled courses are excluded.
7. A rating bonus is applied and popular courses fill remaining slots.
8. The result is cached and returned as JSON, or redirects to `/course?recommended=1`
   for a normal browser request.

### 2. Event tracking

`EventTrackingService` records user events with these weights:

| Event | Weight |
|-------|--------:|
| `course_enroll` | 5 |
| `quiz_complete` | 4 |
| `material_complete` | 4 |
| `quiz_attempt` | 3 |
| `material_view` | 2 |
| `course_view` | 1 |

Only `course_enroll`, `material_complete` and `quiz_complete` invalidate the
recommendation cache.

### 3. Popularity fallback

Popular courses are ranked by:

```text
30-day views × 1.5 + active enrollments × 3 + rating × 2
```

This is used for guests, users with no events and backfilling remaining slots.

### 4. Cache

- User key: `recommendations:user:{id}:limit:{limit}`
- Guest key: `recommendations:guest:limit:{limit}`
- Default TTL: 7200 seconds.
- Store can be overridden with `RECOMMENDATION_CACHE_STORE`.
- Invalidation clears limits 4, 6, 8 and 10.

## Rules and guards

- Only published courses are recommended.
- Enrolled courses are excluded.
- Both the config flag and the admin toggle must be enabled.
- Recommendation results are empty when disabled.
- Cache failure falls back to direct computation.
- Guests always use the popular fallback.

## Where to find it

- **Endpoints:** `GET /courses/recommended`, `GET /course`, `GET /courses`.
- **UI:** course listing pages and student dashboard.
- **Admin:** toggle under **Settings → General** or the AI integration page.

## Key implementation files

- `app/Services/RecommendationService.php`
- `app/Services/EventTrackingService.php`
- `app/Http/Controllers/RecommendationController.php`
- `app/Console/Commands/RecommendationStatusCommand.php`
- `app/Console/Commands/RecommendationSeedEventsCommand.php`
- `config/recommendation.php`

## Edge cases

- `/course?recommended=1` is not currently read by the listing page; use the
  JSON endpoint when consuming recommendations directly.
- Queued tracking and direct event creation may produce duplicate event rows.
- Users with no tags or no events receive popular courses.
- The AI assistant's `get_recommendations` tool uses the same service.

## Related guides

- [Course catalogue and course detail](course-catalog.md)
- [AI assistant](ai-assistant.md)
- [Settings and branding](settings-and-branding.md)
