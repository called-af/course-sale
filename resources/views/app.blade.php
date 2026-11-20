<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        @php
            $seoSetting = \App\Models\SeoSetting::current();
            $footerSocials = \App\Models\LandingSetting::content('footer')['socials'] ?? [];
            $socialSameAs = is_array($footerSocials)
                ? array_values(array_filter(array_map(
                    fn ($social) => is_array($social) ? ($social['href'] ?? null) : null,
                    $footerSocials,
                )))
                : [];
            $seoTitle = $seoSetting->resolvedTitle();
            $seoDescription = $seoSetting->resolvedDescription();
            $seoCanonical = $seoSetting->canonical_url ?: url()->current();
            $seoImage = $seoSetting->absoluteOgImageUrl();
        @endphp

        <title inertia>{{ $seoTitle }}</title>

        <meta name="description" content="{{ $seoDescription }}">
        @if ($seoSetting->meta_keywords)
            <meta name="keywords" content="{{ $seoSetting->meta_keywords }}">
        @endif
        <meta name="robots" content="{{ $seoSetting->robots ?: 'index,follow' }}">
        <link rel="canonical" href="{{ $seoCanonical }}">

        {{-- Open Graph --}}
        <meta property="og:site_name" content="{{ \App\Models\AppearanceSetting::current()->displayName() }}">
        <meta property="og:type" content="{{ $seoSetting->og_type ?: 'website' }}">
        <meta property="og:title" content="{{ $seoSetting->resolvedOgTitle() }}">
        <meta property="og:description" content="{{ $seoSetting->resolvedOgDescription() }}">
        <meta property="og:url" content="{{ $seoCanonical }}">
        @if ($seoImage)
            <meta property="og:image" content="{{ $seoImage }}">
        @endif

        {{-- Twitter / X --}}
        <meta name="twitter:card" content="{{ $seoSetting->twitter_card ?: 'summary_large_image' }}">
        <meta name="twitter:title" content="{{ $seoSetting->resolvedOgTitle() }}">
        <meta name="twitter:description" content="{{ $seoSetting->resolvedOgDescription() }}">
        @if ($seoSetting->twitter_site)
            <meta name="twitter:site" content="{{ $seoSetting->twitter_site }}">
        @endif
        @if ($seoImage)
            <meta name="twitter:image" content="{{ $seoImage }}">
        @endif

        {{-- Search engine verification --}}
        @if ($seoSetting->google_site_verification)
            <meta name="google-site-verification" content="{{ $seoSetting->google_site_verification }}">
        @endif
        @if ($seoSetting->bing_site_verification)
            <meta name="msvalidate.01" content="{{ $seoSetting->bing_site_verification }}">
        @endif

        @if (count($socialSameAs) > 0)
            <script type="application/ld+json">
                {!! json_encode([
                    '@context' => 'https://schema.org',
                    '@type' => 'Organization',
                    'name' => \App\Models\AppearanceSetting::current()->displayName(),
                    'url' => url('/'),
                    'sameAs' => $socialSameAs,
                ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) !!}
            </script>
        @endif

        {{-- Google Analytics (GA4 / Universal) --}}
        @if ($seoSetting->google_analytics_id)
            <script async src="https://www.googletagmanager.com/gtag/js?id={{ $seoSetting->google_analytics_id }}"></script>
            <script>
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '{{ $seoSetting->google_analytics_id }}');
            </script>
        @endif

        {{-- Google Tag Manager --}}
        @if ($seoSetting->google_tag_manager_id)
            <script>
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
                var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
                j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','{{ $seoSetting->google_tag_manager_id }}');
            </script>
        @endif

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
        <link href="https://fonts.bunny.net/css?family=anton:400" rel="stylesheet" />

        {{-- Anti-FOUC: apply dark class before first render --}}
        <script>
            (function() {
                try {
                    var stored = localStorage.getItem('theme');
                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    var isDark = stored === 'dark' || (!stored && prefersDark);
                    if (isDark) document.documentElement.classList.add('dark');
                } catch(e) {}
            })();
        </script>
        
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased bg-gray-100 dark:bg-[#141416]">
        @inertia
    </body>
</html>
