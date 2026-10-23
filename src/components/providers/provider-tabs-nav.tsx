"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import {
  ProviderGalleryIcon,
  ProviderOfferIcon,
  ReviewsIcon,
  ServiceIcon,
} from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";
import { AppButton } from "@/components/ui/app-button";

const TABS = [
  { key: "services", labelKey: "providerDetails.tabs.services", icon: ServiceIcon },
  { key: "about", labelKey: "providerDetails.tabs.aboutUs", icon: Info },
  { key: "gallery", labelKey: "providerDetails.tabs.gallery", icon: ProviderGalleryIcon },
  { key: "offers", labelKey: "providerDetails.tabs.offers", icon: ProviderOfferIcon },
  { key: "reviews", labelKey: "providerDetails.tabs.reviews", icon: ReviewsIcon },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const TAB_KEYS = TABS.map((tab) => tab.key);

function isTabKey(value: string): value is TabKey {
  return (TAB_KEYS as string[]).includes(value);
}

export function ProviderTabsSection({
  panels,
}: {
  // A key absent from `panels` means that tab has no data — it's hidden
  // entirely rather than shown with an empty/"coming soon" state.
  panels: Partial<Record<TabKey, ReactNode>>;
}) {
  const visibleTabs = TABS.filter((tab) => tab.key in panels);
  const fallbackTab = visibleTabs[0]?.key ?? "services";

  const tabFromHash = (): TabKey => {
    const hash = window.location.hash.slice(1);
    return isTabKey(hash) && hash in panels ? hash : fallbackTab;
  };

  const [activeTab, setActiveTab] = useState<TabKey>(fallbackTab);
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const tab = tabFromHash();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from browser URL hash, not derivable from props/state
    setActiveTab(tab);

    // Only for a real deep link (e.g. "#services" from the cart's "Add More
    // Services") — a bare page load has no hash, so nothing to scroll to.
    // requestAnimationFrame lets the tab panel's own layout (which can shift
    // page height, e.g. swapping in the services list) settle first.
    if (isTabKey(hash) && hash in panels) {
      requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    const handlePopState = () => setActiveTab(tabFromHash());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectTab = (key: TabKey) => {
    setActiveTab(key);
    window.history.pushState(null, "", `#${key}`);
  };

  return (
    <div ref={sectionRef} className="scroll-mt-14 xl:scroll-mt-19">
      {/* max-lg: sticky text-only tab bar; Offers live in the hero card there. */}
      <div className="sticky top-14 z-30 border-b border-border-default bg-bg-primary xl:hidden max-lg:mt-4">
        <div className="container flex items-center gap-2 overflow-x-auto">
          {visibleTabs.filter((tab) => tab.key !== "offers").map(({ key, labelKey }) => {
            const active = key === activeTab;
            return (
              <button
                key={key}
                type="button"
                onClick={() => selectTab(key)}
                className={`shrink-0 border-b-2 px-3 py-3 text-sm whitespace-nowrap transition-colors duration-200 ${
                  active
                    ? "border-bg-brand font-medium text-text-brand"
                    : "border-transparent text-text-secondary"
                }`}
              >
                {t(labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="hidden border-b border-border-default bg-bg-primary xl:sticky xl:top-19 xl:z-30 xl:block">
        <div className="container flex items-center pt-6">
          {visibleTabs.map(({ key, labelKey, icon: Icon }) => {
            const active = key === activeTab;
            return (
              <AppButton
                key={key}
                variant="link"
                onClick={() => selectTab(key)}
                className="group relative w-40 items-center justify-center gap-2 p-3 transition-colors duration-200"
              >
                <span
                  className={
                    active
                      ? "flex items-center rounded-lg bg-bg-brand p-2 transition-colors duration-200"
                      : "flex items-center rounded-lg bg-bg-secondary p-2 transition-colors duration-200 group-hover:bg-bg-brand"
                  }
                >
                  <Icon
                    className={
                      active
                        ? "size-5 text-icon-inverse transition-colors duration-200"
                        : "size-5 text-icon-primary transition-colors duration-200 group-hover:text-icon-inverse"
                    }
                  />
                </span>
                <span
                  className={
                    active
                      ? "text-base text-text-brand transition-colors duration-200"
                      : "text-base text-text-primary transition-colors duration-200 group-hover:text-text-brand"
                  }
                >
                  {t(labelKey)}
                </span>
                <span
                  className={
                    active
                      ? "absolute inset-x-0 -bottom-px h-[3px] rounded-t-xl bg-bg-brand opacity-100 transition-opacity duration-200"
                      : "absolute inset-x-0 -bottom-px h-[3px] rounded-t-xl bg-bg-brand opacity-0 transition-opacity duration-200"
                  }
                />
              </AppButton>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 bg-bg-secondary py-4 xl:bg-transparent xl:py-8">
        <div
          key={activeTab}
          className="container flex animate-in fade-in flex-col gap-6 duration-300"
        >
          {panels[activeTab] ?? (
            <div className="flex items-center justify-center self-stretch rounded-xl border border-border-default bg-bg-primary p-6 text-base text-text-secondary">
              {t("common.comingSoon")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
