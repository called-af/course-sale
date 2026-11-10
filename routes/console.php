<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduled tasks
|--------------------------------------------------------------------------
|
| Requires the server cron entry:
|   * * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1
|
*/

// Release abandoned Midtrans checkouts so students can retry.
Schedule::command('orders:expire')
    ->everyTenMinutes()
    ->withoutOverlapping()
    ->onOneServer();

// Keep the failed_jobs table from growing forever.
Schedule::command('queue:prune-failed --hours=168')
    ->daily()
    ->onOneServer();
