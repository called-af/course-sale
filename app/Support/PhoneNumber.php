<?php

namespace App\Support;

class PhoneNumber
{
    public static function normalize(?string $number, string $countryCode = '62'): string
    {
        if ($number === null) {
            return '';
        }

        $digits = preg_replace('/\D+/', '', $number) ?? '';
        $countryCode = preg_replace('/\D+/', '', $countryCode) ?: '62';

        if ($digits === '') {
            return '';
        }

        if (str_starts_with($digits, '0')) {
            return $countryCode.substr($digits, 1);
        }

        if (str_starts_with($digits, $countryCode)) {
            return $digits;
        }

        // Local number without leading zero (e.g. 81234567890).
        if (str_starts_with($digits, '8') && $countryCode === '62') {
            return $countryCode.$digits;
        }

        return $digits;
    }

    public static function mask(string $number): string
    {
        $length = strlen($number);
        if ($length <= 4) {
            return '****';
        }

        return substr($number, 0, 3).str_repeat('*', max(0, $length - 6)).substr($number, -3);
    }
}
