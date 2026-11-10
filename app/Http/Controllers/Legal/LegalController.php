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
            'title' => 'Syarat & Ketentuan',
            'updated_at' => '5 November 2026',
            'sections' => [
                [
                    'heading' => 'Penerimaan Syarat',
                    'body' => 'Dengan mengakses atau menggunakan platform belajar ini, kamu memahami dan menyetujui Syarat & Ketentuan yang berlaku. Jika kamu tidak setuju, harap berhenti menggunakan layanan ini.',
                ],
                [
                    'heading' => 'Akun & Keamanan',
                    'body' => 'Kamu bertanggung jawab menjaga kerahasiaan kredensial akun, melindungi data pribadi, dan mengakses konten kursus hanya melalui akun yang kamu miliki.',
                ],
                [
                    'heading' => 'Pembelian & Pembayaran',
                    'body' => 'Pembelian kursus melalui gateway pembayaran resmi platform (sekarang Midtrans) akan diproses sesuai ketentuan merchant. Pembayaran yang sudah berhasil akan memberikan akses ke materi kursus.',
                ],
                [
                    'heading' => 'Refund & Pembatasan Akses',
                    'body' => 'Kursus yang dibeli dapat ditarik kembali sesuai kebijakan pada masa tertentu. Setelah refund diproses, akses materi kursus akan ditarik kembali.',
                ],
                [
                    'heading' => 'Perilaku Pengguna',
                    'body' => 'Kamu tidak boleh menyebarkan materi kursus, mencoba mengakses materi orang lain, atau menggunakan platform untuk tujuan melanggar hukum.',
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
            'title' => 'Kebijakan Privasi',
            'updated_at' => '5 November 2026',
            'sections' => [
                [
                    'heading' => 'Data yang Kami Kumpulkan',
                    'body' => 'Kami mengumpulkan data akun (nama, email), data belajar (kelas yang diikuti, progres materi), dan data transaksi pembayaran untuk keperluan operasional.',
                ],
                [
                    'heading' => 'Penggunaan Data',
                    'body' => 'Data digunakan untuk memproses pembelian, memberikan akses belajar, komunikasi notifikasi, perbaikan layanan, dan kepatuhan terhadap peraturan yang berlaku.',
                ],
                [
                    'heading' => 'Penyimpanan & Keamanan',
                    'body' => 'Data disimpan dengan enkripsi dan kontrol akses yang ketat. Token pembayaran disimpan sebagai referensi transaksi dan tidak menampilkan data sensitif ke penyedia pembayaran.',
                ],
                [
                    'heading' => 'Hak Pengguna',
                    'body' => 'Kamu dapat meminta akses, koreksi, atau penghapusan data akun sesuai ketentuan yang berlaku.',
                ],
            ],
        ]);
    }
}
