import { usePage } from '@inertiajs/react';

interface AppLogoProps {
    className?: string;
    alt?: string;
}

export default function AppLogo({ className, alt = 'Logo' }: AppLogoProps) {
    const { appearance } = usePage().props as {
        appearance?: { logo_url?: string };
    };

    return <img src={appearance?.logo_url || '/images/logo.svg'} alt={alt} className={className} />;
}
