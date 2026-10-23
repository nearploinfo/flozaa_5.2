// Swaps the static <link rel="icon"> for the admin's uploaded web_favicon
// once /get_settings resolves, mirroring dynamic-manifest.ts's pattern of
// patching a static default in place rather than requiring a server.
export function applyDynamicFavicon(webFaviconUrl: string | undefined) {
  if (!webFaviconUrl) return;
  const linkEl = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!linkEl) return;
  linkEl.setAttribute("href", webFaviconUrl);
}
