"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { format, parse } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AppButton } from "@/components/ui/app-button";
import { AppImage } from "@/components/ui/app-image";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { TimePickerField } from "@/components/ui/time-picker-field";
import { ActionSuccessModal } from "@/components/bookings/action-success-modal";
import { CategoryPickerField } from "@/components/layout/category-picker-field";
import { Play } from "lucide-react";
import {
  CloseIcon,
  ServiceIcon,
  PickDateTimeIcon,
  CheckIcon,
  ImageAttachmentIcon,
  DocumentAttachmentIcon,
  TrashIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@/components/icons/icons";
import { makeCustomJobRequestApi } from "@/api/apiRoutes";
import { extractErrorMessage } from "@/lib/checkout/checkout-types";
import { localizePath } from "@/lib/i18n/locale-path";
import type { CategoryTreeNode } from "@/lib/categories-tree-api";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useCurrencySymbol } from "@/lib/show-price";
import { useCustomJobFileLimits } from "@/lib/use-custom-job-settings";
import { sanitizeDecimalInput } from "@/lib/helpers";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

interface FileDraft {
  file: File;
  preview: string;
}

function emptyState() {
  return {
    step: 1 as 1 | 2,
    category: null as CategoryTreeNode | null,
    title: "",
    description: "",
    minPrice: "",
    maxPrice: "",
    images: [] as FileDraft[],
    videos: [] as FileDraft[],
    files: [] as FileDraft[],
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  };
}

