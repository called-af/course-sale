<?php

namespace App\Services;

use App\Models\Material;
use App\Models\MaterialContent;
use DomainException;
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
     * Create a new class instance.
     */
    public function create(Material $material, array $data): MaterialContent
    {
        return DB::transaction(function () use ($material, $data) {

            $sortOrder = (
                MaterialContent::where('material_id', $material->id)
                    ->max('sort_order') ?? 0
            ) + 1;

            $file = $data['file'] ?? null;
            $contentUrl = $data['content_url'] ?? null;
            $previewUrl = null;

            if ($file instanceof UploadedFile) {
                $stored = $this->storeUploadedFile($file);
                $contentUrl = $stored['url'];
                $previewUrl = $stored['preview_url'];
            }

            return MaterialContent::create([
                'material_id' => $material->id,
                'title' => $data['title'],
                'type' => $data['type'] ?? 'text',
                'content_url' => $contentUrl,
                'preview_url' => $previewUrl,
                'content_text' => $this->normalizeContentText($data['content_text'] ?? null),
                'duration' => $data['duration'] ?? null,
                'sort_order' => $sortOrder,
                'status' => $data['status'] ?? 'draft',
            ]);
        });
    }

    public function move(MaterialContent $materialContent, string $direction): void
    {
        DB::transaction(function () use ($materialContent, $direction) {

            $query = MaterialContent::where('material_id', $materialContent->material_id)
                ->whereNotNull('sort_order');

            if ($direction === 'up') {
                $swapWith = (clone $query)
                    ->where('sort_order', '<', $materialContent->sort_order)
                    ->orderByDesc('sort_order')
                    ->first();
            }

            if ($direction === 'down') {
                $swapWith = (clone $query)
                    ->where('sort_order', '>', $materialContent->sort_order)
                    ->orderBy('sort_order')
                    ->first();
            }

            if (! isset($swapWith)) {
                return;
            }

            $currentOrder = $materialContent->sort_order;

            $materialContent->update([
                'sort_order' => $swapWith->sort_order,
            ]);

            $swapWith->update([
                'sort_order' => $currentOrder,
            ]);
        });
    }

    public function update(MaterialContent $content, array $data): MaterialContent
    {
        return DB::transaction(function () use ($content, $data) {

            $newStatus = $data['status'] ?? $content->status;
            $isPublishing = $newStatus === 'published' && ! $content->isPublished();

            $file = $data['file'] ?? null;
            $hasContentUrl = array_key_exists('content_url', $data);

            $contentUrl = $hasContentUrl ? $data['content_url'] : $content->content_url;
            $contentText = array_key_exists('content_text', $data)
                ? $this->normalizeContentText($data['content_text'])
                : $content->content_text;

            // A new upload always wins over a pasted URL. Remove the previous
            // managed upload (and its generated preview) so storage does not
            // fill up with orphaned files.
            if ($file instanceof UploadedFile) {
                $this->deleteUploadedFile($content->content_url);
                $this->deleteUploadedFile($content->preview_url);
                $stored = $this->storeUploadedFile($file);
                $contentUrl = $stored['url'];
                $previewUrl = $stored['preview_url'];
            } elseif ($hasContentUrl && $contentUrl !== $content->content_url) {
                $this->deleteUploadedFile($content->content_url);
                $this->deleteUploadedFile($content->preview_url);
                $previewUrl = null;
            } else {
                $previewUrl = $content->preview_url;
            }

            if ($isPublishing) {
                $isQuiz = ($data['type'] ?? $content->type) === 'quiz';

                if (! $isQuiz && empty($contentUrl) && empty($contentText)) {
                    throw new DomainException('This content is incomplete. Add a file, URL, or text before publishing.');
                }

                if ($isQuiz && ! $content->quizQuestions()->exists()) {
                    throw new DomainException('This quiz is incomplete. Add at least one question before publishing.');
                }
            }

            $content->update([
                'title' => $data['title'] ?? $content->title,
                'type' => $data['type'] ?? $content->type,
                'content_url' => $contentUrl,
                'preview_url' => $previewUrl,
                'content_text' => $contentText,
                'duration' => $data['duration'] ?? $content->duration,
                'status' => $data['status'] ?? $content->status,
            ]);

            return $content->refresh();
        });
    }

    public function delete(MaterialContent $content): void
    {
        DB::transaction(function () use ($content) {

            $deletedOrder = $content->sort_order;
            $materialId = $content->material_id;

            $this->deleteUploadedFile($content->content_url);
            $this->deleteUploadedFile($content->preview_url);

            $content->delete();

            MaterialContent::where('material_id', $materialId)
                ->where('sort_order', '>', $deletedOrder)
                ->decrement('sort_order');
        });
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
