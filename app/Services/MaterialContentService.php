<?php

namespace App\Services;

use App\Models\Material;
use App\Models\MaterialContent;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;

class MaterialContentService
{
    /**
     * Directory (on the public disk) where uploaded lesson files are stored.
     */
    protected const UPLOAD_DIRECTORY = 'materials/contents';

    /**
     * Create a new typed content block under a material.
     */
    public function create(Material $material, array $data): MaterialContent
    {
        return DB::transaction(function () use ($material, $data) {

            $type = $data['type'] ?? 'text';
            $file = $data['file'] ?? null;

            $contentUrl = $data['content_url'] ?? null;
            $previewUrl = null;
            $contentText = $this->normalizeContentText($data['content_text'] ?? null);

            if ($file instanceof UploadedFile) {
                $stored = $this->storeUploadedFile($file);
                $contentUrl = $stored['url'];
                $previewUrl = $stored['preview_url'];
            }

            if (in_array($type, ['file', 'ppt'], true) && $file === null) {
                $previewUrl = $previewUrl ?: $contentUrl;
            }

            return MaterialContent::create([
                'material_id' => $material->id,
                'type' => $type,
                'title' => $data['title'],
                'content_url' => $contentUrl,
                'preview_url' => $previewUrl,
                'content_text' => $contentText,
                'duration' => $type === 'quiz' ? ($data['duration'] ?? null) : null,
                'sort_order' => $this->nextSortOrder($material->id),
                'status' => $data['status'] ?? 'draft',
            ]);
        });
    }

    /**
     * Update a typed content block.
     */
    public function update(MaterialContent $content, array $data): MaterialContent
    {
        return DB::transaction(function () use ($content, $data) {

            $newType = $data['type'] ?? $content->type;
            $file = $data['file'] ?? null;

            $contentUrl = array_key_exists('content_url', $data)
                ? $data['content_url']
                : $content->content_url;
            $previewUrl = $content->preview_url;
            $contentText = array_key_exists('content_text', $data)
                ? $this->normalizeContentText($data['content_text'])
                : $content->content_text;

            if ($file instanceof UploadedFile) {
                $this->deleteUploadedFile($content->content_url);
                $this->deleteUploadedFile($content->preview_url);

                $stored = $this->storeUploadedFile($file);
                $contentUrl = $stored['url'];
                $previewUrl = $stored['preview_url'];
            } elseif ($contentUrl !== $content->content_url) {
                $this->deleteUploadedFile($content->content_url);
                $this->deleteUploadedFile($content->preview_url);

                $previewUrl = in_array($newType, ['file', 'ppt'], true)
                    ? $contentUrl
                    : null;
            } elseif (! in_array($newType, ['file', 'ppt'], true)) {
                $this->deleteUploadedFile($content->preview_url);
                $previewUrl = null;
            }

            $duration = array_key_exists('duration', $data)
                ? $data['duration']
                : $content->duration;

            $content->update([
                'type' => $newType,
                'title' => $data['title'] ?? $content->title,
                'content_url' => $contentUrl,
                'preview_url' => $previewUrl,
                'content_text' => $contentText,
                'duration' => $newType === 'quiz' ? $duration : null,
                'status' => $data['status'] ?? $content->status,
            ]);

            return $content->refresh();
        });
    }

    /**
     * Delete a content block and any files attached to it.
     */
    public function delete(MaterialContent $content): void
    {
        DB::transaction(function () use ($content) {
            $this->deleteUploadedFile($content->content_url);
            $this->deleteUploadedFile($content->preview_url);
            $content->delete();
        });
    }

    /**
     * Move a content block up or down inside its material.
     */
    public function move(MaterialContent $content, string $direction): void
    {
        DB::transaction(function () use ($content, $direction) {

            if (is_null($content->sort_order)) {
                return;
            }

            $query = $this->siblingQuery($content);

            $swapWith = $direction === 'up'
                ? (clone $query)->where('sort_order', '<', $content->sort_order)->orderByDesc('sort_order')->first()
                : (clone $query)->where('sort_order', '>', $content->sort_order)->orderBy('sort_order')->first();

            if (! $swapWith) {
                return;
            }

            $currentOrder = $content->sort_order;

            $content->update(['sort_order' => $swapWith->sort_order]);
            $swapWith->update(['sort_order' => $currentOrder]);
        });
    }

