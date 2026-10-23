import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";
import { themeInitScript } from "@/lib/theme-init-script";
import { themeColorsInitScript } from "@/lib/theme-colors-init-script";
import { siteConfig } from "@/lib/site-config";

export default function Document() {
  return (
    <Html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="app-version" content={siteConfig.version} />
        <meta name="app-environment" content={siteConfig.environment} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="flozaa" />
        <meta name="theme-color" content="#0079FF" />

        {/* iOS ignores the manifest for splash screens — each device size needs
            its own explicit link (Android/Chrome builds its splash from the
            manifest's name/background_color/icon automatically, no extra
            markup needed there). */}
        <link rel="apple-touch-startup-image" href="/apple-splash-1290-2796.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1284-2778.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1179-2556.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1170-2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1125-2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1242-2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-828-1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-750-1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-2048-2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1668-2388.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1620-2160.png" media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2)" />

        {/* next/font can't run in _document.tsx (Pages Router restriction),
            but Radix's Portal-based components (Dialog, DropdownMenu, etc.)
            render to document.body — any font var scoped lower than <html>
            never reaches them. A plain Google Fonts link + a static
            --font-lexend var on :root (globals.css) is the only scope that
            covers both the normal tree and portaled content. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800;900&display=swap"
        />

        {siteConfig.adsenseClientId && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.adsenseClientId}`}
            crossOrigin="anonymous"
          />
        )}
      </Head>
      <body className="flex min-h-full flex-col bg-bg-secondary xl:bg-background">
        {/* Google Consent Mode v2 — must run before any GA4 script loads.
            Sets denied defaults so Google collects nothing until the user
            consents; ConsentContext calls gtag('consent','update') on choice.
            GA4/Clarity themselves load conditionally via ConsentScripts,
            only after analytics consent is granted — never add them here. */}
        <Script
          id="consent-mode-default"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});`,
          }}
        />
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <Script
          id="theme-colors-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeColorsInitScript }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
