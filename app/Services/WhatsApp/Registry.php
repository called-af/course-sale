<?php

namespace App\Services\WhatsApp;

use App\Services\WhatsApp\Adapters\CustomWhatsAppAdapter;
use App\Services\WhatsApp\Adapters\FonnteWhatsAppAdapter;
use App\Services\WhatsApp\Adapters\InfobipWhatsAppAdapter;
use App\Services\WhatsApp\Adapters\MetaWhatsAppAdapter;
use App\Services\WhatsApp\Contracts\WhatsAppProviderContract;
use InvalidArgumentException;

class Registry
{
    /** @var array<string, class-string<WhatsAppProviderContract>> */
    protected array $adapters = [
        'meta' => MetaWhatsAppAdapter::class,
        'infobip' => InfobipWhatsAppAdapter::class,
        'fonnte' => FonnteWhatsAppAdapter::class,
        'custom' => CustomWhatsAppAdapter::class,
    ];

    public function register(string $driver, string $adapterClass): void
    {
        if (! is_a($adapterClass, WhatsAppProviderContract::class, true)) {
            throw new InvalidArgumentException("Adapter {$adapterClass} must implement WhatsAppProviderContract.");
        }

        $this->adapters[$driver] = $adapterClass;
    }

    public function make(AdapterConfig $config): WhatsAppProviderContract
    {
        $class = $this->adapters[$config->driver] ?? null;

        if ($class === null) {
            throw new InvalidArgumentException("Unknown WhatsApp driver: {$config->driver}.");
        }

        return app($class, ['config' => $config]);
    }

    public function drivers(): array
    {
        return array_keys($this->adapters);
    }
}
