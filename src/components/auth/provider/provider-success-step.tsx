"use client";

import { AppStoreIcon, CheckCircleIcon, PlayStoreIcon } from "@/components/icons/icons";
import { Link } from "@/components/ui/locale-link";
import { useTranslation } from "@/lib/i18n/translation-context";

export function ProviderSuccessStep({
  partnerRegisterUrl,
  appStoreUrl,
  playStoreUrl,
}: {
  partnerRegisterUrl?: string;
  appStoreUrl?: string;
  playStoreUrl?: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-6 self-stretch p-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-bg-brand-subtle">
        <CheckCircleIcon className="size-8 text-icon-brand" />
      </span>

      <p className="text-base text-text-secondary">{t("auth.provider.success.description")}</p>

      {partnerRegisterUrl && (
        <Link
          href={partnerRegisterUrl}
          target="_blank"
          className="flex w-full items-center justify-center rounded-lg bg-button-primary-bg px-4 py-2 text-base font-medium text-button-primary-text hover:bg-button-primary-hover"
        >
          {t("auth.provider.success.goToPanel")}
        </Link>
      )}

      {(playStoreUrl || appStoreUrl) && (
        <div className="flex w-full items-center justify-center gap-3">
          {playStoreUrl && (
            <Link
              href={playStoreUrl}
              target="_blank"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border-default px-3 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
            >
              <PlayStoreIcon className="size-5" />
              {t("footer.googlePlay")}
            </Link>
          )}
          {appStoreUrl && (
            <Link
              href={appStoreUrl}
              target="_blank"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border-default px-3 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
            >
              <AppStoreIcon className="size-5" />
              {t("footer.appStore")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
