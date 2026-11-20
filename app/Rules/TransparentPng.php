<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

/**
 * Accepts only a PNG that actually contains at least one non-opaque pixel.
 *
 * GD/Imagick are not available in this app, so the PNG is decoded with the
 * standard library. Interlaced and >8-bit images are rejected to keep the
 * unfiltering step deterministic and cheap.
 */
class TransparentPng implements ValidationRule
{
    private const MAX_DIMENSION = 4096;

    /**
     * Run the validation rule.
     *
     * @param  Closure(string): void  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $value instanceof UploadedFile || ! $value->isValid()) {
            $fail('The :attribute must be a valid PNG image.');

            return;
        }

        if (strtolower($value->getClientOriginalExtension()) !== 'png' || $value->getMimeType() !== 'image/png') {
            $fail('The :attribute must be a PNG image.');

            return;
        }

        $contents = @file_get_contents($value->getRealPath());
        if ($contents === false || strlen($contents) < 33 || substr($contents, 0, 8) !== "\x89PNG\r\n\x1a\n") {
            $fail('The :attribute is not a valid PNG image.');

            return;
        }

        $offset = 8;
        $length = strlen($contents);
        $idat = '';
        $header = null;
        $sawEnd = false;

        while ($offset + 12 <= $length) {
            $chunkLength = unpack('N', substr($contents, $offset, 4))[1];
            $chunkType = substr($contents, $offset + 4, 4);

            if ($chunkLength > $length - $offset - 12) {
                $fail('The :attribute is not a valid PNG image.');

                return;
            }

            $chunkData = substr($contents, $offset + 8, $chunkLength);

            if ($chunkType === 'IHDR') {
                if ($chunkLength !== 13) {
                    $fail('The :attribute is not a valid PNG image.');

                    return;
                }

                $header = unpack(
                    'Nwidth/Nheight/CbitDepth/CcolorType/Ccompression/Cfilter/Cinterlace',
                    $chunkData
                );
            } elseif ($chunkType === 'IDAT') {
                $idat .= $chunkData;
            } elseif ($chunkType === 'IEND') {
                $sawEnd = true;
                break;
            }

            $offset += 12 + $chunkLength;
        }

        if (! $sawEnd || ! is_array($header) || $idat === '') {
            $fail('The :attribute is not a valid PNG image.');

            return;
        }

        if (
            $header['bitDepth'] !== 8
            || ! in_array($header['colorType'], [4, 6], true)
            || $header['compression'] !== 0
            || $header['filter'] !== 0
            || $header['interlace'] !== 0
        ) {
            $fail('The :attribute must be a non-interlaced 8-bit PNG with an alpha channel (RGBA or grayscale + alpha).');

            return;
        }

        if (
            $header['width'] < 1 || $header['height'] < 1
            || $header['width'] > self::MAX_DIMENSION || $header['height'] > self::MAX_DIMENSION
        ) {
            $fail('The :attribute must be 4096 × 4096 px or smaller.');

            return;
        }

        // PNG IDAT is a zlib stream. gzinflate() expects raw deflate, so try
        // gzuncompress() first and fall back to skipping the zlib header.
        $raw = @gzuncompress($idat);
        if ($raw === false) {
            $raw = @gzinflate(substr($idat, 2));
        }

        if ($raw === false) {
            $fail('The :attribute could not be read.');

            return;
        }

        $bytesPerPixel = $header['colorType'] === 4 ? 2 : 4;
        $stride = $header['width'] * $bytesPerPixel;
        $expected = $header['height'] * ($stride + 1);

        if (strlen($raw) < $expected) {
            $fail('The :attribute is a corrupted PNG image.');

            return;
        }

        $previous = array_fill(0, $stride, 0);
        $position = 0;
        $alphaOffset = $header['colorType'] === 4 ? 1 : 3;
        $hasTransparency = false;

        for ($y = 0; $y < $header['height'] && ! $hasTransparency; $y++) {
            $filter = ord($raw[$position]);
            $position++;
            $scanline = substr($raw, $position, $stride);
            $position += $stride;

            if (strlen($scanline) !== $stride) {
                $fail('The :attribute is a corrupted PNG image.');

                return;
            }

            $current = array_fill(0, $stride, 0);

            for ($i = 0; $i < $stride; $i++) {
                $left = $i >= $bytesPerPixel ? $current[$i - $bytesPerPixel] : 0;
                $up = $previous[$i];
                $upperLeft = $i >= $bytesPerPixel ? $previous[$i - $bytesPerPixel] : 0;

                $predictor = match ($filter) {
                    0 => 0,
                    1 => $left,
                    2 => $up,
                    3 => (int) (($left + $up) / 2),
                    4 => $this->paeth($left, $up, $upperLeft),
                    default => -1,
                };

                if ($predictor === -1) {
                    $fail('The :attribute is a corrupted PNG image.');

                    return;
                }

                $current[$i] = (ord($scanline[$i]) + $predictor) & 0xFF;
            }

            for ($i = $alphaOffset; $i < $stride; $i += $bytesPerPixel) {
                if ($current[$i] < 255) {
                    $hasTransparency = true;
                    break;
                }
            }

            $previous = $current;
        }

        if (! $hasTransparency) {
            $fail('The :attribute must have a transparent background. Use a PNG with no background.');
        }
    }

    private function paeth(int $left, int $up, int $upperLeft): int
    {
        $prediction = $left + $up - $upperLeft;
        $leftDistance = abs($prediction - $left);
        $upDistance = abs($prediction - $up);
        $upperLeftDistance = abs($prediction - $upperLeft);

        if ($leftDistance <= $upDistance && $leftDistance <= $upperLeftDistance) {
            return $left;
        }

        return $upDistance <= $upperLeftDistance ? $up : $upperLeft;
    }
}
