export type CurrencyInput = number | string | null | undefined;

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

/**
 * Normalize values coming from the API. Eloquent decimal casts are often
 * serialized as strings, while JSON numbers arrive as numbers.
 */
export function toCurrencyNumber(value: CurrencyInput): number {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);

        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
}

/** Format a value as Indonesian rupiah without decimals, e.g. Rp 1.500.000. */
export function formatRupiah(value: CurrencyInput): string {
    return rupiahFormatter.format(toCurrencyNumber(value));
}

/** Format a course price, using one consistent label for free courses. */
export function formatCoursePrice(type: string | null | undefined, price: CurrencyInput): string {
    return type === 'free' ? 'Free' : formatRupiah(price);
}
