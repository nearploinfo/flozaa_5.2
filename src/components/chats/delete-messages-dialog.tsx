"use client";

import { Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AppButton } from "@/components/ui/app-button";
import { useTranslation } from "@/lib/i18n/translation-context";

interface DeleteMessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteMessagesDialog({ open, onOpenChange, onConfirm }: DeleteMessagesDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="gap-6 rounded-2xl border border-border-default p-4 ring-0">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center rounded-xl bg-bg-error-subtle p-3">
            <Trash2 className="size-7 text-destructive" />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <AlertDialogTitle className="text-lg font-medium text-text-primary">
              {t("chats.deleteMessagesTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-text-secondary">
              {t("chats.deleteMessagesDescription")}
            </AlertDialogDescription>
          </div>
        </div>
        <div className="flex w-full gap-4">
          <AppButton
            variant="primary"
            size="md"
            className="flex-1"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {t("chats.deleteMessagesConfirm")}
          </AppButton>
          <AppButton variant="secondary-outline" size="md" className="flex-1" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </AppButton>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
