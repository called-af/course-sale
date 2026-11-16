<?php

/*
|--------------------------------------------------------------------------
| WhatsApp Provider Catalog
|--------------------------------------------------------------------------
|
| Presets shown on the WhatsApp integration page. Provider-specific adapters
| live in App\Services\WhatsApp\Adapters. Add a preset here to make a new
| provider available in the dashboard without touching application logic.
|
*/

return [

    // Needed for self-hosted / local gateways. Disabled by default (SSRF guard).
    'allow_local_endpoints' => filter_var(env('WHATSAPP_ALLOW_LOCAL_ENDPOINTS', false), FILTER_VALIDATE_BOOLEAN),

    'drivers' => [
        'meta' => 'Meta WhatsApp Cloud API',
        'infobip' => 'Infobip',
        'fonnte' => 'Fonnte',
        'custom' => 'Custom WhatsApp API',
    ],

    'providers' => [

        'meta' => [
            'name' => 'Meta WhatsApp Cloud API',
            'driver' => 'meta',
            'base_url' => 'https://graph.facebook.com',
            'description' => 'Official WhatsApp Business Platform through Meta Graph API.',
            'credential_fields' => [
                ['key' => 'access_token', 'label' => 'Access Token', 'required' => true, 'secret' => true],
                ['key' => 'app_secret', 'label' => 'App Secret (webhook signature)', 'required' => false, 'secret' => true],
                ['key' => 'verify_token', 'label' => 'Webhook Verify Token', 'required' => false, 'secret' => true],
            ],
            'config_fields' => [
                ['key' => 'phone_number_id', 'label' => 'Phone Number ID', 'required' => true],
                ['key' => 'business_account_id', 'label' => 'WhatsApp Business Account ID', 'required' => false],
                ['key' => 'api_version', 'label' => 'Graph API Version', 'required' => false, 'default' => 'v21.0'],
            ],
            'capabilities' => ['text', 'image', 'document', 'video', 'audio', 'location', 'interactive', 'template', 'status', 'webhook'],
        ],

        'infobip' => [
            'name' => 'Infobip WhatsApp',
            'driver' => 'infobip',
            'base_url' => 'https://YOUR-TENANT.api.infobip.com',
            'description' => 'Infobip WhatsApp Business API.',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key', 'required' => true, 'secret' => true],
                ['key' => 'webhook_secret', 'label' => 'Webhook HMAC Secret (optional)', 'required' => false, 'secret' => true],
            ],
            'config_fields' => [
                ['key' => 'from', 'label' => 'Sender Number', 'required' => true],
                ['key' => 'sandbox_keyword', 'label' => 'Sandbox Keyword', 'required' => false],
                ['key' => 'account_key', 'label' => 'Account Key (optional)', 'required' => false],
            ],
            'capabilities' => ['text', 'image', 'document', 'video', 'audio', 'location', 'template', 'status', 'webhook'],
        ],

        'fonnte' => [
            'name' => 'Fonnte',
            'driver' => 'fonnte',
            'base_url' => 'https://api.fonnte.com',
            'description' => 'Indonesian WhatsApp gateway by Fonnte.',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Token', 'required' => true, 'secret' => true],
                ['key' => 'webhook_token', 'label' => 'Webhook Token (optional)', 'required' => false, 'secret' => true],
            ],
            'config_fields' => [
                ['key' => 'sender', 'label' => 'Device / Sender Number (optional)', 'required' => false],
                ['key' => 'country_code', 'label' => 'Country Code', 'required' => false, 'default' => '62'],
            ],
            'capabilities' => ['text', 'image', 'document', 'video', 'audio', 'location', 'webhook'],
        ],

        'custom' => [
            'name' => 'Custom WhatsApp API',
            'driver' => 'custom',
            'base_url' => null,
            'description' => 'Generic JSON gateway. Configure the endpoint contract explicitly.',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key / Token', 'required' => false, 'secret' => true],
                ['key' => 'webhook_secret', 'label' => 'Webhook HMAC Secret (optional)', 'required' => false, 'secret' => true],
            ],
            'config_fields' => [
                ['key' => 'send_path', 'label' => 'Send Path', 'required' => true, 'default' => '/messages'],
                ['key' => 'send_method', 'label' => 'HTTP Method', 'required' => false, 'default' => 'POST'],
                ['key' => 'auth_header', 'label' => 'Auth Header', 'required' => false, 'default' => 'Authorization'],
                ['key' => 'auth_prefix', 'label' => 'Auth Prefix', 'required' => false, 'default' => 'Bearer '],
                ['key' => 'to_field', 'label' => 'Recipient Field', 'required' => false, 'default' => 'to'],
                ['key' => 'message_field', 'label' => 'Message Field', 'required' => false, 'default' => 'message'],
                ['key' => 'from', 'label' => 'Sender / From', 'required' => false],
                ['key' => 'status_path', 'label' => 'Status Path (optional)', 'required' => false],
            ],
            'capabilities' => ['text', 'document', 'webhook'],
        ],

    ],
];
