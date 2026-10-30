import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import 'react-toastify/dist/ReactToastify.css'

const fallbackAppName = import.meta.env.VITE_APP_NAME || 'KursusIO';
let appName = fallbackAppName;

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const applyPalette = (palette: unknown) => {
            document.documentElement.dataset.palette =
                typeof palette === 'string' ? palette : 'purple';
        };

        const resolveAppName = (pageProps: Record<string, unknown>) => {
            const appearance = pageProps.appearance as { name?: string } | undefined;
            return appearance?.name || fallbackAppName;
        };

        appName = resolveAppName(props.initialPage.props as Record<string, unknown>);
        applyPalette((props.initialPage.props.appearance as { palette?: unknown } | undefined)?.palette);
        router.on('navigate', (event) => {
            appName = resolveAppName(event.detail.page.props as Record<string, unknown>);
            applyPalette((event.detail.page.props.appearance as { palette?: unknown } | undefined)?.palette);
        });

        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: 'purple',
    },
});
