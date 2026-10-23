"use client";

import { useEffect, useState } from "react";
import { XIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AppButton } from "@/components/ui/app-button";
import { AppImage } from "@/components/ui/app-image";
import { Skeleton } from "@/components/ui/skeleton";
import { getBlockedProvidersApi, unblockUserApi } from "@/api/apiRoutes";
import { useTranslation } from "@/lib/i18n/translation-context";

interface BlockedProviderApi {
  id: number;
  provider_name: string;
  translated_provider_name?: string;
  image: string;
  reason?: string;
  translated_reason?: string;
  additional_info?: string;
}

interface BlockedProvidersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after successfully unblocking, in case that provider is the currently open chat. */
  onProviderUnblocked?: (providerId: number) => void;
}

export function BlockedProvidersModal({ open, onOpenChange, onProviderUnblocked }: BlockedProvidersModalProps) {
  const { t } = useTranslation();
  const [providers, setProviders] = useState<BlockedProviderApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [unblockingId, setUnblockingId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off the fetch when the modal opens
    setLoading(true);
    getBlockedProvidersApi()
      .then((response) => setProviders(Array.isArray(response?.data) ? response.data : []))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, [open]);

  const handleUnblock = async (provider: BlockedProviderApi) => {
    setUnblockingId(provider.id);
    try {
      const response = await unblockUserApi({ partner_id: provider.id });
      if (response?.error === false) {
        setProviders((current) => {
          const next = current.filter((item) => item.id !== provider.id);
          if (next.length === 0) onOpenChange(false);
          return next;
        });
        onProviderUnblocked?.(provider.id);
      }
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="flex max-w-[550px] flex-col gap-0 p-0 sm:max-w-[550px]">
        <div className="flex w-full items-center gap-6 border-b border-border-default px-6 py-4">
          <DialogTitle className="flex-1 text-lg font-medium text-text-primary">
            {t("chats.blockedProviders")}
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

        <div className="flex max-h-[420px] w-full flex-col items-start gap-4 overflow-y-auto p-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-16 w-full rounded-lg" />)
          ) : providers.length === 0 ? (
            <span className="w-full py-8 text-center text-sm text-text-secondary">
              {t("chats.emptyBlockedProviders")}
            </span>
          ) : (
            providers.map((provider) => (
              <div
                key={provider.id}
                className="flex w-full items-center gap-4 rounded-lg border border-border-default bg-bg-secondary p-4"
              >
                <div className="relative size-11 shrink-0 overflow-hidden rounded-lg">
                  <AppImage
                    src={provider.image}
                    alt={provider.translated_provider_name || provider.provider_name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col items-start gap-1">
                  <span className="line-clamp-1 w-full text-sm font-medium text-text-primary">
                    {provider.translated_provider_name || provider.provider_name}
                  </span>
                  {(provider.translated_reason || provider.reason) && (
                    <span className="line-clamp-1 text-sm text-text-secondary">
                      {provider.translated_reason || provider.reason}
                    </span>
                  )}
                  {provider.additional_info && (
                    <span className="line-clamp-1 text-sm text-text-secondary">{provider.additional_info}</span>
                  )}
                </div>
                <AppButton
                  variant="secondary"
                  size="sm"
                  className="rounded-sm"
                  disabled={unblockingId === provider.id}
                  onClick={() => handleUnblock(provider)}
                >
                  {t("chats.unblock")}
                </AppButton>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
