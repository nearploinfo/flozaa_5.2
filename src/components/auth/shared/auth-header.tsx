"use client";

import { ArrowLeftIcon, CloseIcon } from "@/components/icons/icons";
import { AppButton } from "@/components/ui/app-button";
import { useTranslation } from "@/lib/i18n/translation-context";

export function AuthHeader({
  title,
  description,
  onClose,
  onBack,
  backLabel,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  /** Steps reached from another step (OTP, reset-password) show a back arrow
   * instead of Skip — there's somewhere meaningful to go back to. */
  onBack?: () => void;
  /** Optional text next to the back arrow (e.g. "Forgot Password" on the
   * create-new-password step) — OTP steps leave this unset (arrow only). */
  backLabel?: string;
}) {
  const { t } = useTranslation();
  return (
    <>
      {/* max-lg: the sign-in dialog is full-screen there (see signin-modal's
          max-lg: classes) — a plain "Skip" link reads better full-bleed than
          a bordered close button, and the title stands on its own instead of
          sharing a header bar. */}
      <div className={onBack ? "flex items-center px-4 pt-4 xl:hidden" : "flex items-start justify-end px-4 pt-4 xl:hidden"}>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel || t("account.profile.back")}
            className="flex items-center gap-2"
          >
            <span className="flex size-8 shrink-0 items-center justify-center">
              <ArrowLeftIcon className="size-6 text-text-primary rtl:rotate-180" />
            </span>
            {backLabel && <span className="text-sm font-medium text-text-primary">{backLabel}</span>}
          </button>
        ) : (
          <AppButton
            variant="link"
            size="sm"
            onClick={onClose}
            className="h-auto p-0 font-normal text-button-link-primary-text"
          >
            {t("common.skip")}
          </AppButton>
        )}
      </div>
      <div className="flex flex-col items-start gap-1 px-4 pb-6 xl:hidden">
        <h2 className="self-stretch text-2xl font-bold text-text-primary">{title}</h2>
        {description && (
          <p className="self-stretch text-sm text-text-secondary">{description}</p>
        )}
      </div>

      <div className="hidden items-start gap-8 self-stretch border-b border-border-default px-6 py-4 xl:flex">
        <div className="flex flex-1 flex-col items-start gap-0.5">
          <h2 className="self-stretch text-lg font-medium text-text-primary">{title}</h2>
          {description && (
            <p className="self-stretch text-sm text-text-secondary">{description}</p>
          )}
        </div>
        <AppButton
          variant="secondary-outline"
          aria-label={t("common.close")}
          onClick={onClose}
          className="shrink-0 rounded-md border-border-default bg-bg-secondary p-1"
        >
          <span className="flex size-5 items-center justify-center overflow-hidden">
            <CloseIcon className="size-3 text-button-secondary-outline-text" />
          </span>
        </AppButton>
      </div>
    </>
  );
}
