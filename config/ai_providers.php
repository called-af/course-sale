<?php

/*
|--------------------------------------------------------------------------
| AI Provider Catalog
|--------------------------------------------------------------------------
|
| This file is the single source of truth for the provider presets shown in
| the admin dashboard. Adding a provider here (or registering a custom driver
| in App\Services\AI\Registry) does not require changes to business logic.
|
| - credential_fields: secrets stored encrypted in ai_provider_credentials
| - config_fields: non-secret settings stored in the ai_providers.config JSON
|
*/

return [

    // Allow endpoints on private networks (Ollama, LM Studio, vLLM, LiteLLM).
    // Disabled by default to protect against SSRF. Enable only for trusted
    // self-hosted deployments.
    'allow_local_endpoints' => filter_var(env('AI_ALLOW_LOCAL_ENDPOINTS', false), FILTER_VALIDATE_BOOLEAN),

    'drivers' => [
        'openai' => 'OpenAI',
        'openai_compatible' => 'OpenAI-Compatible',
        'azure_openai' => 'Azure OpenAI',
        'anthropic' => 'Anthropic',
        'gemini' => 'Google Gemini',
        'cohere' => 'Cohere',
        'bedrock' => 'Amazon Bedrock',
        'replicate' => 'Replicate',
        'cloudflare' => 'Cloudflare Workers AI',
    ],

    'providers' => [

        'openai' => [
            'name' => 'OpenAI',
            'driver' => 'openai',
            'base_url' => 'https://api.openai.com/v1',
            'description' => 'GPT models through the native OpenAI API.',
            'default_model' => 'gpt-4o-mini',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key', 'required' => true, 'secret' => true],
            ],
            'config_fields' => [
                ['key' => 'organization', 'label' => 'Organization ID', 'required' => false],
                ['key' => 'project', 'label' => 'Project ID', 'required' => false],
            ],
            'capabilities' => ['text', 'streaming', 'vision', 'tools', 'structured_output', 'json_mode', 'embeddings'],
        ],

        'anthropic' => [
            'name' => 'Anthropic Claude',
            'driver' => 'anthropic',
            'base_url' => 'https://api.anthropic.com/v1',
            'description' => 'Claude models through the Anthropic Messages API.',
            'default_model' => 'claude-3-5-sonnet-latest',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key', 'required' => true, 'secret' => true],
            ],
            'config_fields' => [
                ['key' => 'api_version', 'label' => 'API Version', 'required' => false, 'default' => '2023-06-01'],
            ],
            'capabilities' => ['text', 'streaming', 'vision', 'tools', 'structured_output'],
        ],

        'gemini' => [
            'name' => 'Google Gemini',
            'driver' => 'gemini',
            'base_url' => 'https://generativelanguage.googleapis.com/v1beta',
            'description' => 'Gemini models through the Google Generative Language API.',
            'default_model' => 'gemini-2.0-flash',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key', 'required' => true, 'secret' => true],
            ],
            'config_fields' => [],
            'capabilities' => ['text', 'streaming', 'vision', 'tools', 'structured_output', 'json_mode', 'embeddings'],
        ],

        'mistral' => [
            'name' => 'Mistral AI',
            'driver' => 'openai_compatible',
            'base_url' => 'https://api.mistral.ai/v1',
            'description' => 'Mistral models through their OpenAI-compatible API.',
            'default_model' => 'mistral-large-latest',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key', 'required' => true, 'secret' => true],
            ],
            'config_fields' => [],
            'capabilities' => ['text', 'streaming', 'vision', 'tools', 'json_mode', 'embeddings'],
        ],

        'cohere' => [
            'name' => 'Cohere',
            'driver' => 'cohere',
            'base_url' => 'https://api.cohere.com/v2',
            'description' => 'Command models through the Cohere Chat v2 API.',
            'default_model' => 'command-r-plus',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key', 'required' => true, 'secret' => true],
            ],
            'config_fields' => [],
            'capabilities' => ['text', 'streaming', 'tools', 'structured_output', 'json_mode', 'embeddings'],
        ],

        'deepseek' => [
            'name' => 'DeepSeek',
            'driver' => 'openai_compatible',
            'base_url' => 'https://api.deepseek.com/v1',
            'description' => 'DeepSeek chat and reasoning models.',
            'default_model' => 'deepseek-chat',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key', 'required' => true, 'secret' => true],
            ],
            'config_fields' => [],
            'capabilities' => ['text', 'streaming', 'tools', 'json_mode'],
        ],

        'xai' => [
            'name' => 'xAI Grok',
            'driver' => 'openai_compatible',
            'base_url' => 'https://api.x.ai/v1',
            'description' => 'Grok models through the xAI API.',
            'default_model' => 'grok-2-latest',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key', 'required' => true, 'secret' => true],
            ],
            'config_fields' => [],
            'capabilities' => ['text', 'streaming', 'vision', 'tools', 'json_mode'],
        ],

        'ai21' => [
            'name' => 'AI21 Labs',
            'driver' => 'openai_compatible',
            'base_url' => 'https://api.ai21.com/studio/v1',
            'description' => 'Jamba models through the AI21 OpenAI-compatible API.',
            'default_model' => 'jamba-1.5-large',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key', 'required' => true, 'secret' => true],
            ],
            'config_fields' => [],
            'capabilities' => ['text', 'streaming', 'tools', 'json_mode'],
        ],

        'azure_openai' => [
            'name' => 'Azure OpenAI',
            'driver' => 'azure_openai',
            'base_url' => 'https://YOUR-RESOURCE.openai.azure.com',
            'description' => 'Azure-hosted OpenAI deployments.',
            'default_model' => 'gpt-4o-mini',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key', 'required' => true, 'secret' => true],
            ],
            'config_fields' => [
                ['key' => 'api_version', 'label' => 'API Version', 'required' => true, 'default' => '2024-10-21'],
                ['key' => 'deployment', 'label' => 'Deployment Name', 'required' => true],
            ],
            'capabilities' => ['text', 'streaming', 'vision', 'tools', 'structured_output', 'json_mode', 'embeddings'],
        ],

        'bedrock' => [
            'name' => 'Amazon Bedrock',
            'driver' => 'bedrock',
            'base_url' => null,
            'description' => 'AWS Bedrock Converse API with SigV4 authentication.',
            'default_model' => 'anthropic.claude-3-5-sonnet-20240620-v1:0',
            'credential_fields' => [
                ['key' => 'access_key_id', 'label' => 'AWS Access Key ID', 'required' => true, 'secret' => true],
                ['key' => 'secret_access_key', 'label' => 'AWS Secret Access Key', 'required' => true, 'secret' => true],
                ['key' => 'session_token', 'label' => 'AWS Session Token', 'required' => false, 'secret' => true],
            ],
            'config_fields' => [
                ['key' => 'region', 'label' => 'AWS Region', 'required' => true, 'default' => 'us-east-1'],
            ],
            'capabilities' => ['text', 'streaming', 'vision', 'tools'],
        ],

        'openrouter' => [
            'name' => 'OpenRouter',
            'driver' => 'openai_compatible',
            'base_url' => 'https://openrouter.ai/api/v1',
            'description' => 'Unified router for hundreds of hosted models.',
            'default_model' => 'anthropic/claude-3.5-sonnet',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key', 'required' => true, 'secret' => true],
            ],
            'config_fields' => [
                ['key' => 'site_url', 'label' => 'Site URL (HTTP-Referer)', 'required' => false],
                ['key' => 'site_name', 'label' => 'Site Name (X-Title)', 'required' => false],
            ],
            'capabilities' => ['text', 'streaming', 'vision', 'tools', 'structured_output', 'json_mode'],
        ],

        'nvidia' => [
            'name' => 'NVIDIA NIM',
            'driver' => 'openai_compatible',
            'base_url' => 'https://integrate.api.nvidia.com/v1',
            'description' => 'NVIDIA API Catalog and NIM microservices.',
            'default_model' => 'nvidia/llama-3.1-nemotron-70b-instruct',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key', 'required' => true, 'secret' => true],
            ],
            'config_fields' => [],
            'capabilities' => ['text', 'streaming', 'tools', 'json_mode', 'embeddings'],
        ],

        'litellm' => [
            'name' => 'LiteLLM',
            'driver' => 'openai_compatible',
            'base_url' => 'http://localhost:4000/v1',
            'description' => 'Self-hosted LiteLLM proxy.',
            'default_model' => 'gpt-4o-mini',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key (optional)', 'required' => false, 'secret' => true],
            ],
            'config_fields' => [],
            'capabilities' => ['text', 'streaming', 'vision', 'tools', 'json_mode'],
        ],

        'vercel_ai_gateway' => [
            'name' => 'Vercel AI Gateway',
            'driver' => 'openai_compatible',
            'base_url' => 'https://ai-gateway.vercel.sh/v1',
            'description' => 'Vercel AI Gateway unified inference API.',
            'default_model' => 'openai/gpt-4o-mini',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key', 'required' => true, 'secret' => true],
            ],
            'config_fields' => [],
            'capabilities' => ['text', 'streaming', 'vision', 'tools', 'json_mode'],
        ],

        'together' => [
            'name' => 'Together AI',
            'driver' => 'openai_compatible',
            'base_url' => 'https://api.together.xyz/v1',
            'description' => 'Open-source models hosted by Together AI.',
            'default_model' => 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key', 'required' => true, 'secret' => true],
            ],
            'config_fields' => [],
            'capabilities' => ['text', 'streaming', 'vision', 'tools', 'json_mode', 'embeddings'],
        ],

        'fireworks' => [
            'name' => 'Fireworks AI',
            'driver' => 'openai_compatible',
            'base_url' => 'https://api.fireworks.ai/inference/v1',
            'description' => 'Fast open-source model inference by Fireworks.',
            'default_model' => 'accounts/fireworks/models/llama-v3p3-70b-instruct',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key', 'required' => true, 'secret' => true],
            ],
            'config_fields' => [],
            'capabilities' => ['text', 'streaming', 'vision', 'tools', 'json_mode', 'embeddings'],
        ],

        'groq' => [
            'name' => 'Groq',
            'driver' => 'openai_compatible',
            'base_url' => 'https://api.groq.com/openai/v1',
            'description' => 'Ultra-low latency inference on Groq LPUs.',
            'default_model' => 'llama-3.3-70b-versatile',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key', 'required' => true, 'secret' => true],
            ],
            'config_fields' => [],
            'capabilities' => ['text', 'streaming', 'tools', 'json_mode'],
        ],

        'replicate' => [
            'name' => 'Replicate',
            'driver' => 'replicate',
            'base_url' => 'https://api.replicate.com/v1',
            'description' => 'Run community models through Replicate predictions.',
            'default_model' => 'meta/meta-llama-3-70b-instruct',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Token', 'required' => true, 'secret' => true],
            ],
            'config_fields' => [
                ['key' => 'version', 'label' => 'Model Version (optional)', 'required' => false],
            ],
            'capabilities' => ['text'],
        ],

        'huggingface' => [
            'name' => 'Hugging Face Inference',
            'driver' => 'openai_compatible',
            'base_url' => 'https://router.huggingface.co/v1',
            'description' => 'Hugging Face Inference Providers router.',
            'default_model' => 'meta-llama/Llama-3.3-70B-Instruct',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'Access Token', 'required' => true, 'secret' => true],
            ],
            'config_fields' => [],
            'capabilities' => ['text', 'streaming', 'vision', 'tools'],
        ],

        'cloudflare' => [
            'name' => 'Cloudflare Workers AI',
            'driver' => 'cloudflare',
            'base_url' => 'https://api.cloudflare.com/client/v4',
            'description' => 'Serverless inference on Cloudflare Workers AI.',
            'default_model' => '@cf/meta/llama-3.1-8b-instruct',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Token', 'required' => true, 'secret' => true],
            ],
            'config_fields' => [
                ['key' => 'account_id', 'label' => 'Account ID', 'required' => true],
            ],
            'capabilities' => ['text', 'streaming', 'tools'],
        ],

        'ollama' => [
            'name' => 'Ollama',
            'driver' => 'openai_compatible',
            'base_url' => 'http://localhost:11434/v1',
            'description' => 'Local Ollama server (OpenAI-compatible endpoint).',
            'default_model' => 'llama3.2',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key (optional)', 'required' => false, 'secret' => true],
            ],
            'config_fields' => [],
            'capabilities' => ['text', 'streaming', 'vision', 'tools', 'json_mode'],
        ],

        'lmstudio' => [
            'name' => 'LM Studio',
            'driver' => 'openai_compatible',
            'base_url' => 'http://localhost:1234/v1',
            'description' => 'Local LM Studio server.',
            'default_model' => 'local-model',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key (optional)', 'required' => false, 'secret' => true],
            ],
            'config_fields' => [],
            'capabilities' => ['text', 'streaming', 'tools', 'json_mode'],
        ],

        'vllm' => [
            'name' => 'vLLM',
            'driver' => 'openai_compatible',
            'base_url' => 'http://localhost:8000/v1',
            'description' => 'Self-hosted vLLM inference server.',
            'default_model' => 'meta-llama/Llama-3.1-8B-Instruct',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key (optional)', 'required' => false, 'secret' => true],
            ],
            'config_fields' => [],
            'capabilities' => ['text', 'streaming', 'tools', 'json_mode'],
        ],

        'llamacpp' => [
            'name' => 'llama.cpp',
            'driver' => 'openai_compatible',
            'base_url' => 'http://localhost:8080/v1',
            'description' => 'llama.cpp server with the OpenAI-compatible API.',
            'default_model' => 'local-model',
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key (optional)', 'required' => false, 'secret' => true],
            ],
            'config_fields' => [],
            'capabilities' => ['text', 'streaming', 'json_mode'],
        ],

        'custom_openai' => [
            'name' => 'Custom OpenAI-Compatible',
            'driver' => 'openai_compatible',
            'base_url' => null,
            'description' => 'Any inference server exposing /chat/completions.',
            'default_model' => null,
            'credential_fields' => [
                ['key' => 'api_key', 'label' => 'API Key (optional)', 'required' => false, 'secret' => true],
            ],
            'config_fields' => [
                ['key' => 'headers', 'label' => 'Custom Headers (JSON object)', 'required' => false, 'type' => 'json'],
                ['key' => 'parameters', 'label' => 'Default Parameters (JSON object)', 'required' => false, 'type' => 'json'],
            ],
            'capabilities' => ['text', 'streaming', 'tools', 'json_mode'],
        ],

    ],
];
