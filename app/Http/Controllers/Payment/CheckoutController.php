<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\PaymentMethod;
use App\Services\EnrollmentService;
use App\Services\Payment\PaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService,
    ) {}

    public function index(Request $request, Course $course): Response|RedirectResponse
    {
        abort_unless($course->status === 'published', 404);
        abort_unless($course->isPaid(), 404);

        if (app(EnrollmentService::class)->isEnrolled($request->user(), $course)) {
            return $this->alreadyEnrolled($course);
        }

        $methods = $this->paymentService->availableMethods();
        $settings = app(\App\Services\Payment\PaymentSettings::class)->current();

        return Inertia::render('student/checkout/page', [
            'course' => $course,
            'paymentMethods' => $methods,
            'gateway' => [
                'name' => $settings->gateway,
                'midtrans_enabled' => filled(config('services.payment.midtrans.server_key')),
                'is_production' => (bool) config('services.payment.midtrans.is_production', false),
            ],
        ]);
    }

    public function store(Request $request, Course $course): RedirectResponse|\Symfony\Component\HttpFoundation\Response
    {
        abort_unless($course->status === 'published', 404);
        abort_unless($course->isPaid(), 404);

        // Without this guard a student who is already enrolled can create a
        // second order and be charged twice.
        if (app(EnrollmentService::class)->isEnrolled($request->user(), $course)) {
            return $this->alreadyEnrolled($course);
        }

        $validated = $request->validate([
            'payment_method_id' => ['nullable', 'integer', 'exists:payment_methods,id'],
        ]);

        $method = null;

        if (! empty($validated['payment_method_id'])) {
            $method = PaymentMethod::query()
                ->with('provider')
                ->where('id', $validated['payment_method_id'])
                ->whereHas('provider', fn ($query) => $query->where('is_active', true))
                ->first();
        }

        // The channel (QRIS, VA, e-wallet, ...) is actually chosen on the
        // Midtrans page, so a specific method selection is optional here.
        $method ??= $this->paymentService->defaultMethod();

        if (! $method) {
            return back()->with('error', 'No active payment methods available. Please contact an admin.');
        }

        try {
            $order = $this->paymentService->createOrder($request->user(), $course, $method);
        } catch (\Throwable $exception) {
            report($exception);

            return back()->with('error', 'Checkout could not be processed. Please try again or contact an admin.');
        }

        // A free course returns an enrollment instead of an order.
        if ($order instanceof Enrollment) {
            return redirect()
                ->route('student.courses.show', $course->slug)
                ->with('success', 'You are already enrolled in this course.');
        }

        if ($order->status === 'paid') {
            return redirect()
                ->route('student.courses.show', $course->slug)
                ->with('success', 'Congratulations! You have successfully enrolled in the course.');
        }

        $payment = $order->payments()->latest()->first();

        if ($payment?->payment_url && str_starts_with((string) $payment->payment_url, 'http')) {
            // Inertia posts are XHR requests; a plain redirect to an external
            // URL would be swallowed by the client. Inertia::location forces a
            // full browser navigation (and falls back to a redirect for
            // non-Inertia requests).
            return Inertia::location($payment->payment_url);
        }

        return redirect()
            ->route('student.payment.show', ['order' => $order->order_number])
            ->with('success', 'Order created. Please complete your payment.');
    }

    protected function alreadyEnrolled(Course $course): RedirectResponse
    {
        return redirect()
            ->route('student.courses.show', $course->slug)
            ->with('info', 'You are already enrolled in this course. Learning access is already active.');
    }
}
