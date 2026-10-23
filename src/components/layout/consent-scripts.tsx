"use client";

import Script from "next/script";
import { useConsent } from "@/lib/consent-context";
import { siteConfig } from "@/lib/site-config";

const GA_ID = siteConfig.gaMeasurementId;
const CLARITY_ID = siteConfig.clarityProjectId;

/**
 * Conditionally loads third-party analytics scripts based on GDPR consent —
 * both categories gate under "analytics" per the cookie dialog's copy.
 * Must be rendered inside ConsentProvider. Consent Mode v2's denied-default
 * stub (pages/_document.tsx) already runs before this, so GA collects
 * nothing until consent is granted even if this mounts late.
 */
export function ConsentScripts() {
  const { consent } = useConsent();

  // consent === null → not yet resolved from the cookie, don't render anything yet.
  if (!consent) return null;

  return (
    <>
      {consent.analytics && GA_ID && (
        <>
          <Script id="ga-script" src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="lazyOnload" />
          <Script id="ga-init" strategy="lazyOnload">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}

      {consent.analytics && CLARITY_ID && (
        <Script id="clarity-init" strategy="lazyOnload">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${CLARITY_ID}");`}
        </Script>
      )}
    </>
  );
}
