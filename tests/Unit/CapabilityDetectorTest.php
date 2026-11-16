<?php

namespace Tests\Unit;

use App\Services\AI\CapabilityDetector;
use Tests\TestCase;

class CapabilityDetectorTest extends TestCase
{
    public function test_it_detects_capabilities_from_model_names(): void
    {
        $capabilities = CapabilityDetector::detect('gpt-4o');

        $this->assertContains('text', $capabilities);
        $this->assertContains('vision', $capabilities);
        $this->assertContains('tools', $capabilities);
        $this->assertContains('json_mode', $capabilities);
    }

    public function test_embedding_models_do_not_claim_text_generation(): void
    {
        $capabilities = CapabilityDetector::detect('text-embedding-3-small');

        $this->assertContains('embeddings', $capabilities);
        $this->assertNotContains('text', $capabilities);
    }

    public function test_provider_capabilities_are_an_upper_bound(): void
    {
        $capabilities = CapabilityDetector::detect('gpt-4o', ['text', 'tools']);

        $this->assertEqualsCanonicalizing(['text', 'tools'], $capabilities);
        $this->assertNotContains('vision', $capabilities);
    }

    public function test_unknown_models_fall_back_to_text(): void
    {
        $this->assertSame(['text'], CapabilityDetector::detect('some-unknown-model'));
    }

    public function test_context_window_detection(): void
    {
        $this->assertSame(128_000, CapabilityDetector::contextWindow('gpt-4o'));
        $this->assertSame(200_000, CapabilityDetector::contextWindow('claude-3-5-sonnet'));
        $this->assertSame(1_000_000, CapabilityDetector::contextWindow('gemini-2.0-flash'));
        $this->assertNull(CapabilityDetector::contextWindow('unknown-model'));
    }
}
