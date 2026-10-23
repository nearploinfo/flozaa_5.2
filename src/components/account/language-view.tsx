"use client";

import { useRouter } from "next/router";
import { Globe } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { localizePath } from "@/lib/i18n/locale-path";
import { usePathnameCompat } from "@/lib/next-router-compat";
import { useTranslation } from "@/lib/i18n/translation-context";
import { cn } from "@/lib/utils";
import ProfileLayout from "./ProfileLayout";

function LanguageRow({
  name,
  image,
  selected,
  onSelect,
}: {
  name: string;
  image?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-3xl bg-bg-primary p-4"
    >
      {image ? (
        <AppImage src={image} alt={name} className="size-10 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg-secondary">
          <Globe className="size-5 text-icon-secondary" />
        </span>
      )}
      <span className="flex-1 text-start text-base font-semibold text-text-primary">{name}</span>
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-button-primary-bg" : "border-border-strong"
        )}
      >
        {selected && <span className="size-2.5 rounded-full bg-button-primary-bg" />}
      </span>
    </button>
  );
}

export function LanguageView() {
  const { t, lang, defaultLocale, languages } = useTranslation();
  const title = t("account.menu.language");
  const router = useRouter();
  const pathname = usePathnameCompat();

  const switchLanguage = (code: string) => {
    if (code === lang) return;
    // eslint-disable-next-line react-hooks/immutability -- writing a cookie from a click handler, not during render
    document.cookie = `edemand-lang=${code}; path=/; max-age=31536000`;
    const rest = pathname.startsWith(`/${lang}`) ? pathname.slice(lang.length + 1) : pathname;
    router.push(localizePath(rest || "/", code, defaultLocale));
  };

  return (
    <>
      <PageBreadcrumb title={title} items={[{ label: title }]} />

      {/* Mobile */}
      <div className="xl:hidden">
        <ProfileLayout title={title}>
          <div className="flex w-full flex-col gap-4">
            {languages.map((language) => (
              <LanguageRow
                key={language.code}
                name={language.name}
                image={language.image}
                selected={language.code === lang}
                onSelect={() => switchLanguage(language.code)}
              />
            ))}
          </div>
        </ProfileLayout>
      </div>

      {/* Desktop */}
      <div className="container hidden flex-col items-start gap-6 py-16 xl:flex xl:flex-row xl:justify-center">
        <AccountSidebar />
        <div className="flex w-full flex-1 flex-col items-start rounded-xl border border-border-default bg-bg-primary">
          <div className="flex w-full items-center justify-center gap-4 border-b border-border-default p-6">
            <span className="flex-1 text-xl font-medium text-text-primary">{title}</span>
          </div>
          <div className="flex w-full flex-col items-start gap-3 p-6">
            {languages.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={() => switchLanguage(language.code)}
                className="flex w-full items-center gap-3 rounded-lg border border-border-default p-3"
              >
                {language.image ? (
                  <AppImage
                    src={language.image}
                    alt={language.name}
                    className="size-9 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-secondary">
                    <Globe className="size-5 text-icon-secondary" />
                  </span>
                )}
                <span className="flex-1 text-start text-base text-text-primary">{language.name}</span>
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                    language.code === lang ? "border-button-primary-bg" : "border-border-strong"
                  )}
                >
                  {language.code === lang && <span className="size-2.5 rounded-full bg-button-primary-bg" />}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
