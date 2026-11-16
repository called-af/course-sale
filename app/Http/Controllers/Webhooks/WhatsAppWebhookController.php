<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\WhatsAppContact;
use App\Models\WhatsAppConversation;
use App\Models\WhatsAppDeliveryLog;
use App\Models\WhatsAppMessage;
use App\Models\WhatsAppProvider;
use App\Models\WhatsAppWebhook;
use App\Services\WhatsApp\DTO\NormalizedWebhookEvent;
use App\Services\WhatsApp\Exceptions\ProviderException;
use App\Services\WhatsApp\Manager;
use App\Support\PhoneNumber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WhatsAppWebhookController extends Controller
{
    public function __construct(protected Manager $manager) {}

    public function verify(Request $request, string $provider): Response
    {
        $model = $this->provider($provider);
        abort_unless($model->driver === 'meta', 405);

        $expected = (string) $model->credential('verify_token');

        if ($expected === '') {
            return response('Webhook verify token belum dikonfigurasi.', 403);
        }

        $mode = $request->query('hub.mode', $request->query('hub_mode'));
        $token = $request->query('hub.verify_token', $request->query('hub_verify_token'));
        $challenge = $request->query('hub.challenge', $request->query('hub_challenge'));

        if ($mode !== 'subscribe' || ! hash_equals($expected, (string) $token)) {
            return response('Verifikasi webhook gagal.', 403);
        }

        return response((string) $challenge, 200)->header('Content-Type', 'text/plain');
    }

    public function handle(Request $request, string $provider): JsonResponse
    {
        $model = $this->provider($provider);
        abort_unless($model->enabled, 404);

        $rawBody = $request->getContent();
        $payload = json_decode($rawBody, true);
        if (! is_array($payload)) {
            $payload = $request->all();
        }

        $headers = $request->headers->all();

        try {
            $event = $this->manager->parseWebhook($model, $payload, $headers, $rawBody);
        } catch (ProviderException $exception) {
            WhatsAppWebhook::create([
                'whatsapp_provider_id' => $model->id,
                'event' => 'rejected',
                'status' => 'failed',
                'error' => mb_substr($exception->getMessage(), 0, 1000),
                'payload' => $payload,
                'processed_at' => now(),
            ]);

            return response()->json(['success' => false, 'error' => $exception->getMessage()], 403);
        } catch (\Throwable $exception) {
            Log::error('WhatsApp webhook parse failed', [
                'provider' => $model->slug,
                'error' => $exception->getMessage(),
            ]);

            return response()->json(['success' => false, 'error' => 'Webhook tidak dapat diproses.'], 422);
        }

        $webhook = WhatsAppWebhook::create([
            'whatsapp_provider_id' => $model->id,
            'event' => $event->event,
            'provider_event' => $event->messages[0]['event'] ?? $event->statuses[0]['event'] ?? null,
            'payload' => $payload,
            'status' => 'received',
        ]);

        try {
            DB::transaction(function () use ($model, $event, $webhook) {
                $this->persistMessages($model, $event);
                $this->persistStatuses($model, $event);

                $webhook->forceFill(['status' => 'processed', 'processed_at' => now()])->save();
            });
        } catch (\Throwable $exception) {
            $webhook->forceFill([
                'status' => 'failed',
                'error' => mb_substr($exception->getMessage(), 0, 1000),
                'processed_at' => now(),
            ])->save();

            Log::error('WhatsApp webhook persistence failed', [
                'provider' => $model->slug,
                'error' => $exception->getMessage(),
            ]);

            return response()->json(['success' => false, 'error' => 'Webhook gagal disimpan.'], 500);
        }

        return response()->json(['success' => true, 'event' => $event->event]);
    }

    protected function persistMessages(WhatsAppProvider $provider, NormalizedWebhookEvent $event): void
    {
        foreach ($event->messages as $payload) {
            $from = PhoneNumber::normalize((string) ($payload['from'] ?? ''));
            if ($from === '') {
                continue;
            }

            $contact = WhatsAppContact::firstOrCreate(
                ['phone_number' => $from],
                ['name' => $payload['contact_name'] ?? null, 'wa_id' => $from],
            );

            if (filled($payload['contact_name']) && blank($contact->name)) {
                $contact->forceFill(['name' => $payload['contact_name']])->save();
            }

            $conversation = WhatsAppConversation::query()
                ->where('whatsapp_provider_id', $provider->id)
                ->where('whatsapp_contact_id', $contact->id)
                ->where('status', 'open')
                ->latest('last_message_at')
                ->first();

            if (! $conversation) {
                $conversation = WhatsAppConversation::create([
                    'whatsapp_provider_id' => $provider->id,
                    'whatsapp_contact_id' => $contact->id,
                    'external_conversation_id' => $payload['provider_message_id'] ?? null,
                    'status' => 'open',
                    'last_message_at' => now(),
                ]);
            } else {
                $conversation->forceFill(['last_message_at' => now()])->save();
            }

            $providerMessageId = (string) ($payload['provider_message_id'] ?? '');
            if ($providerMessageId !== '' && WhatsAppMessage::query()
                ->where('whatsapp_provider_id', $provider->id)
                ->where('provider_message_id', $providerMessageId)
                ->exists()) {
                continue;
            }

            WhatsAppMessage::create([
                'whatsapp_provider_id' => $provider->id,
                'whatsapp_conversation_id' => $conversation->id,
                'whatsapp_contact_id' => $contact->id,
                'direction' => 'inbound',
                'type' => (string) ($payload['type'] ?? 'text'),
                'from' => $from,
                'to' => (string) ($payload['to'] ?? ''),
                'body' => $payload['body'] ?? null,
                'media_url' => $payload['media_url'] ?? null,
                'provider_message_id' => $providerMessageId !== '' ? $providerMessageId : null,
                'status' => 'received',
                'payload' => $payload['raw'] ?? $payload,
            ]);
        }
    }

    protected function persistStatuses(WhatsAppProvider $provider, NormalizedWebhookEvent $event): void
    {
        foreach ($event->statuses as $payload) {
            $providerMessageId = (string) ($payload['provider_message_id'] ?? '');
            if ($providerMessageId === '') {
                continue;
            }

            $message = WhatsAppMessage::query()
                ->where('whatsapp_provider_id', $provider->id)
                ->where('provider_message_id', $providerMessageId)
                ->first();

            $status = $this->mapStatus((string) ($payload['status'] ?? 'unknown'));

            if ($message) {
                $updates = ['status' => $status];

                if ($status === 'delivered') {
                    $updates['delivered_at'] = now();
                } elseif ($status === 'read') {
                    $updates['read_at'] = now();
                } elseif ($status === 'failed') {
                    $updates['error_message'] = $payload['error_message'] ?? $payload['description'] ?? null;
                }

                $message->forceFill($updates)->save();
            }

            WhatsAppDeliveryLog::create([
                'whatsapp_message_id' => $message?->id,
                'whatsapp_provider_id' => $provider->id,
                'status' => $status,
                'provider_status' => (string) ($payload['provider_status'] ?? $payload['status'] ?? ''),
                'description' => $payload['error_message'] ?? $payload['description'] ?? null,
                'payload' => $payload['raw'] ?? $payload,
            ]);
        }
    }

    protected function mapStatus(string $status): string
    {
        return match (strtolower($status)) {
            'sent', 'accepted', 'pending_enroute' => 'sent',
            'delivered' => 'delivered',
            'read' => 'read',
            'failed', 'undeliverable', 'rejected' => 'failed',
            'received' => 'received',
            default => strtolower($status),
        };
    }

    protected function provider(string $slug): WhatsAppProvider
    {
        return WhatsAppProvider::query()->where('slug', $slug)->firstOrFail();
    }
}
