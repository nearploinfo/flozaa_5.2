"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AppButton } from "@/components/ui/app-button";
import { AppImage } from "@/components/ui/app-image";
import {
  ArrowLeftIcon,
  CloseIcon,
  StarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useIsMobile } from "@/lib/use-is-mobile";
import { cn } from "@/lib/utils";

export interface RateModalItem {
  id: number;
  image: string;
  title: string;
  meta?: string;
  badge?: string;
  initialRating: number;
  initialReview: string;
  initialImages: string[];
}

interface ItemDraft {
  rating: number;
  review: string;
  existingImages: string[];
  removedImages: string[];
  newFiles: File[];
  newPreviews: string[];
}

function emptyDraft(item: RateModalItem): ItemDraft {
  return {
    rating: item.initialRating,
    review: item.initialReview,
    existingImages: item.initialImages,
    removedImages: [],
    newFiles: [],
    newPreviews: [],
  };
}

export function RateModal({
  open,
  onOpenChange,
  mode,
  items,
  onSubmitItem,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "service" | "handyman";
  items: RateModalItem[];
  onSubmitItem: (
    itemId: number,
    payload: { rating: number; review: string; images: File[]; imagesToDelete: string[] }
  ) => Promise<void>;
  onSubmitted: () => void;
}) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [drafts, setDrafts] = useState<Record<number, ItemDraft>>(() =>
    Object.fromEntries(items.map((item) => [item.id, emptyDraft(item)]))
  );
  const [expandedId, setExpandedId] = useState<number | null>(items[0]?.id ?? null);
  const [submitting, setSubmitting] = useState(false);

  const updateDraft = (id: number, patch: Partial<ItemDraft>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const handleAddPhotos = (id: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        newFiles: [...prev[id].newFiles, ...newFiles],
        newPreviews: [...prev[id].newPreviews, ...newPreviews],
      },
    }));
  };

  const removeExistingImage = (id: number, url: string) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        existingImages: prev[id].existingImages.filter((image) => image !== url),
        removedImages: [...prev[id].removedImages, url],
      },
    }));
  };

  const removeNewImage = (id: number, index: number) => {
    setDrafts((prev) => {
      const draft = prev[id];
      URL.revokeObjectURL(draft.newPreviews[index]);
      return {
        ...prev,
        [id]: {
          ...draft,
          newFiles: draft.newFiles.filter((_, i) => i !== index),
          newPreviews: draft.newPreviews.filter((_, i) => i !== index),
        },
      };
    });
  };

  const canSubmit = items.some((item) => (drafts[item.id]?.rating ?? 0) > 0);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const ratedItems = items.filter((item) => (drafts[item.id]?.rating ?? 0) > 0);
      await Promise.all(
        ratedItems.map((item) => {
          const draft = drafts[item.id];
          return onSubmitItem(item.id, {
            rating: draft.rating,
            review: draft.review,
            images: draft.newFiles,
            imagesToDelete: draft.removedImages,
          });
        })
      );
      toast.success(t("bookings.detail.rateModal.submitSuccess"));
      onSubmitted();
      onOpenChange(false);
    } catch {
      toast.error(t("bookings.detail.rateModal.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const modalTitle =
    mode === "service" ? t("bookings.detail.rateModal.titleService") : t("bookings.detail.rateModal.titleHandyman");

  if (isMobile) {
    if (!open) return null;
    // Full-screen page, not a bottom sheet/dialog — deliberately not reusing
    // Dialog here (same reasoning as GalleryLightbox's mobile branch).
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-bg-secondary">
        <div className="flex h-14 w-full items-center gap-2 bg-bg-primary px-4 shadow-[0px_8px_16px_0px_rgba(0,0,0,0.04)]">
          <button
            type="button"
            onClick={() => !submitting && onOpenChange(false)}
            aria-label={t("bookings.detail.rateModal.closeAriaLabel")}
            className="flex size-9 items-center justify-center"
          >
            <ArrowLeftIcon className="size-6 text-icon-primary rtl:rotate-180" />
          </button>
          <span className="text-base font-medium text-text-primary">{modalTitle}</span>
        </div>

        <div className="flex flex-1 flex-col items-start gap-4 overflow-y-auto p-4 pb-24">
          {items.map((item) => {
            const draft = drafts[item.id];
            if (!draft) return null;
            const isExpanded = expandedId === item.id;
            return (
              <div key={item.id} className="flex w-full flex-col items-start gap-3 rounded-xl bg-bg-primary p-3">
                <div className="flex w-full items-start gap-1">
                  <div className="flex flex-1 items-start gap-3">
                    <AppImage src={item.image} alt={item.title} className="size-10 shrink-0 rounded-lg object-cover" />
                    <div className="flex flex-1 flex-col items-start gap-2">
                      <span className="text-xs font-medium text-text-primary">{item.title}</span>
                      {(item.meta || item.badge) && (
                        <div className="flex items-center gap-2">
                          {item.badge && (
                            <span className="rounded-sm bg-bg-brand-subtle px-1 py-1 text-xs text-text-brand">
                              {item.badge}
                            </span>
                          )}
                          {item.meta && <span className="text-xs text-text-primary">{item.meta}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    aria-label={item.title}
                    className="flex size-6 shrink-0 items-center justify-center"
                  >
                    {isExpanded ? (
                      <ChevronUpIcon className="size-5 text-icon-primary" />
                    ) : (
                      <ChevronDownIcon className="size-5 text-icon-primary" />
                    )}
                  </button>
                </div>

                <div className="dashed-divider" />

                <div className="flex w-full items-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => updateDraft(item.id, { rating: star })}
                      aria-label={t("bookings.detail.rateModal.starAriaLabel", { count: star })}
                      className="flex size-4 items-center justify-center"
                    >
                      <StarIcon
                        className={cn("size-5", star <= draft.rating ? "text-icon-warning" : "text-icon-primary")}
                      />
                    </button>
                  ))}
                </div>

                {isExpanded && (
                  <>
                    <div className="flex w-full flex-col items-start gap-1">
                      <span className="text-xs text-form-field-label">
                        {t("bookings.detail.rateModal.reviewLabel")}
                      </span>
                      <textarea
                        value={draft.review}
                        onChange={(event) => updateDraft(item.id, { review: event.target.value })}
                        placeholder={t("bookings.detail.rateModal.reviewPlaceholder")}
                        className="h-20 w-full resize-none rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-xs text-text-primary outline-none placeholder:text-text-tertiary"
                      />
                    </div>

                    <div className="flex w-full flex-col items-start gap-3">
                      <span className="text-xs text-form-field-label">{t("bookings.detail.rateModal.addPhotos")}</span>
                      <div className="flex w-full flex-wrap items-center gap-3">
                        <label className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-bg-secondary">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => handleAddPhotos(item.id, event.target.files)}
                          />
                          <PlusIcon className="size-5 text-icon-primary" />
                        </label>
                        {draft.existingImages.map((image) => (
                          <div key={image} className="relative flex items-center justify-start">
                            <AppImage src={image} alt={item.title} className="size-9 rounded-lg object-cover" />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(item.id, image)}
                              aria-label={t("bookings.detail.rateModal.removePhotoAriaLabel")}
                              className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-bg-error p-0.5"
                            >
                              <TrashIcon className="size-2.5 text-icon-inverse" />
                            </button>
                          </div>
                        ))}
                        {draft.newPreviews.map((preview, index) => (
                          <div key={preview} className="relative flex items-center justify-start">
                            <AppImage src={preview} alt={item.title} className="size-9 rounded-lg object-cover" />
                            <button
                              type="button"
                              onClick={() => removeNewImage(item.id, index)}
                              aria-label={t("bookings.detail.rateModal.removePhotoAriaLabel")}
                              className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-bg-error p-0.5"
                            >
                              <TrashIcon className="size-2.5 text-icon-inverse" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="fixed inset-x-0 bottom-0 flex items-center gap-4 bg-bg-primary p-4 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)]">
          <AppButton
            variant="primary"
            size="lg"
            className="w-full justify-center"
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
          >
            {submitting ? t("bookings.detail.rateModal.submitting") : t("bookings.detail.rateModal.submit")}
          </AppButton>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent
        showCloseButton={false}
        className="flex w-[610px] max-w-[calc(100%-2rem)] flex-col items-start gap-0 overflow-hidden rounded-xl bg-bg-primary p-0 ring-1 ring-border-default sm:max-w-[calc(100%-2rem)] lg:max-w-[610px]"
      >
        <div className="flex w-full items-center gap-6 border-b border-border-default px-6 py-4">
          <DialogTitle className="flex-1 text-xl font-medium text-text-primary">{modalTitle}</DialogTitle>
          <AppButton
            variant="secondary-outline"
            size="md"
            iconOnly
            leftIcon={CloseIcon}
            onClick={() => onOpenChange(false)}
            aria-label={t("bookings.detail.rateModal.closeAriaLabel")}
          >
            {t("bookings.detail.rateModal.closeAriaLabel")}
          </AppButton>
        </div>

        <div className="flex max-h-[70vh] w-full flex-col items-start gap-6 overflow-y-auto p-6">
          {items.map((item) => {
            const draft = drafts[item.id];
            if (!draft) return null;
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className={cn(
                  "flex w-full flex-col items-start rounded-xl border border-border-default p-4 transition-colors duration-300",
                  isExpanded ? "bg-bg-secondary" : "bg-bg-primary"
                )}
              >
                <div className="flex w-full items-center gap-3">
                  <AppImage src={item.image} alt={item.title} className="size-12 shrink-0 rounded-sm object-cover" />
                  <div className="flex flex-1 flex-col items-start gap-2">
                    <span className="text-sm font-medium text-text-primary">{item.title}</span>
                    {(item.meta || item.badge) && (
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span className="rounded-lg bg-bg-brand-subtle px-2 py-1 text-sm text-text-brand">
                            {item.badge}
                          </span>
                        )}
                        {item.meta && <span className="text-sm text-text-primary">{item.meta}</span>}
                      </div>
                    )}
                  </div>
                  <AppButton
                    variant={isExpanded ? "secondary" : "link"}
                    size="sm"
                    iconOnly
                    leftIcon={isExpanded ? ChevronUpIcon : ChevronDownIcon}
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    aria-label={item.title}
                  >
                    {item.title}
                  </AppButton>
                </div>

                <div
                  className={cn(
                    "grid w-full transition-all duration-300 ease-in-out",
                    isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="flex flex-col items-start gap-4 overflow-hidden">
                    <div className={cn("dashed-divider", isExpanded ? "mt-4" : "mt-0")} />

                    <div className="flex w-full items-center gap-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => updateDraft(item.id, { rating: star })}
                          className="flex size-14 items-center justify-center rounded-lg border border-border-default bg-bg-primary p-3"
                          aria-label={t("bookings.detail.rateModal.starAriaLabel", { count: star })}
                        >
                          <StarIcon
                            className={cn("size-5", star <= draft.rating ? "text-icon-warning" : "text-icon-primary")}
                          />
                        </button>
                      ))}
                    </div>

                    <div className="flex w-full flex-col items-start gap-2">
                      <span className="text-sm text-form-field-label">
                        {t("bookings.detail.rateModal.reviewLabel")}
                      </span>
                      <textarea
                        value={draft.review}
                        onChange={(event) => updateDraft(item.id, { review: event.target.value })}
                        placeholder={t("bookings.detail.rateModal.reviewPlaceholder")}
                        className="h-32 w-full resize-none rounded-sm border border-form-field-border bg-bg-primary px-2 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary"
                      />
                    </div>

                    <div className="flex w-full flex-col items-start gap-2">
                      <span className="text-sm text-text-primary">{t("bookings.detail.rateModal.addPhotos")}</span>
                      <div className="flex w-full flex-col items-start gap-4">
                        <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-border-default bg-bg-primary p-4">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => handleAddPhotos(item.id, event.target.files)}
                          />
                          <span className="flex size-10 items-center justify-center rounded-lg bg-bg-secondary p-2">
                            <PlusIcon className="size-6 text-icon-primary" />
                          </span>
                          <span className="text-sm text-text-primary">
                            {t("bookings.detail.rateModal.selectPhotosToUpload")}
                          </span>
                        </label>

                        {(draft.existingImages.length > 0 || draft.newPreviews.length > 0) && (
                          <div className="flex w-full flex-wrap items-center gap-2.5">
                            {draft.existingImages.map((image) => (
                              <div key={image} className="relative flex items-center justify-start">
                                <AppImage src={image} alt={item.title} className="size-12 rounded-lg object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeExistingImage(item.id, image)}
                                  aria-label={t("bookings.detail.rateModal.removePhotoAriaLabel")}
                                  className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-2xl bg-bg-error p-0.5"
                                >
                                  <TrashIcon className="size-2.5 text-icon-inverse" />
                                </button>
                              </div>
                            ))}
                            {draft.newPreviews.map((preview, index) => (
                              <div key={preview} className="relative flex items-center justify-start">
                                <AppImage src={preview} alt={item.title} className="size-12 rounded-lg object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeNewImage(item.id, index)}
                                  aria-label={t("bookings.detail.rateModal.removePhotoAriaLabel")}
                                  className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-2xl bg-bg-error p-0.5"
                                >
                                  <TrashIcon className="size-2.5 text-icon-inverse" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex w-full items-center gap-6 border-t border-border-default px-6 py-4">
          <AppButton
            variant="primary"
            size="md"
            className="w-full"
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
          >
            {submitting ? t("bookings.detail.rateModal.submitting") : t("bookings.detail.rateModal.submit")}
          </AppButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
