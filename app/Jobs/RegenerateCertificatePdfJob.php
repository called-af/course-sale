<?php

namespace App\Jobs;

use App\Models\Certificate;
use App\Models\Course;
use App\Services\CertificateService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RegenerateCertificatePdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 110;

    public function __construct(
        public int $certificateId,
    ) {}

    public function handle(CertificateService $certificateService): void
    {
        // The certificate may have been deleted while this job was queued.
        $certificate = Certificate::find($this->certificateId);

        if (! $certificate || ! Course::find($certificate->course_id)) {
            return;
        }

        $certificateService->regenerate($certificate);
    }
}
