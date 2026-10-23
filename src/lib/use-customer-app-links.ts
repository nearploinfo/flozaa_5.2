import { useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";

interface GeneralSettings {
  schema_for_deeplink?: string;
}

interface AppSettings {
  customer_playstore_url?: string;
  customer_appstore_url?: string;
}

interface WebSettings {
  playstore_url?: string;
  applestore_url?: string;
}

/** Customer-app deeplink scheme + store links — distinct from
 * `useProviderAppLinks` (become-provider.ts), which points at the
 * provider app instead. Prefers `app_settings.customer_*` (admin's
 * dedicated fields); falls back to `web_settings.*` (the "get the app"
 * section's fields) since some deployments only fill those in. */
export function useCustomerAppLinks(): {
  scheme?: string;
  playStoreUrl?: string;
  appStoreUrl?: string;
} {
  const hasHydrated = useHasHydrated();
  const raw = useAppSelector((state) => state.settings.data) as {
    general_settings?: GeneralSettings;
    app_settings?: AppSettings;
    web_settings?: WebSettings;
  } | null;
  if (!hasHydrated) return {};
  return {
    scheme: raw?.general_settings?.schema_for_deeplink || undefined,
    playStoreUrl: raw?.app_settings?.customer_playstore_url || raw?.web_settings?.playstore_url || undefined,
    appStoreUrl: raw?.app_settings?.customer_appstore_url || raw?.web_settings?.applestore_url || undefined,
  };
}
