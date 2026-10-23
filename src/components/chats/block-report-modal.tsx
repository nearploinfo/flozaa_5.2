"use client";

import { useEffect, useState } from "react";
import { XIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AppButton } from "@/components/ui/app-button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { getReportReasonsApi } from "@/api/apiRoutes";
import { useTranslation } from "@/lib/i18n/translation-context";
import { cn } from "@/lib/utils";

interface ReportReason {
  id: number;
  reason: string;
  translated_reason?: string;
  needs_additional_info?: string;
}

interface BlockReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { reason_id: number | null; additional_info: string }) => Promise<void> | void;
}

export function BlockReportModal({ open, onOpenChange, onSubmit }: BlockReportModalProps) {
  const { t } = useTranslation();
  const [reasons, setReasons] = useState<ReportReason[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedReasonId, setSelectedReasonId] = useState<number | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState("");

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off the fetch when the modal opens
    setLoading(true);
    getReportReasonsApi()
      .then((response) => setReasons(Array.isArray(response?.data) ? response.data : []))
      .catch(() => setReasons([]))
      .finally(() => setLoading(false));
  }, [open]);

  const selectedReason = reasons.find((reason) => reason.id === selectedReasonId) ?? null;
  const needsAdditionalInfo = selectedReason?.needs_additional_info === "1";

  const reset = () => {
    setSelectedReasonId(null);
    setAdditionalInfo("");
  };

  const handleSubmit = async () => {
    if (!selectedReasonId || (needsAdditionalInfo && !additionalInfo.trim())) return;
    setSubmitting(true);
    try {
      await onSubmit({ reason_id: selectedReasonId, additional_info: needsAdditionalInfo ? additionalInfo : "" });
      reset();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent showCloseButton={false} className="flex max-w-[520px] flex-col gap-0 p-0 sm:max-w-[520px]">
        <div className="flex w-full items-center gap-6 border-b border-border-default px-6 py-4">
          <DialogTitle className="flex-1 text-lg font-medium text-text-primary">
            {t("chats.blockAndReport")}
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center gap-2 rounded-lg border border-border-default bg-bg-secondary p-2"
            aria-label={t("common.close")}
          >
            <XIcon className="size-3.5 text-button-secondary-outline-text" />
          </button>
        </div>

        <div className="flex max-h-[420px] w-full flex-col items-center gap-4 overflow-y-auto p-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-14 w-full rounded-lg" />)
          ) : reasons.length === 0 ? (
            <span className="w-full py-8 text-center text-sm text-text-secondary">
              {t("chats.noReportReasons")}
            </span>
          ) : (
            reasons.map((reason) => (
              <button
                key={reason.id}
                type="button"
                onClick={() => {
                  setSelectedReasonId(reason.id);
                  if (reason.needs_additional_info !== "1") setAdditionalInfo("");
                }}
                className={cn(
                  "flex w-full items-center rounded-lg border p-4 text-start",
                  selectedReasonId === reason.id
                    ? "border-border-brand bg-bg-brand-subtle"
                    : "border-border-default bg-bg-primary"
                )}
              >
                <span className="flex-1 text-base text-text-primary">
                  {reason.translated_reason || reason.reason}
                </span>
              </button>
            ))
          )}

          {needsAdditionalInfo && (
            <Textarea
              value={additionalInfo}
              onChange={(event) => setAdditionalInfo(event.target.value)}
              placeholder={t("chats.additionalCommentsPlaceholder")}
              className="min-h-24 w-full resize-none"
            />
          )}
        </div>

        <div className="flex w-full items-center gap-6 border-t border-border-default px-6 py-4">
          <AppButton
            variant="primary"
            size="md"
            className="flex-1"
            disabled={!selectedReasonId || (needsAdditionalInfo && !additionalInfo.trim()) || submitting}
            onClick={handleSubmit}
          >
            {t("chats.submitReport")}
          </AppButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
