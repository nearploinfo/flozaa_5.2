const CHECK_INTERVAL_MS = 10 * 60 * 1000;

/** Next writes each build's static assets under a buildId-specific path and
 * deletes the previous build's folder once a new one deploys. So asking for
 * the currently-loaded build's own manifest is a reliable, near-free
 * staleness probe: 200 = still current, 404 = a newer build has since
 * replaced it. A network hiccup isn't staleness — fails closed. */
async function isBuildStale(buildId: string): Promise<boolean> {
  try {
    const response = await fetch(`/_next/static/${buildId}/_buildManifest.js`, {
      method: "HEAD",
      cache: "no-store",
    });
    return response.status === 404;
  } catch {
    return false;
  }
}

function isEditingSomething(): boolean {
  const active = document.activeElement;
  if (!active) return false;
  return (
    active.tagName === "INPUT" ||
    active.tagName === "TEXTAREA" ||
    (active as HTMLElement).isContentEditable
  );
}

/** Silently reloads the tab once the running build is superseded — instead
 * of waiting for the user to notice something's broken and hard-refresh.
 * Never fires mid-typing, and only checks while the tab is actually visible
 * (a background tab reloading itself would just discard whatever state the
 * user comes back to). Complements chunk-error-recovery.ts, which only
 * catches a *failed* dynamic import — this catches staleness before that
 * import ever runs, e.g. a page whose old code has no failing import at all,
 * just outdated logic. */
export function initBuildFreshnessCheck(): () => void {
  const buildId = window.__NEXT_DATA__?.buildId;
  if (!buildId) return () => {};

  let checking = false;
  const maybeReload = () => {
    if (checking || document.visibilityState !== "visible" || isEditingSomething()) return;
    checking = true;
    isBuildStale(buildId)
      .then((stale) => {
        if (stale) window.location.reload();
      })
      .finally(() => {
        checking = false;
      });
  };

  const onVisible = () => {
    if (document.visibilityState === "visible") maybeReload();
  };
  document.addEventListener("visibilitychange", onVisible);
  const interval = setInterval(maybeReload, CHECK_INTERVAL_MS);

  return () => {
    document.removeEventListener("visibilitychange", onVisible);
    clearInterval(interval);
  };
}
