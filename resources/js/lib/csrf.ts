/**
 * Ambil CSRF token dari meta tag yang di-inject oleh Laravel.
 */
export function getCsrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

/**
 * Helper fetch dengan CSRF token dan JSON header sudah terpasang.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
            ...options.headers,
        },
    });
}
