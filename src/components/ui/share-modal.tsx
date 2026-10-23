"use client";

import { useState } from "react";
import { FacebookShareButton, WhatsappShareButton, XShareButton } from "react-share";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AppButton } from "@/components/ui/app-button";
import {
  CopyIcon,
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  WhatsAppIcon,
} from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";

export function ShareModal({
  open,
  onOpenChange,
  url,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [instagramCopied, setInstagramCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  // Instagram has no web share-intent URL — copy the link, then hand off to
  // Instagram so the user can paste it into a post/story/DM themselves.
  const shareToInstagram = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setInstagramCopied(true);
      setTimeout(() => setInstagramCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-[549px] flex-col gap-6 p-6 sm:max-w-[549px]">
        <DialogTitle className="sr-only">{t("share.title")}</DialogTitle>

        <div className="flex flex-col items-center gap-6 self-stretch">
          <div className="flex flex-col items-center gap-2 self-stretch">
            <p className="text-base font-medium text-text-primary">
              {t("share.title")}
            </p>
            <p className="text-center text-sm text-text-secondary">
              {t("share.description")}
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-3">
            <WhatsappShareButton
              url={url}
              title={title}
              className="flex items-center justify-center gap-2 rounded-lg border border-border-default bg-bg-secondary px-4 py-3"
              resetButtonStyle={false}
            >
              <WhatsAppIcon className="size-5 text-icon-primary" />
              <span className="text-sm text-text-primary">{t("share.whatsapp")}</span>
            </WhatsappShareButton>
            <button
              type="button"
              onClick={shareToInstagram}
              className="flex items-center justify-center gap-2 rounded-lg border border-border-default bg-bg-secondary px-4 py-3"
            >
              <InstagramIcon className="size-5 text-icon-primary" />
              <span className="text-sm text-text-primary">
                {instagramCopied ? t("share.instagramCopied") : t("share.instagram")}
              </span>
            </button>
            <FacebookShareButton
              url={url}
              className="flex items-center justify-center gap-2 rounded-lg border border-border-default bg-bg-secondary px-4 py-3"
              resetButtonStyle={false}
            >
              <FacebookIcon className="size-5 text-icon-primary" />
              <span className="text-sm text-text-primary">{t("share.facebook")}</span>
            </FacebookShareButton>
            <XShareButton
              url={url}
              title={title}
              className="flex items-center justify-center gap-2 rounded-lg border border-border-default bg-bg-secondary px-4 py-3"
              resetButtonStyle={false}
            >
              <TwitterIcon className="size-5 text-icon-primary" />
              <span className="text-sm text-text-primary">{t("share.twitter")}</span>
            </XShareButton>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 self-stretch">
          <span className="text-base text-text-primary">
            {t("share.pageLink")}
          </span>
          <div className="flex items-center gap-3 self-stretch rounded-sm border border-border-default py-1 pl-4 pr-1">
            <span className="flex-1 truncate text-base text-text-secondary">
              {url}
            </span>
            <AppButton
              variant="secondary"
              size="sm"
              leftIcon={CopyIcon}
              onClick={copyLink}
              className="shrink-0"
            >
              {copied ? t("share.copied") : t("share.copy")}
            </AppButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
