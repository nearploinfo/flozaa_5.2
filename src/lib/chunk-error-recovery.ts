import { logClarityEvent } from "@/lib/analytics/clarity-events";
import { MISC_EVENTS } from "@/lib/analytics/clarity-event-names";

const RETRY_KEY_PREFIX = "chunk-error-recovery-retried:";
const RETRY_WINDOW_MS = 10_000;

/** Next's client router does `import()` for a page's chunk on navigation.
 * After a new deploy, a tab that's been open since before it still has the
 * *old* build's manifest, which points at chunk filenames the server no
 * longer serves (they were replaced by the new build's hashed filenames) —
 * so that `import()` 404s. Matches both webpack's and Turbopack's wording. */
function isStaleChunkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /loading chunk|chunkloaderror|failed to fetch dynamically imported module|error loading dynamically imported module/i.test(
    message
  );
}

/** A real navigation (not a client-router re-render) re-fetches the HTML and
 * the *current* build's manifest, so the failing import resolves next time.
 * The sessionStorage guard stops a repeat failure (offline, bad deploy) from
 * reload-looping the tab. Keyed per-URL (not one global timestamp) so a
 * failure recovering to page A can't silently swallow a failure recovering
 * to page B a moment later — that gap left the tab stuck showing stale
 * content with an already-updated URL bar, no reload ever firing to fix it. */
function recoverOnce(url: string) {
  const key = RETRY_KEY_PREFIX + url;
  const lastAttempt = Number(sessionStorage.getItem(key) ?? 0);
  if (Date.now() - lastAttempt < RETRY_WINDOW_MS) {
    logClarityEvent(MISC_EVENTS.CHUNK_ERROR_RECOVERY_SKIPPED, { url });
    return;
  }
  sessionStorage.setItem(key, String(Date.now()));
  window.location.href = url;
}

/** Wires up recovery for both failure paths: router-driven page navigation
 * (`routeChangeError`, synchronous) and any other dynamic import — lazy
 * components, `next/dynamic` — which reject as an unhandled promise instead. */
export function initChunkErrorRecovery(router: {
  events: { on: (event: "routeChangeError", handler: (err: unknown, url: string) => void) => void };
}) {
  router.events.on("routeChangeError", (error, url) => {
    if (isStaleChunkError(error)) recoverOnce(url);
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (isStaleChunkError(event.reason)) recoverOnce(window.location.href);
  });
}
