# AI Providers, Models and Credentials

> Part of the [Feature Documentation](../FEATURES.md) index.

## Overview

Admin configures AI providers from a single integration page. Credentials are
stored encrypted and never returned to the browser in plain text. A default
provider is used first, with configurable fallback to other enabled providers.

## Roles

- **Admin only** — all provider and model routes are admin-only.
- **Students and instructors** — consume AI through the
  [AI assistant](ai-assistant.md).

## Flow

### 1. Manage providers

1. Admin opens `/admin/integrations/ai`.
2. Admin creates a provider with a driver, name, base URL, credential values and
   optional configuration.
3. Admin can update, enable/disable, test and delete providers.
4. Admin sets one provider as default.
5. Admin discovers models from the provider or adds models manually.
6. Admin can toggle global AI and the recommendation engine from this page.

Supported drivers: `openai`, `openai_compatible`, `azure_openai`, `anthropic`,
`gemini`, `cohere`, `bedrock`, `replicate` and `cloudflare`.

### 2. Test and discover

1. Admin clicks **Test** on a provider.
2. The platform calls the provider with a small request and reports success or a
   sanitized error.
3. Admin clicks **Discover models** to fetch available model IDs.
4. Discovered models are stored; trashed models are restored when discovered again.
5. Test and discover endpoints are throttled to 10 requests per minute.

### 3. Fallback behavior

1. The manager selects enabled providers in this order: default first, then
   `fallback_priority` ascending, then ID.
2. Fallback happens on retryable provider errors and configuration errors.
3. For streaming, fallback is only possible before the first chunk is sent.
4. Non-retryable errors do not trigger fallback.

### 4. Import legacy configuration

If no providers exist and a legacy API key is configured, admin can import it
as `OpenAI (legacy)` or `NVIDIA NIM (legacy)`.

## Rules and guards

- Credentials are encrypted in `AiProviderCredential.value`.
- The API exposes only `has_value` and a last-four-character hint.
- Provider config is hidden from serialization.
- Base URLs are checked by `UrlGuard`:
  - only `http`/`https`,
  - no embedded credentials,
  - custom ports require local mode,
  - localhost, private, reserved and cloud metadata hosts are rejected.
- Local endpoints require `AI_ALLOW_LOCAL_ENDPOINTS`.
- Timeout: 1–300 seconds; retries: 0–5; priority: 0–9999.
- Exactly one provider can be default.
- Disabling the default reassigns it to another enabled provider by priority.
- Deleting the last provider is blocked:
  `At least one AI provider must remain available.`

## Where to find it

- **UI:** `resources/js/pages/admin/integrations/Ai.tsx`.
- **Routes:** `/admin/integrations/ai` and nested provider/model CRUD,
  `toggle`, `default`, `test`, `models/discover`, `import-legacy`, `global` and
  `recommendation` routes.

## Key implementation files

- `app/Http/Controllers/Admin/AiIntegrationController.php`
- `app/Services/AI/Registry.php`
- `app/Services/AI/AiProviderManager.php`
- `app/Services/AI/UrlGuard.php`
- `app/Models/AiProvider.php`
- `app/Models/AiProviderCredential.php`
- `config/ai_providers.php`

## Edge cases

- Encrypted values cannot be read back, only replaced.
- Bedrock does not use a normal base URL and is exempt from `UrlGuard`.
- Discovery and test failures are surfaced without revealing secrets.
- The global AI toggle and provider enablement are separate controls; both must
  allow a request for chat to work.

## Related guides

- [AI assistant](ai-assistant.md)
- [Settings and branding](settings-and-branding.md)
- [Recommendation engine](recommendation-engine.md)
