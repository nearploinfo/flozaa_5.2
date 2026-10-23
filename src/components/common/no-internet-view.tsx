"use client";

import { NoInternetIllustration } from "@/components/common/no-internet-illustration";
import { AppButton } from "@/components/ui/app-button";
import { useTranslation } from "@/lib/i18n/translation-context";

export function NoInternetView({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[679px] w-full flex-col items-center justify-center gap-10 bg-bg-primary px-6 py-16 lg:px-36">
      <NoInternetIllustration className="h-auto w-72 text-icon-brand lg:w-96" />

      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-medium text-text-primary lg:text-3xl">
          {t("noInternet.title")}
        </h1>
        <p className="text-base text-text-secondary lg:text-xl">{t("noInternet.description")}</p>
      </div>

      <AppButton variant="primary" size="lg" onClick={onRetry}>
        {t("noInternet.retry")}
      </AppButton>
    </div>
  );
}
