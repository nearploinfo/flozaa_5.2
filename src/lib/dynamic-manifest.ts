// Patches the live <link rel="manifest"> to reflect the admin's current
// brand color, without needing a server (works under static export too,
// unlike an API route) — fetches the static public/manifest.json once,
// overwrites theme_color/background_color, and swaps the <link>'s href to
// a blob URL of the patched JSON. Icons stay static (real raster images —
// regenerate those via `npm run pwa:assets` instead); only the color
// fields are live.
let baseManifestHref: string | null = null;
let previousBlobUrl: string | null = null;

export async function applyDynamicManifest(primary500: string) {
  try {
    const linkEl = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!linkEl) return;

    if (!baseManifestHref) {
      baseManifestHref = linkEl.getAttribute("href");
    }
    if (!baseManifestHref) return;

    const response = await fetch(baseManifestHref);
    const manifest = await response.json();
    manifest.theme_color = primary500;
    manifest.background_color = primary500;

    const blob = new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" });
    const url = URL.createObjectURL(blob);
    linkEl.setAttribute("href", url);

    if (previousBlobUrl) URL.revokeObjectURL(previousBlobUrl);
    previousBlobUrl = url;
  } catch {
    // Non-critical — the static manifest.json stays in place as a fallback.
  }
}
