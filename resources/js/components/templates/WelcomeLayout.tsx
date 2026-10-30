import Navbar from '../organisms/Landing/Navbar';
import Footer from '../organisms/Landing/Footer';

export default function WelcomeLayout({
    children,
    withCta = false,
}: {
    children: React.ReactNode;
    /** Show the call to action merged into the footer (landing page only). */
    withCta?: boolean;
}) {
    return (
        <div className="flex h-screen w-full flex-col bg-white dark:bg-[#141416]">
            <Navbar />
            <main className="">{children}</main>
            <Footer withCta={withCta} />
        </div>
    );
}
