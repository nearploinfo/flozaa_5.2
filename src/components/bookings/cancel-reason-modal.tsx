"use client";

import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AppButton } from "@/components/ui/app-button";
import { Skeleton } from "@/components/ui/skeleton";
import { CloseIcon } from "@/components/icons/icons";
import { getReasonsApi } from "@/api/apiRoutes";
import { useTranslation } from "@/lib/i18n/translation-context";
import { cn } from "@/lib/utils";

interface CancelReason {
  id: number;
  reason: string;
  translated_reason?: string;
  needs_additional_info?: number | string;
}

const needsInfo = (value: CancelReason["needs_additional_info"]) => value === 1 || value === "1";

export function CancelReasonModal({
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { cancel_reason_id: number; additional_info: string }) => Promise<void>;
  submitting: boolean;
}) {
  const { t } = useTranslation();
  const [reasons, setReasons] = useState<CancelReason[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState<number | null>(null);
  const [additionalComment, setAdditionalComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    getReasonsApi({ type: "cancel" })
      .then((response) => {
        if (cancelled) return;
        setReasons(Array.isArray(response?.data) ? response.data : []);
      })
      .catch(() => {
        if (!cancelled) setReasons([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedReason = reasons.find((reason) => reason.id === selectedReasonId) ?? null;
  const needsAdditionalInfo = needsInfo(selectedReason?.needs_additional_info);
  const canSubmit = selectedReasonId !== null && (!needsAdditionalInfo || additionalComment.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit || selectedReasonId === null) return;
    await onSubmit({
      cancel_reason_id: selectedReasonId,
      additional_info: needsAdditionalInfo ? additionalComment.trim() : "",
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setSelectedReasonId(null);
          setAdditionalComment("");
        }
        onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex w-[520px] max-w-[calc(100%-2rem)] flex-col items-start gap-0 overflow-hidden rounded-2xl bg-bg-primary p-0 ring-1 ring-border-default sm:max-w-[520px]"
      >
        <div className="flex w-full items-start gap-8 border-b border-border-default px-6 py-4">
          <div className="flex flex-1 flex-col items-start gap-0.5">
            <DialogTitle className="text-xl font-medium text-text-primary">
              {t("bookings.detail.cancelModal.title")}
            </DialogTitle>
            <span className="text-sm text-text-secondary">{t("bookings.detail.cancelModal.description")}</span>
          </div>
          <button
            type="button"
            aria-label={t("checkoutPage.dateTime.modal.closeAriaLabel")}
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center rounded-lg border border-button-secondary-outline-border bg-bg-secondary p-2 text-button-secondary-outline-text hover:opacity-90"
          >
            <CloseIcon className="size-3.5" />
          </button>
        </div>

        <div className="flex max-h-[400px] w-full flex-col items-center gap-4 overflow-y-auto p-6">
          {loading ? (
            [1, 2, 3, 4].map((key) => <Skeleton key={key} className="h-12 w-full rounded-lg" />)
          ) : reasons.length === 0 ? (
            <div className="flex min-h-[160px] w-full flex-col items-center justify-center gap-3 text-center">
              <TriangleAlert className="size-10 text-text-secondary opacity-50" />
              <span className="text-sm font-medium text-text-secondary">
                {t("bookings.detail.cancelModal.noReasons")}
              </span>
            </div>
          ) : (
            <>
              {reasons.map((reason) => {
                const active = selectedReasonId === reason.id;
                return (
                  <button
                    key={reason.id}
                    type="button"
                    onClick={() => setSelectedReasonId(reason.id)}
                    className={cn(
                      "flex w-full flex-col items-start gap-4 rounded-lg border p-4 text-left",
                      active
                        ? "border-border-brand bg-bg-brand-subtle text-text-brand"
                        : "border-border-default bg-bg-primary text-text-primary hover:bg-bg-secondary"
                    )}
                  >
                    <span className="text-base">{reason.translated_reason ?? reason.reason}</span>
                  </button>
                );
              })}
              {selectedReason && needsAdditionalInfo && (
                <div className="flex w-full flex-col items-start gap-2">
                  <label className="text-sm text-form-field-label">
                    {t("bookings.detail.cancelModal.additionalInfoLabel")}
                  </label>
                  <textarea
                    value={additionalComment}
                    onChange={(event) => setAdditionalComment(event.target.value)}
                    placeholder={t("bookings.detail.cancelModal.additionalInfoPlaceholder")}
                    maxLength={500}
                    className="min-h-[100px] w-full resize-none rounded-sm border border-form-field-border px-4 py-2 text-base text-text-primary outline-none placeholder:text-form-field-placeholder"
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex w-full items-center gap-4 border-t border-border-default px-6 py-4">
          <AppButton
            variant="primary"
            size="md"
            className="flex-1"
            disabled={!canSubmit || submitting || reasons.length === 0}
            onClick={handleSubmit}
          >
            {t("bookings.detail.cancelModal.confirm")}
          </AppButton>
          <AppButton variant="secondary-outline" size="md" className="flex-1" onClick={() => onOpenChange(false)}>
            {t("bookings.detail.cancelModal.dismiss")}
          </AppButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
