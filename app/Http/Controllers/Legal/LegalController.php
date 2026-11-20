<?php

namespace App\Http\Controllers\Legal;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class LegalController extends Controller
{
    /**
     * Informative Terms of Service content for the public legal page.
     */
    public function terms(): Response
    {
        return Inertia::render('legal/terms', [
            'title' => 'Terms & Conditions',
            'updated_at' => 'November 5, 2026',
            'sections' => [
                [
                    'heading' => 'Acceptance of Terms',
                    'body' => 'By accessing or using this learning platform, you understand and agree to the applicable Terms & Conditions. If you do not agree, please stop using this service.',
                ],
                [
                    'heading' => 'Account & Security',
                    'body' => 'You are responsible for keeping your account credentials confidential, protecting personal data, and accessing course content only through the account you own.',
                ],
                [
                    'heading' => 'Purchases & Payments',
                    'body' => 'Course purchases through the platform\'s official payment gateway (currently Midtrans) are processed according to the merchant terms. Successful payments grant access to the course materials.',
                ],
                [
                    'heading' => 'Refunds & Access Restrictions',
                    'body' => 'Purchased courses may be revoked according to the policy within a certain period. Once a refund is processed, access to the course materials will be revoked.',
                ],
                [
                    'heading' => 'User Conduct',
                    'body' => 'You must not distribute course materials, attempt to access other people\'s materials, or use the platform for unlawful purposes.',
                ],
            ],
        ]);
    }

    /**
     * Informative Privacy Policy content for the public legal page.
     */
    public function privacy(): Response
    {
        return Inertia::render('legal/privacy', [
            'title' => 'Privacy Policy',
            'updated_at' => 'November 5, 2026',
            'sections' => [
                [
                    'heading' => 'Data We Collect',
                    'body' => 'We collect account data (name, email), learning data (enrolled classes, material progress), and payment transaction data for operational purposes.',
                ],
                [
                    'heading' => 'Use of Data',
                    'body' => 'Data is used to process purchases, provide learning access, send notifications, improve the service, and comply with applicable regulations.',
                ],
                [
                    'heading' => 'Storage & Security',
                    'body' => 'Data is stored with encryption and strict access controls. Payment tokens are stored as transaction references and do not expose sensitive data to payment providers.',
                ],
                [
                    'heading' => 'User Rights',
                    'body' => 'You may request access, correction, or deletion of your account data in accordance with applicable regulations.',
                ],
            ],
        ]);
    }
}
