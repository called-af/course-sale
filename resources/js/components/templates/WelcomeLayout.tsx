import { useLanding } from '@/hooks/useLanding';

import CtaSection from '../organisms/Landing/CtaSection';
import Footer from '../organisms/Landing/Footer';
import Navbar from '../organisms/Landing/Navbar';

export default function WelcomeLayout({
    children,
    withCta = false,
}: {
    children: React.ReactNode;
    /** Show the call to action on the landing page only. */
    withCta?: boolean;
}) {
    const { cta, footer } = useLanding();

    return (
        <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-gray-100 dark:bg-[#141416]">
            <Navbar />
            <main className="">{children}</main>
            {withCta && cta.show && <CtaSection />}
            {footer.show && <Footer />}
        </div>
    );
}
