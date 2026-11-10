<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use App\Models\PaymentProvider;
use App\Models\PaymentSetting;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        $midtransConfigured = filled(config('services.payment.midtrans.server_key'));

        $midtrans = PaymentProvider::updateOrCreate(
            ['code' => 'midtrans'],
            [
                'name' => 'Midtrans',
                'is_active' => true,
            ],
        );

        $methods = [
            [$midtrans, 'Credit Card', 'credit_card'],
            [$midtrans, 'QRIS', 'qris'],
            [$midtrans, 'Virtual Account', 'virtual_account'],
            [$midtrans, 'GoPay', 'gopay'],
        ];

        foreach ($methods as [$provider, $name, $code]) {
            PaymentMethod::updateOrCreate(
                ['provider_id' => $provider->id, 'code' => $code],
                ['name' => $name],
            );
        }

        // Keep the stored gateway in sync when credentials are present. This
        // makes re-running the seeder a safe way to switch an existing
        // installation to Midtrans after configuring the environment.
        if ($midtransConfigured) {
            PaymentSetting::current()->forceFill(['gateway' => 'midtrans'])->save();
        }
    }
}
