"use client";

import { AnimatePresence, motion } from "motion/react";
import { AppButton } from "@/components/ui/app-button";
import { CheckIcon } from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";

/** Mobile-only full-screen counterpart to action-success-modal.tsx's desktop
 * Dialog — reschedule/cancel confirmation reads as a page takeover on
 * mobile, not a small centered card, matching the rest of this app's
 * mobile modal treatment (mobile-coupons-screen.tsx, mobile-reschedule-screen.tsx). */
export function MobileActionSuccessScreen({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onBackToHome,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onBackToHome: () => void;
}) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col items-center bg-bg-secondary xl:hidden"
        >
          <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <span className="flex size-20 items-center justify-center rounded-full bg-bg-success">
              <CheckIcon className="size-9 text-icon-inverse" />
            </span>
            <div className="flex w-full flex-col items-center gap-1">
              <span className="w-full text-lg font-bold text-text-primary">{title}</span>
              <span className="w-full text-sm text-text-secondary">{description}</span>
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-4 p-6">
            <AppButton variant="primary" size="lg" className="w-full justify-center" onClick={onConfirm}>
              {confirmLabel}
            </AppButton>
            <button
              type="button"
              onClick={onBackToHome}
              className="text-sm font-medium text-button-link-primary-text"
            >
              {t("checkoutPage.paymentStatus.backToHome")}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