export function RequestServiceModal({
  open,
  onOpenChange,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
}) {
  const { t, lang, defaultLocale } = useTranslation();
  const router = useRouter();
  const currencySymbol = useCurrencySymbol();
  const fileLimits = useCustomJobFileLimits();
  const lat = useAppSelector((state) => state.location.lat);
  const lng = useAppSelector((state) => state.location.lng);
  const [draft, setDraft] = useState(emptyState);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(emptyState());
  }, [open]);

  const update = (patch: Partial<ReturnType<typeof emptyState>>) => setDraft((prev) => ({ ...prev, ...patch }));

  const fileLimitMbFor = (key: "images" | "videos" | "files") =>
    key === "images" ? fileLimits.imageMb : key === "videos" ? fileLimits.videoMb : fileLimits.otherMb;

  const addFiles = (key: "images" | "videos" | "files", fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const totalFiles = draft.images.length + draft.videos.length + draft.files.length;
    const remaining = fileLimits.maxFiles - totalFiles;
    if (remaining <= 0) {
      toast.error(t("requestServiceModal.maxFilesReached", { count: fileLimits.maxFiles }));
      return;
    }

    const limitMb = fileLimitMbFor(key);
    const picked = Array.from(fileList).slice(0, remaining);
    const accepted: FileDraft[] = [];
    for (const file of picked) {
      if (file.size > limitMb * 1024 * 1024) {
        toast.error(t("requestServiceModal.fileTooLarge", { name: file.name, limit: limitMb }));
        continue;
      }
      accepted.push({ file, preview: URL.createObjectURL(file) });
    }
    if (accepted.length === 0) return;
    setDraft((prev) => ({ ...prev, [key]: [...prev[key], ...accepted] }));
  };

  const removeFile = (key: "images" | "videos" | "files", index: number) => {
    setDraft((prev) => {
      URL.revokeObjectURL(prev[key][index].preview);
      return { ...prev, [key]: prev[key].filter((_, i) => i !== index) };
    });
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const nowStr = format(new Date(), "HH:mm");

  const priceError =
    draft.minPrice !== "" && draft.maxPrice !== "" && Number(draft.maxPrice) <= Number(draft.minPrice)
      ? t("requestServiceModal.priceRangeError")
      : null;

  const canContinue =
    draft.category !== null &&
    draft.title.trim() !== "" &&
    draft.description.trim() !== "" &&
    priceError === null;
  const canSubmit = draft.startDate !== "" && draft.startTime !== "";

  const handleClose = (next: boolean) => {
    if (!next) setSubmitted(false);
    onOpenChange(next);
  };

  const [createdRequestId, setCreatedRequestId] = useState<string | number | null>(null);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const response = await makeCustomJobRequestApi({
        category_id: draft.category?.id,
        service_title: draft.title,
        service_short_description: draft.description,
        min_price: draft.minPrice || undefined,
        max_price: draft.maxPrice || undefined,
        requested_start_date: draft.startDate,
        requested_start_time: draft.startTime,
        requested_end_date: draft.endDate || undefined,
        requested_end_time: draft.endTime || undefined,
        latitude: lat ?? undefined,
        longitude: lng ?? undefined,
        files: [...draft.images, ...draft.videos, ...draft.files].map((item) => item.file),
      });
      if (response?.error) throw new Error(response?.message);
      setCreatedRequestId(response?.data?.id ?? null);
      setSubmitted(true);
      onSubmitted?.();
    } catch (error) {
      toast.error(extractErrorMessage(error, t("requestServiceModal.submitFailed")));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <ActionSuccessModal
        open
        onOpenChange={handleClose}
        title={t("requestServiceModal.successTitle")}
        description={t("requestServiceModal.successDescription")}
        confirmLabel={t("requestServiceModal.viewRequest")}
        onConfirm={() => {
          handleClose(false);
          router.push(
            localizePath(
              createdRequestId ? `/my-service-request-details/${createdRequestId}` : "/my-services-requests",
              lang,
              defaultLocale
            )
          );
        }}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[85vh] w-[1000px] max-w-[calc(100%-2rem)] flex-col items-center gap-0 overflow-hidden rounded-xl bg-bg-primary p-0 ring-1 ring-border-default sm:max-w-[calc(100%-2rem)] lg:max-w-[1000px]"
      >
        <div className="flex w-full items-center gap-6 border-b border-border-default px-6 py-4">
          <DialogTitle className="flex-1 text-xl font-medium text-text-primary">
            {t("requestServiceModal.title")}
          </DialogTitle>
          <AppButton
            variant="secondary-outline"
            size="md"
            iconOnly
            leftIcon={CloseIcon}
            onClick={() => handleClose(false)}
            aria-label={t("requestServiceModal.closeAriaLabel")}
          >
            {t("requestServiceModal.closeAriaLabel")}
          </AppButton>
        </div>

        <div className="flex w-full shrink-0 flex-col items-start px-6 pt-6">
          <div className="flex h-20 w-full items-center gap-6 rounded-xl border border-border-default bg-bg-primary p-4">
            {([1, 2] as const).map((stepNumber) => {
              const isActive = draft.step === stepNumber;
              const isCompleted = draft.step > stepNumber;
              return (
                <div key={stepNumber} className="flex flex-1 items-center gap-3">
                  <span
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-3xl p-2",
                      isCompleted ? "bg-bg-success" : isActive ? "bg-bg-inverse" : "bg-bg-secondary"
                    )}
                  >
                    {isCompleted ? (
                      <CheckIcon className="size-6 text-icon-inverse" />
                    ) : stepNumber === 1 ? (
                      <ServiceIcon className={cn("size-6", isActive ? "text-icon-inverse" : "text-icon-primary")} />
                    ) : (
                      <PickDateTimeIcon
                        className={cn("size-6", isActive ? "text-icon-inverse" : "text-icon-primary")}
                      />
                    )}
                  </span>
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-base text-text-secondary">
                      {t("requestServiceModal.stepLabel", { count: stepNumber })}
                    </span>
                    <span className="text-base font-medium text-text-primary">
                      {t(
                        stepNumber === 1
                          ? "requestServiceModal.step1Title"
                          : "requestServiceModal.step2Title"
                      )}
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-border-default" />
                </div>
              );
            })}
          </div>
        </div>

        <div className="thin-scrollbar flex w-full flex-1 flex-col items-center gap-6 overflow-y-auto px-6 py-6">
          <div className="flex w-full flex-col items-center gap-6 rounded-xl border border-border-default bg-bg-primary p-4">
            {draft.step === 1 ? (
              <div className="flex w-full flex-col items-start gap-4">
                <div className="flex w-full flex-col items-start gap-2">
                  <span className="text-base text-form-field-label">{t("requestServiceModal.categoryLabel")}</span>
                  <CategoryPickerField value={draft.category} onChange={(category) => update({ category })} />
                </div>

                <div className="flex w-full flex-col items-start gap-2">
                  <span className="text-base text-form-field-label">{t("requestServiceModal.titleLabel")}</span>
                  <input
                    value={draft.title}
                    onChange={(event) => update({ title: event.target.value })}
                    placeholder={t("requestServiceModal.titlePlaceholder")}
                    className="w-full rounded-sm border border-form-field-border bg-bg-secondary px-4 py-2 text-base text-text-primary outline-none placeholder:text-form-field-placeholder"
                  />
                </div>

                <div className="flex w-full flex-col items-start gap-2">
                  <span className="text-base text-form-field-label">
                    {t("requestServiceModal.descriptionLabel")}
                  </span>
                  <textarea
                    value={draft.description}
                    onChange={(event) => update({ description: event.target.value })}
                    placeholder={t("requestServiceModal.descriptionPlaceholder")}
                    className="h-24 w-full resize-none rounded-sm border border-form-field-border bg-bg-secondary px-4 py-2 text-base text-text-primary outline-none placeholder:text-form-field-placeholder"
                  />
                </div>

                <div className="flex w-full items-start gap-4">
                  <div className="flex flex-1 flex-col items-start gap-2">
                    <span className="text-base text-form-field-label">
                      {t("requestServiceModal.minPriceLabel")}
                    </span>
                    <div className="flex w-full items-center gap-2 rounded-sm border border-border-default bg-bg-secondary px-4 py-2">
                      <span className="text-base text-form-field-placeholder">{currencySymbol}</span>
                      <div className="h-5 w-px bg-border-default" />
                      <input
                        value={draft.minPrice}
                        onChange={(event) => update({ minPrice: sanitizeDecimalInput(event.target.value) })}
                        placeholder={t("requestServiceModal.pricePlaceholder", { currency: currencySymbol })}
                        inputMode="decimal"
                        className="w-full bg-transparent text-base text-text-primary outline-none placeholder:text-form-field-placeholder"
                      />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col items-start gap-2">
                    <span className="text-base text-form-field-label">
                      {t("requestServiceModal.maxPriceLabel")}
                    </span>
                    <div
                      className={cn(
                        "flex w-full items-center gap-2 rounded-sm border bg-bg-secondary px-4 py-2",
                        priceError ? "border-border-error" : "border-border-default"
                      )}
                    >
                      <span className="text-base text-form-field-placeholder">{currencySymbol}</span>
                      <div className="h-5 w-px bg-border-default" />
                      <input
                        value={draft.maxPrice}
                        onChange={(event) => update({ maxPrice: sanitizeDecimalInput(event.target.value) })}
                        placeholder={t("requestServiceModal.pricePlaceholder", { currency: currencySymbol })}
                        inputMode="decimal"
                        className="w-full bg-transparent text-base text-text-primary outline-none placeholder:text-form-field-placeholder"
                      />
                    </div>
                  </div>
                </div>
                {priceError && <span className="text-sm text-text-error">{priceError}</span>}
              </div>
            ) : (
              <div className="flex w-full flex-col items-start gap-6">
                <div className="flex w-full items-start gap-4">
                  <div className="flex flex-1 flex-col items-start gap-2">
                    <span className="text-base text-form-field-label">{t("requestServiceModal.startDateLabel")}</span>
                    <DatePickerField
                      value={draft.startDate}
                      onChange={(value) => update({ startDate: value })}
                      disabledBefore={new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </div>
                  <div className="flex flex-1 flex-col items-start gap-2">
                    <span className="text-base text-form-field-label">{t("requestServiceModal.startTimeLabel")}</span>
                    <TimePickerField
                      value={draft.startTime}
                      onChange={(value) => update({ startTime: value })}
                      minTime={draft.startDate === todayStr || draft.startDate === "" ? nowStr : undefined}
                    />
                  </div>
                </div>

                <div className="flex w-full items-start gap-4">
                  <div className="flex flex-1 flex-col items-start gap-2">
                    <span className="text-base text-form-field-label">{t("requestServiceModal.endDateLabel")}</span>
                    <DatePickerField
                      value={draft.endDate}
                      onChange={(value) => update({ endDate: value })}
                      disabledBefore={
                        draft.startDate
                          ? parse(draft.startDate, "yyyy-MM-dd", new Date())
                          : new Date(new Date().setHours(0, 0, 0, 0))
                      }
                    />
                  </div>
                  <div className="flex flex-1 flex-col items-start gap-2">
                    <span className="text-base text-form-field-label">{t("requestServiceModal.endTimeLabel")}</span>
                    <TimePickerField
                      value={draft.endTime}
                      onChange={(value) => update({ endTime: value })}
                      minTime={draft.endDate === todayStr || draft.endDate === "" ? nowStr : undefined}
                    />
                  </div>
                </div>

                <div className="dashed-divider" />

                <div className="flex w-full items-start gap-4">
                  {(
                    [
                      { key: "images" as const, icon: ImageAttachmentIcon, labelKey: "addImages", hintKey: "addImagesHint", accept: "image/*", allowed: fileLimits.allowImage, limit: fileLimits.imageMb },
                      { key: "videos" as const, icon: DocumentAttachmentIcon, labelKey: "addVideos", hintKey: "addVideosHint", accept: "video/*", allowed: fileLimits.allowVideo, limit: fileLimits.videoMb },
                      { key: "files" as const, icon: DocumentAttachmentIcon, labelKey: "addFiles", hintKey: "addFilesHint", accept: ".pdf,.doc,.docx", allowed: fileLimits.allowDocument, limit: fileLimits.otherMb },
                    ]
                  )
                    .filter((zone) => zone.allowed)
                    .map(({ key, icon: Icon, labelKey, hintKey, accept, limit }) => (
                    <div key={key} className="flex flex-1 flex-col items-start gap-2">
                      <span className="text-sm text-text-primary">{t(`requestServiceModal.${labelKey}`)}</span>
                      <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-border-default p-4 text-center">
                        <input
                          type="file"
                          multiple
                          accept={accept}
                          className="hidden"
                          onChange={(event) => addFiles(key, event.target.files)}
                        />
                        <span className="flex size-10 items-center justify-center rounded-lg bg-bg-secondary p-2">
                          <Icon className="size-6 text-icon-primary" />
                        </span>
                        <span className="text-xs text-text-secondary">
                          {t(`requestServiceModal.${hintKey}`, { limit: fileLimitMbFor(key) })}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>

                {draft.images.length > 0 && (
                  <div className="flex w-full flex-wrap items-center gap-2.5">
                    {draft.images.map((image, index) => (
                      <div key={image.preview} className="relative flex items-center justify-start">
                        <AppImage src={image.preview} alt={image.file.name} className="size-14 rounded-lg object-cover" />
                        <button
                          type="button"
                          onClick={() => removeFile("images", index)}
                          aria-label={t("requestServiceModal.removeFileAriaLabel")}
                          className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-2xl bg-bg-error p-0.5"
                        >
                          <TrashIcon className="size-2.5 text-icon-inverse" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {(draft.videos.length > 0 || draft.files.length > 0) && (
                  <div className="flex w-full flex-col items-start gap-2">
                    {[...draft.videos, ...draft.files].map((item, index) => {
                      const isVideo = index < draft.videos.length;
                      return (
                      <div
                        key={item.preview}
                        className="flex w-full items-center gap-2 rounded-lg border border-border-default bg-bg-primary p-2"
                      >
                        <span className="flex items-center justify-center rounded-lg bg-bg-secondary p-2">
                          {isVideo ? (
                            <Play className="size-5 text-icon-primary" />
                          ) : (
                            <DocumentAttachmentIcon className="size-5 text-icon-primary" />
                          )}
                        </span>
                        <span className="flex-1 truncate text-sm text-text-primary">{item.file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(isVideo ? "videos" : "files", isVideo ? index : index - draft.videos.length)}
                          aria-label={t("requestServiceModal.removeFileAriaLabel")}
                          className="flex items-center justify-center rounded-sm p-1 text-button-link-secondary-text"
                        >
                          <CloseIcon className="size-4" />
                        </button>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex w-full shrink-0 items-center justify-between border-t border-border-default px-6 py-4">
          {draft.step === 1 ? (
            <AppButton
              variant="secondary"
              size="md"
              rightIcon={ArrowRightIcon}
              disabled={!canContinue}
              className="ml-auto"
              onClick={() => update({ step: 2 })}
            >
              {t("requestServiceModal.continue")}
            </AppButton>
          ) : (
            <>
              <AppButton
                variant="secondary-outline"
                size="md"
                leftIcon={ArrowLeftIcon}
                onClick={() => update({ step: 1 })}
              >
                {t("requestServiceModal.back")}
              </AppButton>
              <AppButton
                variant="secondary"
                size="md"
                disabled={!canSubmit || submitting}
                onClick={handleSubmit}
              >
                {submitting ? t("requestServiceModal.submitting") : t("requestServiceModal.submitRequest")}
              </AppButton>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
