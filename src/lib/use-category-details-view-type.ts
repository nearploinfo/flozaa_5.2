import { useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";

export type CategoryDetailsViewType = "services" | "providers";

/** general_settings.category_details_view_type decides whether tapping a
 * category card routes to /services or /providers, and which count
 * (services vs providers) the card shows. Defaults to "service" when unset. */
export function useCategoryDetailsViewType(): CategoryDetailsViewType {
  const hasHydrated = useHasHydrated();
  const viewType = useAppSelector((state) => {
    const generalSettings = state.settings.data?.general_settings as
      | { category_details_view_type?: string }
      | undefined;
    return generalSettings?.category_details_view_type === "providers" ? "providers" : "services";
  });
  // `settings` is redux-persist-whitelisted — it can rehydrate from
  // localStorage before the first client render, differing from SSR's
  // always-null default. Force "services" until hydration is confirmed so
  // the first client render matches the server markup exactly.
  return hasHydrated ? viewType : "services";
}
