import { Link } from '@inertiajs/react';

interface Props {
    href: string;
    children: React.ReactNode;
    className?: string;
}

/** Handles internal routes and external/anchor links from landing settings. */
export default function SectionLink({ href, children, className }: Props) {
    if (/^(https?:\/\/|mailto:|tel:|#)/i.test(href)) {
        return (
            <a href={href} className={className}>
                {children}
            </a>
        );
    }

    return (
        <Link href={href || '/'} className={className}>
            {children}
        </Link>
    );
}
