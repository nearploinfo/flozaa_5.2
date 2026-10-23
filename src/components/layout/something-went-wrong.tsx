"use client";

import { SomethingWentWrongIllustration } from "@/components/common/something-went-wrong-illustration";
import { AppButton } from "@/components/ui/app-button";
import { useTranslation } from "@/lib/i18n/translation-context";

/** Generic fallback shown wherever a request/render fails outright — the
 * error-boundary catch-all and any page-level "couldn't load" state. */
export function SomethingWentWrong({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[679px] w-full flex-col items-center justify-center gap-10 bg-bg-primary px-6 py-16 lg:px-36">
      <SomethingWentWrongIllustration className="h-auto w-56 lg:w-72" />

      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-medium text-text-primary lg:text-3xl">
          {t("errors.somethingWentWrong.title")}
        </h1>
        <p className="text-base text-text-secondary lg:text-xl">
          {t("errors.somethingWentWrong.description")}
        </p>
        {onRetry && (
          <AppButton variant="primary" size="md" className="mt-2" onClick={onRetry}>
            {t("errors.somethingWentWrong.retry")}
          </AppButton>
        )}
      </div>
    </div>
  );
}
