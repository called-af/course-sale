<?php

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

    'nvidia' => [
        'api_key' => env('NVIDIA_API_KEY'),
        'base_url' => env('NVIDIA_BASE_URL'),
        'model' => env('NVIDIA_MODEL'),
    ],

    'recommendation' => [
        'url' => env('RECOMMENDATION_SERVICE_URL', 'http://127.0.0.1:8001'),
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
