<?php

namespace App\Support;

class UrlGuard
{
    /**
     * Return an error message when the URL is unsafe, or null when it is safe.
     */
    public static function error(?string $url, bool $allowLocal = false): ?string
    {
        if (! is_string($url) || trim($url) === '') {
            return 'URL wajib diisi.';
        }

        $parts = parse_url($url);

        if ($parts === false || empty($parts['scheme']) || empty($parts['host'])) {
            return 'URL tidak valid.';
        }

        $scheme = strtolower($parts['scheme']);
        if (! in_array($scheme, ['http', 'https'], true)) {
            return 'URL harus menggunakan http atau https.';
        }

        if (isset($parts['user']) || isset($parts['pass'])) {
            return 'URL tidak boleh memuat kredensial.';
        }

        if (! empty($parts['port']) && ! in_array((int) $parts['port'], [80, 443], true) && ! $allowLocal) {
            return 'Port kustom hanya diizinkan untuk endpoint lokal.';
        }

        $host = strtolower(trim($parts['host'], '[]'));

        if (in_array($host, ['localhost', 'localhost.localdomain'], true) || str_ends_with($host, '.local')) {
            return $allowLocal ? null : 'Host lokal tidak diizinkan.';
        }

        $ips = [];

        if (filter_var($host, FILTER_VALIDATE_IP)) {
            $ips[] = $host;
        } else {
            $records = @gethostbynamel($host) ?: [];
            $ips = $records;
        }

        if ($allowLocal && $ips === [] && empty($records)) {
            // Host not resolvable (e.g. docker service name) is acceptable only
            // for explicitly allowed local deployments.
            return null;
        }

        if ($ips === []) {
            return 'Host URL tidak dapat di-resolve.';
        }

        foreach ($ips as $ip) {
            $error = self::privateIpError($ip, $allowLocal);
            if ($error !== null) {
                return $error;
            }
        }

        return null;
    }

    public static function isSafe(?string $url, bool $allowLocal = false): bool
    {
        return self::error($url, $allowLocal) === null;
    }

    private static function privateIpError(string $ip, bool $allowLocal): ?string
    {
        $packed = @inet_pton($ip);
        if ($packed === false) {
            return 'Alamat IP tidak valid.';
        }

        // IPv4-mapped IPv6
        if (strlen($packed) === 16 && str_starts_with($packed, str_repeat("\0", 10)."\xff\xff")) {
            $ip = inet_ntop(substr($packed, 12));
            $packed = inet_pton($ip);
        }

        if (strlen($packed) === 4) {
            $long = ip2long($ip);

            if ($long === false) {
                return 'Alamat IP tidak valid.';
            }

            // Cloud metadata endpoints are never allowed, even for local mode.
            if ($ip === '169.254.169.254' || $ip === '100.100.100.200') {
                return 'Alamat metadata cloud tidak diizinkan.';
            }

            if ($allowLocal) {
                return null;
            }

            $private = ! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);

            return $private ? 'URL tidak boleh mengarah ke jaringan privat, loopback, atau reserved.' : null;
        }

        // IPv6
        $isLoopback = $ip === '::1';
        $isUnspecified = $ip === '::';
        $isLinkLocal = str_starts_with(strtolower($ip), 'fe80:');
        $isUniqueLocal = str_starts_with(strtolower($ip), 'fc') || str_starts_with(strtolower($ip), 'fd');
        $isMappedMetadata = $ip === 'fd00:ec2::254';

        if ($isMappedMetadata) {
            return 'Alamat metadata cloud tidak diizinkan.';
        }

        if ($allowLocal) {
            return null;
        }

        if ($isLoopback || $isUnspecified || $isLinkLocal || $isUniqueLocal) {
            return 'URL tidak boleh mengarah ke jaringan privat, loopback, atau reserved.';
        }

        return null;
    }
}
