"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider, defaultShouldDehydrateQuery } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

// Bump this when a cached query's shape changes incompatibly — it
// invalidates every persisted cache on load instead of rendering stale/
// mismatched data against newer component code.
const PERSIST_BUSTER = "v2";

// One QueryClient instance per browser tab, created lazily in useState so it
// survives client-side route changes (Pages Router keeps _app mounted across
// navigations) — that's what lets a cached query skip refetching when the
// user revisits a page instead of re-fetching on every mount.
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // localStorage is unavailable during SSR/static export — guard so the
  // persister is only ever constructed client-side.
  const [persister] = useState(() =>
    typeof window === "undefined"
      ? undefined
      : createSyncStoragePersister({ storage: window.localStorage, key: "app-query-cache" })
  );

  if (!persister) {
    // SSR (no `window`) — plain provider, no persistence to wire up.
    // Same QueryClient either way, so no cache is lost once the client
    // branch below takes over.
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        // Cached pages older than this are dropped rather than restored —
        // stale enough that showing them at all (even before revalidation)
        // would be misleading.
        maxAge: 24 * 60 * 60 * 1000,
        buster: PERSIST_BUSTER,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            // country-settings (payment gateways, cod_setting, tax rules…) is
            // restored from this persisted cache WITH its original
            // dataUpdatedAt, so a reload within its 1h staleTime renders the
            // disk copy and skips refetching entirely — an admin's config
            // change (e.g. disabling "Pay later") can then stay invisible to
            // an already-reloaded customer for up to an hour. Never persist
            // it, so every reload hits the network for current config.
            query.queryKey[0] !== "country-settings" && defaultShouldDehydrateQuery(query),
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
