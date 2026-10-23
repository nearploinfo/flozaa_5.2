"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  AboutServiceIcon,
  BrochureIcon,
  FaqIcon,
  ReviewsIcon,
} from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";
import { AppButton } from "@/components/ui/app-button";

const TABS = [
  { key: "about", labelKey: "services.tabs.aboutService", icon: AboutServiceIcon },
  { key: "brochure", labelKey: "services.tabs.brochureFiles", icon: BrochureIcon },
  { key: "faqs", labelKey: "services.tabs.faqs", icon: FaqIcon },
  { key: "reviews", labelKey: "services.tabs.reviews", icon: ReviewsIcon },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const TAB_KEYS = TABS.map((tab) => tab.key);

function isTabKey(value: string): value is TabKey {
  return (TAB_KEYS as string[]).includes(value);
}

export function ServiceTabsSection({
  panels,
}: {
  // A key absent from `panels` means that tab has no data — it's hidden
  // entirely rather than shown with an empty/"coming soon" state.
  panels: Partial<Record<TabKey, ReactNode>>;
}) {
  const visibleTabs = TABS.filter((tab) => tab.key in panels);
  const fallbackTab = visibleTabs[0]?.key ?? "about";

  const tabFromHash = (): TabKey => {
    const hash = window.location.hash.slice(1);
    return isTabKey(hash) && hash in panels ? hash : fallbackTab;
  };

  const [activeTab, setActiveTab] = useState<TabKey>(fallbackTab);
  const { t } = useTranslation();

  useEffect(() => {
    const tab = tabFromHash();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from browser URL hash, not derivable from props/state
    setActiveTab(tab);

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
    <>
      <div className="sticky top-0 z-30 border-b border-border-default bg-bg-primary lg:top-19">
        <div className="container flex items-center pt-6">
          {visibleTabs.map(({ key, labelKey, icon: Icon }) => {
            const active = key === activeTab;
            return (
              <AppButton
                key={key}
                variant="link"
                onClick={() => selectTab(key)}
                className="group relative items-center gap-2 px-4 py-3 transition-colors duration-200"
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
                        ? "size-5 text-button-primary-text transition-colors duration-200"
                        : "size-5 text-icon-primary transition-colors duration-200 group-hover:text-button-primary-text"
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

      <div className="flex flex-col items-center gap-6 bg-bg-secondary pt-6 pb-16">
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
    </>
  );
}
