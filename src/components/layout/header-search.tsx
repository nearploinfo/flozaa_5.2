"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Search } from "lucide-react";
import { localizePath } from "@/lib/i18n/locale-path";
import { useTranslation } from "@/lib/i18n/translation-context";
import { AppButton } from "@/components/ui/app-button";
import { AppImage } from "@/components/ui/app-image";
import { getAllServicesApi, getAllProvidersApi } from "@/api/apiRoutes";
import { toServiceCardData, type ServiceListItemApi } from "@/lib/services-catalog";
import type { ProviderListItemApi } from "@/lib/providers-catalog";
import { useShowPrice } from "@/lib/show-price";
import { useAppSelector } from "@/store/hooks";
import { useRecentSearchQueries } from "@/lib/use-recent-search-queries";
import { Link } from "@/components/ui/locale-link";

type SearchTab = "services" | "providers";

function ResultPrice({ amount }: { amount: number }) {
  const text = useShowPrice(amount);
  return <span className="text-sm font-semibold text-text-primary">{text}</span>;
}

export function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<SearchTab>("services");
  const [services, setServices] = useState<ServiceListItemApi[]>([]);
  const [providers, setProviders] = useState<ProviderListItemApi[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t, lang, defaultLocale } = useTranslation();
  const { recentQueries, addRecentQuery } = useRecentSearchQueries();
  const savedLat = useAppSelector((state) => state.location.lat);
  const savedLng = useAppSelector((state) => state.location.lng);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off the debounced fetch below, not derivable from props/state
    setLoading(true);
    const timer = setTimeout(() => {
      const params = {
        search: trimmed,
        limit: 5,
        latitude: savedLat ?? undefined,
        longitude: savedLng ?? undefined,
      };
      if (tab === "services") {
        getAllServicesApi(params).then((response) => {
          if (cancelled) return;
          setServices(response?.data ?? []);
          setLoading(false);
        });
      } else {
        getAllProvidersApi(params).then((response) => {
          if (cancelled) return;
          setProviders(response?.data ?? []);
          setLoading(false);
        });
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, tab, savedLat, savedLng]);

  const goToSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    addRecentQuery(trimmed);
    setOpen(false);
    const path = tab === "services" ? "/services" : "/providers";
    router.push(`${localizePath(path, lang, defaultLocale)}?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    goToSearch(query || "all");
  };

  const hasResults = tab === "services" ? services.length > 0 : providers.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-[551px]">
      <form
        onSubmit={handleSubmit}
        className="flex h-14 w-full items-center gap-4 rounded-full border border-form-field-border bg-form-field-bg py-2 pl-4 pr-2"
      >
        <input
          type="text"
          name="query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={t("header.searchPlaceholder")}
          className="flex-1 bg-transparent text-lg text-form-field-text placeholder:text-form-field-helper focus:outline-none"
        />
        <AppButton
          type="submit"
          variant="secondary"
          iconOnly
          leftIcon={Search}
          aria-label={t("common.search")}
          className="shrink-0 rounded-full p-2"
        >
          {t("common.search")}
        </AppButton>
      </form>

      {open && (query.trim() || recentQueries.length > 0) && (
        <div className="absolute top-[calc(100%+8px)] left-0 z-50 flex w-[556px] max-w-[calc(100vw-2rem)] flex-col items-center rounded-2xl border border-border-default bg-bg-primary shadow-[0px_6px_12px_0px_rgba(0,0,0,0.07)]">
          <div className="flex w-full flex-col items-start gap-6 p-4">
            {query.trim() && (
              <div className="flex w-full items-start gap-3 rounded-xl bg-bg-secondary p-3">
                <button
                  type="button"
                  onClick={() => setTab("services")}
                  className={
                    tab === "services"
                      ? "flex flex-1 items-center justify-center gap-2 rounded-xl bg-bg-brand p-3 text-base font-medium text-text-inverse-light shadow-[0px_4px_8px_0px_rgba(0,0,0,0.06)]"
                      : "flex flex-1 items-center justify-center gap-2 rounded-xl border border-border-default bg-bg-primary p-3 text-base text-text-primary"
                  }
                >
                  {t("nav.services")}
                </button>
                <button
                  type="button"
                  onClick={() => setTab("providers")}
                  className={
                    tab === "providers"
                      ? "flex flex-1 items-center justify-center gap-2 rounded-xl bg-bg-brand p-3 text-base font-medium text-text-inverse-light shadow-[0px_4px_8px_0px_rgba(0,0,0,0.06)]"
                      : "flex flex-1 items-center justify-center gap-2 rounded-xl border border-border-default bg-bg-primary p-3 text-base text-text-primary"
                  }
                >
                  {t("nav.providers")}
                </button>
              </div>
            )}

            {recentQueries.length > 0 && (
              <div className="flex w-full flex-col items-start gap-3">
                <span className="text-base font-medium text-text-primary">
                  {t("header.recentSearch")}
                </span>
                <div className="flex w-full flex-wrap content-start items-start gap-3">
                  {recentQueries.map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      onClick={() => {
                        setQuery(entry);
                        goToSearch(entry);
                      }}
                      className="flex items-center gap-2 rounded-lg bg-bg-secondary p-2"
                    >
                      <Search className="size-4 shrink-0 text-icon-primary" />
                      <span className="text-base text-text-primary">{entry}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query.trim() && (
              <>
                <div className="dashed-divider" />

                <div className="flex w-full flex-col items-start gap-4">
                  {loading ? (
                    <span className="w-full py-2 text-center text-sm text-text-secondary">
                      {t("common.loading")}
                    </span>
                  ) : !hasResults ? (
                    <span className="w-full py-2 text-center text-sm text-text-secondary">
                      {t("header.noResults")}
                    </span>
                  ) : tab === "services" ? (
                    services.map((service) => {
                      const card = toServiceCardData(service);
                      return (
                        <Link
                          key={service.id}
                          href={`/service-details/${service.slug}`}
                          onClick={() => addRecentQuery(query)}
                          className="flex w-full items-center gap-2 rounded-xl border border-border-default bg-bg-primary p-3"
                        >
                          <span className="size-11 shrink-0 overflow-hidden rounded-3xl">
                            <AppImage
                              src={card.image}
                              alt={card.title}
                              className="size-11 rounded-3xl object-cover"
                            />
                          </span>
                          <span className="flex flex-1 flex-col items-start gap-1">
                            <span className="line-clamp-1 text-sm font-medium text-text-primary">
                              {card.title}
                            </span>
                            <span className="line-clamp-1 text-sm text-text-secondary">
                              {card.category}
                            </span>
                          </span>
                          <ResultPrice amount={card.price} />
                        </Link>
                      );
                    })
                  ) : (
                    providers.map((provider) => (
                      <Link
                        key={provider.id}
                        href={`/provider-details/${provider.slug}`}
                        onClick={() => addRecentQuery(query)}
                        className="flex w-full items-center gap-2 rounded-xl border border-border-default bg-bg-primary p-3"
                      >
                        <span className="size-11 shrink-0 overflow-hidden rounded-3xl">
                          <AppImage
                            src={provider.profile_image}
                            alt={provider.company_name}
                            className="size-11 rounded-3xl object-cover"
                          />
                        </span>
                        <span className="flex flex-1 flex-col items-start gap-1">
                          <span className="line-clamp-1 text-sm font-medium text-text-primary">
                            {provider.company_name}
                          </span>
                          <span className="line-clamp-1 text-sm text-text-secondary">
                            {t("common.servicesCount", { count: provider.total_services })}
                          </span>
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
