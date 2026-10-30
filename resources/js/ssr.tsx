import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { renderToString } from 'react-dom/server';
import 'react-toastify/dist/ReactToastify.css'

const fallbackAppName = import.meta.env.VITE_APP_NAME || 'KursusIO';

createServer((page) => {
    const appName =
        (page.props.appearance as { name?: string } | undefined)?.name ||
        fallbackAppName;

    return createInertiaApp({
        page,
        render: renderToString,
        title: (title) => (title ? `${title} - ${appName}` : appName),
        resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
        setup: ({ App, props }) => <App {...props} />,
    });
});
