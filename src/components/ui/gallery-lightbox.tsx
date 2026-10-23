"use client";

import { useEffect, useRef } from "react";
import { AppImage } from "@/components/ui/app-image";
import { AppButton } from "@/components/ui/app-button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons/icons";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useIsMobile } from "@/lib/use-is-mobile";

export function GalleryLightbox({
  images,
  title,
  open,
  activeIndex,
  onOpenChange,
  onActiveIndexChange,
}: {
  images: string[];
  title: string;
  open: boolean;
  activeIndex: number;
  onOpenChange: (open: boolean) => void;
  onActiveIndexChange: (index: number) => void;
}) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const goTo = (index: number) => {
    onActiveIndexChange((index + images.length) % images.length);
  };
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
      if (event.key === "ArrowLeft") goTo(activeIndex - 1);
      if (event.key === "ArrowRight") goTo(activeIndex + 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- goTo is redefined every render off activeIndex, already in deps
  }, [open, activeIndex, images.length, onOpenChange]);

  // Body scroll lock for the mobile overlay — it isn't a Radix Dialog, so
  // nothing else stops the page behind it from scrolling with the swipe.
  useEffect(() => {
    if (!isMobile || !open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, open]);

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    const SWIPE_THRESHOLD = 50;
    if (deltaX > SWIPE_THRESHOLD) goTo(activeIndex - 1);
    else if (deltaX < -SWIPE_THRESHOLD) goTo(activeIndex + 1);
  };

  if (isMobile) {
    if (!open) return null;
    // Deliberately not a Radix Dialog — its Content is centered via a CSS
    // transform, which becomes the containing block for any `fixed`
    // descendant and fights a true full-bleed layout. Simplest fix is to
    // not use it here: fixed, full-viewport, no transform anywhere.
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-bg-primary">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label={t("common.close")}
          className="absolute start-4 top-4 z-10 flex size-9 items-center justify-center rounded-lg bg-bg-brand-subtle"
        >
          <ArrowLeftIcon className="size-6 text-icon-brand rtl:rotate-180" />
        </button>

        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative flex flex-1 items-center justify-center touch-pan-y"
        >
          <AppImage
            src={images[activeIndex]}
            alt={`${title} photo ${activeIndex + 1}`}
            className="h-full w-full object-contain"
          />

          {images.length > 1 && (
            <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-1.5">
              {images.map((image, index) => (
                <span
                  key={image + index}
                  className={cn(
                    "size-1.5 rounded-full",
                    index === activeIndex ? "bg-bg-brand" : "bg-bg-tertiary"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex w-[min(88rem,calc(100vw-2rem))] max-w-none flex-col gap-0 p-0 sm:max-w-none"
      >
        <div className="flex items-center gap-6 border-b border-border-default px-6 py-4">
          <DialogTitle className="flex-1 text-lg font-medium text-text-primary">
            {t("common.gallery.allPhotos")}
          </DialogTitle>
          <AppButton
            variant="secondary-outline"
            size="md"
            iconOnly
            leftIcon={XIcon}
            onClick={() => onOpenChange(false)}
            aria-label={t("common.close")}
          >
            {t("common.close")}
          </AppButton>
        </div>

        <div className="flex flex-col items-start gap-10 p-6">
          <div className="flex w-full items-center justify-center gap-16">
            {images.length > 1 && (
              <AppButton
                variant="secondary"
                size="lg"
                iconOnly
                leftIcon={(props) => <ArrowLeftIcon {...props} className={cn(props.className, "rtl:rotate-180")} />}
                onClick={() => goTo(activeIndex - 1)}
                aria-label={t("common.gallery.previousPhoto")}
              >
                {t("common.gallery.previousPhoto")}
              </AppButton>
            )}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="h-[576px] w-full max-w-3xl shrink-0 touch-pan-y"
            >
              <AppImage
                src={images[activeIndex]}
                alt={`${title} photo ${activeIndex + 1}`}
                className="h-[576px] w-full rounded-2xl bg-bg-secondary object-contain"
              />
            </div>
            {images.length > 1 && (
              <AppButton
                variant="secondary"
                size="lg"
                iconOnly
                leftIcon={(props) => <ArrowRightIcon {...props} className={cn(props.className, "rtl:rotate-180")} />}
                onClick={() => goTo(activeIndex + 1)}
                aria-label={t("common.gallery.nextPhoto")}
              >
                {t("common.gallery.nextPhoto")}
              </AppButton>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex w-full items-center justify-center gap-6">
              {images.map((image, index) => (
                <button
                  key={image + index}
                  type="button"
                  onClick={() => goTo(index)}
                  className={cn(
                    "size-28 shrink-0 overflow-hidden rounded-lg",
                    index === activeIndex &&
                      "outline outline-2 outline-offset-0 outline-border-brand shadow-[0px_4px_8px_0px_rgba(0,0,0,0.06)]"
                  )}
                >
                  <AppImage
                    src={image}
                    alt={`${title} thumbnail ${index + 1}`}
                    className="size-28 rounded-lg object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