    /**
     * All contents that share the same ordering scope (the same material).
     */
    protected function siblingQuery(MaterialContent $content)
    {
        return MaterialContent::where('material_id', $content->material_id);
    }

    protected function nextSortOrder(int $materialId): int
    {
        return (MaterialContent::where('material_id', $materialId)->max('sort_order') ?? 0) + 1;
    }

    /**
     * Store an uploaded file on the public disk and generate an inline PDF
     * preview when the file is a Word/PowerPoint/Excel document.
     *
     * @return array{url: string, preview_url: string|null}
     */
    protected function storeUploadedFile(UploadedFile $file): array
    {
        $path = $file->store(self::UPLOAD_DIRECTORY, 'public');

        return [
            'url' => '/storage/'.$path,
            'preview_url' => $this->createOfficePreview($path),
        ];
    }

    /**
     * Convert an Office document into a PDF with LibreOffice so it can be
     * rendered inline even when the app is not publicly reachable (the Office
     * web viewer needs a public URL). Returns null when conversion is not
     * possible; the viewer then falls back to the Office web viewer.
     */
    protected function createOfficePreview(string $relativePath): ?string
    {
        $extension = strtolower(pathinfo($relativePath, PATHINFO_EXTENSION));

        if (! in_array($extension, ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'odp', 'ods'], true)) {
            return null;
        }

        $disk = Storage::disk('public');
        $source = $disk->path($relativePath);

        if (! is_file($source) || ! $this->looksLikeOfficeFile($source)) {
            return null;
        }

        $outputDirectory = $disk->path(self::UPLOAD_DIRECTORY.'/previews');

        if (! File::isDirectory($outputDirectory)) {
            File::makeDirectory($outputDirectory, 0755, true);
        }

        $profileDirectory = sys_get_temp_dir().'/libreoffice-'.Str::uuid();
        $binary = config('services.libreoffice.binary');

        if (blank($binary)) {
            return null;
        }

        $process = new Process([
            $binary,
            '--headless',
            '-env:UserInstallation=file://'.$profileDirectory,
            '--convert-to',
            'pdf',
            '--outdir',
            $outputDirectory,
            $source,
        ], null, null, null, 120);

        try {
            $process->run();
        } catch (\Throwable) {
            return null;
        } finally {
            File::deleteDirectory($profileDirectory);
        }

        $converted = $outputDirectory.'/'.pathinfo($source, PATHINFO_FILENAME).'.pdf';

        if (! is_file($converted)) {
            return null;
        }

        $filename = (string) Str::uuid().'.pdf';

        if (! @rename($converted, $outputDirectory.'/'.$filename)) {
            @unlink($converted);

            return null;
        }

        return '/storage/'.self::UPLOAD_DIRECTORY.'/previews/'.$filename;
    }

    /**
     * Make sure the file actually is an OOXML (zip) or legacy OLE document
     * before spending time on a conversion.
     */
    protected function looksLikeOfficeFile(string $path): bool
    {
        $handle = @fopen($path, 'rb');

        if ($handle === false) {
            return false;
        }

        $signature = fread($handle, 8);
        fclose($handle);

        return is_string($signature)
            && (str_starts_with($signature, 'PK') || str_starts_with($signature, "\xD0\xCF\x11\xE0"));
    }

    /**
     * Delete a previously uploaded file when it belongs to our upload folder.
     */
    protected function deleteUploadedFile(?string $url): void
    {
        $path = $this->uploadedFilePath($url);

        if ($path !== null) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * Resolve a stored URL back into a path on the public disk.
     */
    protected function uploadedFilePath(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        $path = parse_url($url, PHP_URL_PATH) ?: $url;
        $prefix = '/storage/'.self::UPLOAD_DIRECTORY.'/';

        if (! str_starts_with($path, $prefix)) {
            return null;
        }

        return self::UPLOAD_DIRECTORY.'/'.substr($path, strlen($prefix));
    }

    /**
     * FormData uploads send rich text as a JSON string while regular JSON
     * requests send an array. Normalise both into a storable value.
     */
    protected function normalizeContentText(mixed $value): mixed
    {
        if (is_string($value) && $value !== '') {
            $decoded = json_decode($value, true);

            if (json_last_error() === JSON_ERROR_NONE && (is_array($decoded) || is_object($decoded))) {
                return $decoded;
            }
        }

        return $value;
    }
}
