<?php

$midtransProduction = filter_var(env('MIDTRANS_IS_PRODUCTION', false), FILTER_VALIDATE_BOOLEAN);

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'recommendation' => [
        'url' => env('RECOMMENDATION_SERVICE_URL', 'http://127.0.0.1:8001'),
    ],

    'libreoffice' => [
        // Used to convert uploaded Word/PowerPoint files into a PDF that can
        // be rendered inline in the lesson. Set to null to disable.
        'binary' => env('LIBREOFFICE_BINARY', 'soffice'),
    ],

    'payment' => [
        // Midtrans is the only supported payment gateway.
        'default' => env('PAYMENT_GATEWAY', 'midtrans'),
        'currency' => env('PAYMENT_CURRENCY', 'IDR'),
        // Percentage retained by the platform from each course sale before
        // the instructor payout ledger is credited.
        'platform_fee_percent' => (float) env('PLATFORM_FEE_PERCENT', 20),
        // Payout operations. Funds are held for a few days after settlement
        // before they become payable, so refunds/chargebacks can still be
        // processed safely. Bank account changes are locked for a while to
        // protect instructors from account-takeover fraud.
        'payout_hold_days' => (int) env('PAYOUT_HOLD_DAYS', 7),
        'payout_minimum' => (float) env('PAYOUT_MINIMUM', 100000),
        'payout_account_lock_hours' => (int) env('PAYOUT_ACCOUNT_LOCK_HOURS', 24),
        // Refund policy for paid courses. Students may only request a refund
        // within this window and while their lesson progress is still low.
        'refund_window_days' => (int) env('REFUND_WINDOW_DAYS', 7),
        'refund_max_progress_percent' => (int) env('REFUND_MAX_PROGRESS_PERCENT', 25),
        'midtrans' => [
            'is_production' => $midtransProduction,
            // Hosts are derived from the environment unless explicitly
            // overridden. This avoids accidentally staying on the sandbox
            // host after flipping MIDTRANS_IS_PRODUCTION=true.
            'snap_base_url' => env('MIDTRANS_SNAP_BASE_URL') ?: ($midtransProduction
                ? 'https://app.midtrans.com'
                : 'https://app.sandbox.midtrans.com'),
            'api_base_url' => env('MIDTRANS_API_BASE_URL') ?: ($midtransProduction
                ? 'https://api.midtrans.com'
                : 'https://api.sandbox.midtrans.com'),
            'server_key' => env('MIDTRANS_SERVER_KEY'),
            'client_key' => env('MIDTRANS_CLIENT_KEY'),
            'merchant_id' => env('MIDTRANS_MERCHANT_ID'),
            'timeout' => (int) env('MIDTRANS_TIMEOUT', 15),
        ],
    ],

    'ai' => [
        'nvidia' => [
            'base_url' => env('NVIDIA_BASE_URL', 'https://integrate.api.nvidia.com/v1'),
            'model' => env('NVIDIA_MODEL', 'nvidia/llama-3.1-nemotron-70b-instruct'),
            'timeout' => (float) env('NVIDIA_TIMEOUT', 30),
        ],
        'openai' => [
            'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
            'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
            'timeout' => (float) env('OPENAI_TIMEOUT', 30),
        ],
    ],

    'whatsapp' => [
        'provider' => env('WHATSAPP_PROVIDER', 'infobip'),
        'infobip' => [
            'base_url' => env('INFOBIP_BASE_URL', 'https://55z3yd.api.infobip.com'),
            'api_key' => env('INFOBIP_API_KEY'),
            'from' => env('INFOBIP_FROM', '447860088970'),
            'sandbox_keyword' => env('INFOBIP_SANDBOX_KEYWORD', 'ARKADANISAYSSTUFF'),
        ],
        'access_token' => env('WHATSAPP_ACCESS_TOKEN'),
        'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),
        'api_version' => env('WHATSAPP_API_VERSION', 'v21.0'),
        'template_name' => env('WHATSAPP_TEMPLATE_NAME'),
        'template_lang' => env('WHATSAPP_TEMPLATE_LANG', 'id'),
        'timeout' => env('WHATSAPP_TIMEOUT', 15),
    ],

];
