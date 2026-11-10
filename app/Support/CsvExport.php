<?php

namespace App\Support;

use Symfony\Component\HttpFoundation\StreamedResponse;

class CsvExport
{
    /**
     * Stream a CSV download without loading the whole dataset into memory.
     *
     * @param  array<int, string>  $headers
     * @param  iterable<int, array<int, mixed>>  $rows
     */
    public static function download(string $filename, array $headers, iterable $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($headers, $rows): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            // UTF-8 BOM keeps Excel from mangling Indonesian characters.
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, $headers, ',', '"', '');

            foreach ($rows as $row) {
                fputcsv($handle, array_map(
                    fn ($value) => is_scalar($value) || $value === null ? (string) ($value ?? '') : '',
                    $row,
                ), ',', '"', '');
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public static function filename(string $prefix): string
    {
        return $prefix.'-'.now()->format('Ymd-His').'.csv';
    }
}
