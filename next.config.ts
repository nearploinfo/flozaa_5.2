import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

// Same guard as src/lib/site-config.ts — kept independent here since
// next.config.ts runs in Node at build time, before the app's module graph
// (and its client bundle) exists.
const seoEnabled = process.env.NEXT_PUBLIC_SEO !== "false";

// Vercel sets this automatically during its own builds. Vercel has its own
// serverless bundling and does its own build-completion step that expects
// the *default* Next.js output — forcing "standalone" (self-hosted Node/VPS)
// or "export" (static hosting) both break it (missing next-server.js.nft.json).
// So on Vercel we must leave `output` unset regardless of the SEO flag;
// only self-hosted VPS builds (seoEnabled, not on Vercel) want "standalone".
const isVercel = !!process.env.VERCEL;

export default function config(phase: string): NextConfig {
  // `output: "export"` only matters to `next build` (it controls what that
  // command emits) — `next dev` never produces exported files regardless.
  // But Next refuses to run Middleware at all whenever `output === "export"`
  // is set, dev included — so declaring it during `next dev` silently kills
  // proxy.ts (the locale rewrite) with no replacement, since the
  // Apache-level .htaccess rewrite that stands in for it in a real static
  // deploy (see scripts/generate-htaccess.mjs) doesn't exist/apply here.
  // Only set it for the actual production build so `next dev` can exercise
  // SEO=false locally with proxy.ts still working.
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  const nextConfig: NextConfig = {
    // true  = dynamic/VPS deploy — self-contained Node server build.
    // false = static export/shared hosting — plain HTML/JS, no Node server needed.
    // On Vercel: leave unset, Vercel handles this itself.
    output: isDev ? undefined : !seoEnabled ? "export" : isVercel ? undefined : "standalone",
    // sanitize-html's htmlparser2 dependency (v12+) ships ESM-only. Next's
    // Turbopack SSR runtime externalizes sanitize-html by default (a plain
    // Node require() at runtime), and Node can't require() an ESM module —
    // that 500s every page using RichText.tsx on Vercel with ERR_REQUIRE_ESM.
    // transpilePackages forces Turbopack to actually bundle these instead of
    // leaving them as an external runtime require, which resolves ESM/CJS
    // interop at build time.
    transpilePackages: ["sanitize-html", "htmlparser2"],
    // Lets a real phone on the same wifi (hitting the dev server via LAN IP
    // instead of localhost) load HMR/dynamic chunks — Next blocks cross-origin
    // dev-resource requests by default, which silently breaks anything loaded
    // via a client-side dynamic import() when testing from a device.
    allowedDevOrigins: ["192.168.0.181"],
    // Static export has no server, so `output: "export"` disables actually
    // RUNNING proxy.ts — but Next still detects the file and ships a client
    // middleware manifest regardless (verified: without this, the exported
    // build's _clientMiddlewareManifest.js carries a near-universal matcher).
    // The client router treats any matched navigation as "needs middleware",
    // unconditionally firing a _next/data/*.json fetch even for plain static
    // pages with no getServerSideProps — that fetch 404s (no server to
    // answer it) and forces a hard reload on every Link click. Next finds
    // proxy.ts by probing "proxy.<ext>" for each configured pageExtensions
    // entry; dropping "ts" (every page here is .tsx) makes that probe miss
    // entirely, so no middleware gets detected/compiled for this build and
    // the manifest ships empty (confirmed: __MIDDLEWARE_MATCHERS = []).
    // Only for the real export build — dev needs proxy.ts working (see the
    // isDev comment above), and SEO=true has a real server to run it on.
    ...(!isDev && !seoEnabled ? { pageExtensions: ["tsx"] } : {}),
    images: seoEnabled
      ? {
          remotePatterns: [
            {
              protocol: "https",
              hostname: "edemand-test.thewrteam.in",
            },
          ],
        }
      : // next/image's default loader needs a running server to optimize
        // images on demand — unavailable under static export.
        { unoptimized: true },
  };

  return nextConfig;
}
