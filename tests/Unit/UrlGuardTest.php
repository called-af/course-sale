<?php

namespace Tests\Unit;

use App\Support\UrlGuard;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class UrlGuardTest extends TestCase
{
    public function test_public_https_urls_are_allowed(): void
    {
        $this->assertNull(UrlGuard::error('https://1.1.1.1/v1'));
        $this->assertNull(UrlGuard::error('https://8.8.8.8'));
        $this->assertTrue(UrlGuard::isSafe('https://1.1.1.1'));
    }

    public function test_private_and_loopback_hosts_are_rejected(): void
    {
        $this->assertNotNull(UrlGuard::error('http://127.0.0.1'));
        $this->assertNotNull(UrlGuard::error('http://localhost'));
        $this->assertNotNull(UrlGuard::error('http://192.168.1.10'));
        $this->assertNotNull(UrlGuard::error('http://10.0.0.5'));
        $this->assertNotNull(UrlGuard::error('http://172.16.0.5'));
        $this->assertNotNull(UrlGuard::error('http://[::1]'));
    }

    public function test_cloud_metadata_endpoints_are_never_allowed(): void
    {
        $this->assertNotNull(UrlGuard::error('http://169.254.169.254/latest/meta-data'));
        $this->assertNotNull(UrlGuard::error('http://169.254.169.254/latest/meta-data', true));
        $this->assertNotNull(UrlGuard::error('http://100.100.100.200', true));
    }

    public function test_local_endpoints_can_be_allowed_explicitly(): void
    {
        $this->assertNull(UrlGuard::error('http://127.0.0.1:11434/v1', true));
        $this->assertNull(UrlGuard::error('http://localhost:4000/v1', true));
        $this->assertNull(UrlGuard::error('http://192.168.1.10:8080', true));
    }

    public function test_custom_ports_require_local_mode(): void
    {
        $this->assertNotNull(UrlGuard::error('https://1.1.1.1:8443'));
        $this->assertNull(UrlGuard::error('https://1.1.1.1:8443', true));
    }

    #[DataProvider('invalidUrls')]
    public function test_invalid_or_unsafe_urls_are_rejected(string $url): void
    {
        $this->assertNotNull(UrlGuard::error($url));
    }

    public static function invalidUrls(): array
    {
        return [
            'empty' => [''],
            'no scheme' => ['example.com'],
            'ftp' => ['ftp://1.1.1.1'],
            'file' => ['file:///etc/passwd'],
            'credentials' => ['https://user:password@1.1.1.1'],
            'javascript' => ['javascript:alert(1)'],
        ];
    }
}
