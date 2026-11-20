<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Data retention windows
    |--------------------------------------------------------------------------
    |
    | These values are used by `php artisan system:prune-data`, which is
    | scheduled daily in routes/console.php. Keep them long enough for support
    | and finance needs, but short enough to protect small VPS disks.
    |
    */

    'retention_days' => [
        'sessions' => (int) env('SESSION_RETENTION_DAYS', 14),
        'job_batches' => (int) env('JOB_BATCH_RETENTION_DAYS', 7),
        'operational_logs' => (int) env('OPERATIONAL_LOG_RETENTION_DAYS', 90),
        'payment_logs' => (int) env('PAYMENT_LOG_RETENTION_DAYS', 365),
        'chat_messages' => (int) env('CHAT_MESSAGE_RETENTION_DAYS', 180),
    ],

];
