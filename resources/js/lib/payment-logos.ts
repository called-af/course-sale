const PAYMENT_LOGOS: Record<string, string> = {
    bca: '/images/payment-methods/bca.png',
    mandiri: '/images/payment-methods/mandiri.png',
    bni: '/images/payment-methods/bni.png',
    bri: '/images/payment-methods/bri.png',
    qris: '/images/payment-methods/qris.png',
    gopay: '/images/payment-methods/gopay.png',
    ovo: '/images/payment-methods/ovo.png',
    dana: '/images/payment-methods/dana.png',
    visa: '/images/payment-methods/visa.png',
    mastercard: '/images/payment-methods/mastercard.png',
};

/** Normalize a payment-method label to the key used for logo lookups. */
export function normalizePaymentMethodKey(method: string): string {
    return method
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

/**
 * Resolve a landing payment-method label to its logo.
 * Admin-uploaded logos take priority over the bundled PNGs.
 */
export function paymentLogoSrc(method: string, customLogos?: Record<string, string>): string | null {
    const key = normalizePaymentMethodKey(method);

    if (customLogos) {
        const custom = customLogos[method] ?? customLogos[key];
        if (custom) {
            return custom;
        }
    }

    return PAYMENT_LOGOS[key] ?? null;
}
