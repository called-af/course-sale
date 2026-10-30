export function getInitials(name?: string | null): string {
    if (!name) return '?';

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 11) return 'Good Morning';
    if (hour < 15) return 'Good Afternoon';
    if (hour < 19) return 'Good Evening';
    return 'Good Night';
}

export function formatDuration(minutes: number): string {
    if (!minutes || minutes <= 0) return '0m';
    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

export function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value ?? 0);
}

export function formatDate(value?: string | null): string {
    if (!value) return 'Recently';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(date);
}
