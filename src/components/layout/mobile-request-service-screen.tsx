"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { format, parse } from "date-fns";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { AppButton } from "@/components/ui/app-button";
import { AppImage } from "@/components/ui/app-image";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { TimePickerField } from "@/components/ui/time-picker-field";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ServiceIcon,
  PickDateTimeIcon,
  CheckIcon,
  ImageAttachmentIcon,
  DocumentAttachmentIcon,
  TrashIcon,
  CloseIcon,
} from "@/components/icons/icons";
import { Pencil, Play } from "lucide-react";
import { allCategoriesHierarchicalApi, makeCustomJobRequestApi } from "@/api/apiRoutes";
import {
  toCategoryTreeNode,
  type CategoryHierarchicalApi,
  type CategoryTreeNode,
} from "@/lib/categories-tree-api";
import { extractErrorMessage } from "@/lib/checkout/checkout-types";
import { localizePath } from "@/lib/i18n/locale-path";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useCurrencySymbol } from "@/lib/show-price";
import { useCustomJobFileLimits } from "@/lib/use-custom-job-settings";
import { sanitizeDecimalInput } from "@/lib/helpers";
import { useScrollLock } from "@/lib/use-scroll-lock";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

interface FileDraft {
  file: File;
  preview: string;
}

function emptyState() {
  return {
    categoryPath: [] as CategoryTreeNode[],
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

/** Mobile-only full-screen counterpart to request-service-modal.tsx's desktop
 * Dialog. Same two logical steps, but Step 1 is its own full-screen
 * category drill-down (leaf categories auto-advance to Step 2), and Step 2
 * bundles everything else — title/description/budget/duration/attachments —
 * onto one scrollable screen instead of the desktop's two-screen split. */
export function MobileRequestServiceScreen({
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

  const [step, setStep] = useState<"category" | "details">("category");
  const [draft, setDraft] = useState(emptyState);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [browsePath, setBrowsePath] = useState<CategoryTreeNode[]>([]);
  const [activeUploadType, setActiveUploadType] = useState<"images" | "videos" | "files">("images");
  const [galleryOpen, setGalleryOpen] = useState(false);

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    setStep("category");
    setDraft(emptyState());
    setBrowsePath([]);
  }, [open]);

  useEffect(() => {
    if (!open || categories.length > 0) return;
    setCategoriesLoading(true);
    allCategoriesHierarchicalApi({}).then((response) => {
      const list: CategoryHierarchicalApi[] = response?.error ? [] : (response?.data ?? []);
      setCategories(list.map(toCategoryTreeNode));
      setCategoriesLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch once per screen lifetime, not on every categories.length change
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

  const attachmentZones = [
    {
      key: "images" as const,
      icon: ImageAttachmentIcon,
      allowed: fileLimits.allowImage,
      accept: "image/*",
      labelKey: "addImages",
      hintKey: "addImagesHint",
      limit: fileLimits.imageMb,
    },
    {
      key: "videos" as const,
      icon: DocumentAttachmentIcon,
      allowed: fileLimits.allowVideo,
      accept: "video/*",
      labelKey: "addVideos",
      hintKey: "addVideosHint",
      limit: fileLimits.videoMb,
    },
    {
      key: "files" as const,
      icon: DocumentAttachmentIcon,
      allowed: fileLimits.allowDocument,
      accept: ".pdf,.doc,.docx",
      labelKey: "addFiles",
      hintKey: "addFilesHint",
      limit: fileLimits.otherMb,
    },
  ].filter((zone) => zone.allowed);
  const activeZone = attachmentZones.find((zone) => zone.key === activeUploadType) ?? attachmentZones[0];

  const MAX_VISIBLE_IMAGES = 4;
  const visibleImages = draft.images.slice(0, MAX_VISIBLE_IMAGES);
  const overflowImageCount = draft.images.length - visibleImages.length;

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const nowStr = format(new Date(), "HH:mm");

  const priceError =
    draft.minPrice !== "" && draft.maxPrice !== "" && Number(draft.maxPrice) <= Number(draft.minPrice)
      ? t("requestServiceModal.priceRangeError")
      : null;

  const selectedCategory = draft.categoryPath.length > 0 ? draft.categoryPath[draft.categoryPath.length - 1] : null;
  const canSubmit =
    selectedCategory !== null &&
    draft.title.trim() !== "" &&
    draft.description.trim() !== "" &&
    priceError === null &&
    draft.startDate !== "" &&
    draft.startTime !== "";

  const handleClose = (next: boolean) => {
    if (!next) setSubmitted(false);
    onOpenChange(next);
  };

  const currentLevel = browsePath.length > 0 ? (browsePath[browsePath.length - 1].children ?? []) : categories;

  // setTimeout defers the DOM swap past the click's pointerup, avoiding a
  // benign "releasePointerCapture: no active pointer" dev-console error that
  // fires when the clicked button is removed before the browser finishes
  // releasing the touch/click pointer capture it implicitly took.
  const selectNode = (node: CategoryTreeNode) => {
    setTimeout(() => {
      update({ categoryPath: [...browsePath, node] });
      setBrowsePath([]);
      setStep("details");
    }, 0);
  };

  const drillInto = (node: CategoryTreeNode) => setTimeout(() => setBrowsePath((prev) => [...prev, node]), 0);

  const handleEditCategory = () => {
    setBrowsePath([]);
    setStep("category");
  };

  const [createdRequestId, setCreatedRequestId] = useState<string | number | null>(null);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const response = await makeCustomJobRequestApi({
        category_id: selectedCategory?.id,
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
      <div className="fixed inset-0 z-60 flex flex-col items-center justify-between bg-bg-secondary p-4 py-6 xl:hidden">
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-full bg-bg-success">
            <CheckIcon className="size-8 text-icon-inverse" />
          </span>
          <div className="flex w-full flex-col items-center gap-2 p-2">
            <span className="w-full text-center text-2xl font-bold text-text-primary">
              {t("requestServiceModal.successTitle")}
            </span>
            <span className="w-full text-center text-sm text-text-secondary">
              {t("requestServiceModal.successDescription")}
            </span>
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-3">
          <AppButton
            variant="primary"
            size="md"
            className="w-full"
            onClick={() => {
              handleClose(false);
              router.push(
                localizePath(
                  createdRequestId ? `/my-service-request-details/${createdRequestId}` : "/my-services-requests",
                  lang,
                  defaultLocale
                )
              );
            }}
          >
            {t("requestServiceModal.viewRequest")}
          </AppButton>
          <AppButton
            variant="link"
            size="sm"
            className="w-full"
            onClick={() => {
              handleClose(false);
              router.push(localizePath("/", lang, defaultLocale));
            }}
          >
            {t("mobileRequestServiceScreen.backToHome")}
          </AppButton>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-0 z-60 flex flex-col items-start overflow-hidden bg-bg-secondary xl:hidden"
        >
          <div className="flex w-full shrink-0 items-center gap-2 bg-bg-primary px-4 py-2">
            <button
              type="button"
              onClick={() =>
                step === "details" ? (setBrowsePath([]), setStep("category")) : handleClose(false)
              }
              aria-label={t("requestServiceModal.back")}
              className="flex items-center justify-center rounded-3xl p-2"
            >
              <ArrowLeftIcon className="size-6 text-icon-primary rtl:rotate-180" />
            </button>
            <span className="flex-1 text-base font-medium text-text-primary">
              {t("mobileRequestServiceScreen.title")}
            </span>
          </div>

          <div className="no-scrollbar flex w-full shrink-0 items-center gap-3.5 overflow-x-auto bg-bg-primary px-4 pb-4 pt-2 shadow-[0px_8px_16px_0px_rgba(0,0,0,0.04)]">
            <div className="flex shrink-0 items-center gap-3">
              <span
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-3xl p-2",
                  step === "details" ? "bg-bg-success-subtle" : "border border-border-brand bg-bg-brand-subtle"
                )}
              >
                {step === "details" ? (
                  <CheckIcon className="size-4 text-icon-success" />
                ) : (
                  <ServiceIcon className="size-4 text-icon-brand" />
                )}
              </span>
              <div className="flex shrink-0 flex-col items-start gap-1">
                <span
                  className={cn(
                    "whitespace-nowrap text-xs",
                    step === "category" ? "text-text-brand" : "text-text-primary"
                  )}
                >
                  {t("requestServiceModal.stepLabel", { count: 1 })}
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap text-xs font-medium",
                    step === "category" ? "text-text-brand" : "text-text-primary"
                  )}
                >
                  {t("mobileRequestServiceScreen.stepCategories")}
                </span>
              </div>
              <div className="h-0 w-16 shrink-0 border-t border-border-default" />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-3xl p-2",
                  step === "details" ? "bg-bg-brand-subtle" : "bg-bg-secondary"
                )}
              >
                <PickDateTimeIcon
                  className={cn("size-4", step === "details" ? "text-icon-brand" : "text-icon-primary")}
                />
              </span>
              <div className="flex shrink-0 flex-col items-start gap-1">
                <span
                  className={cn(
                    "whitespace-nowrap text-xs",
                    step === "details" ? "text-text-brand" : "text-text-secondary"
                  )}
                >
                  {t("requestServiceModal.stepLabel", { count: 2 })}
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap text-xs font-medium",
                    step === "details" ? "text-text-brand" : "text-text-primary"
                  )}
                >
                  {t("mobileRequestServiceScreen.stepDetails")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-1 flex-col items-start overflow-y-auto">
          {step === "category" ? (
            <div className="flex w-full flex-col items-start gap-4 bg-bg-primary p-4">
              {browsePath.length > 0 ? (
                <div className="flex w-full items-center gap-1 rounded-lg bg-bg-secondary p-2">
                  {browsePath.map((node, index) => (
                    <span key={node.id} className="flex items-center gap-1">
                      {index > 0 && <ChevronRightIcon className="size-4 text-icon-primary rtl:rotate-180" />}
                      <button
                        type="button"
                        onClick={() => setBrowsePath((prev) => prev.slice(0, index + 1))}
                        className="line-clamp-1 text-sm font-semibold text-text-primary underline"
                      >
                        {node.name}
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-base font-medium text-text-primary">
                  {t("mobileRequestServiceScreen.allCategories")}
                </span>
              )}

              {categoriesLoading ? (
                <div className="flex w-full flex-col items-start gap-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-8 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                currentLevel.map((node, index) => {
                  const hasChildren = Boolean(node.children?.length);
                  return (
                    <div key={node.id} className="flex w-full flex-col items-start gap-4">
                      <div className="flex w-full items-center gap-2 rounded-xl">
                        <button
                          type="button"
                          onClick={() => selectNode(node)}
                          className="flex flex-1 items-center gap-3 p-1"
                        >
                          <AppImage src={node.image} alt="" className="size-8 shrink-0 rounded-full object-cover" />
                          <span className="line-clamp-1 flex-1 text-left text-base font-medium text-text-primary">
                            {node.name}
                          </span>
                        </button>
                        {hasChildren && (
                          <button
                            type="button"
                            onClick={() => drillInto(node)}
                            aria-label={node.name}
                            className="flex shrink-0 items-center justify-center p-1"
                          >
                            <ChevronRightIcon className="size-6 text-icon-primary rtl:rotate-180" />
                          </button>
                        )}
                      </div>
                      {index < currentLevel.length - 1 && <div className="dashed-divider" />}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="flex w-full flex-col items-start gap-4 p-4">
              <div className="flex w-full flex-col items-start gap-2 rounded-lg bg-bg-primary p-3">
                <span className="text-sm font-semibold text-text-primary">
                  {t("mobileRequestServiceScreen.selectedCategories")}
                </span>
                <div className="dashed-divider" />
                <div className="flex w-full items-center gap-2">
                  <span className="flex flex-1 flex-wrap items-center gap-1 text-sm text-text-primary">
                    {draft.categoryPath.map((node, index) => (
                      <span key={node.id} className="flex items-center gap-1">
                        {index > 0 && <ChevronRightIcon className="size-4 text-icon-primary rtl:rotate-180" />}
                        {node.name}
                      </span>
                    ))}
                  </span>
                  <button
                    type="button"
                    onClick={handleEditCategory}
                    aria-label={t("mobileRequestServiceScreen.editCategories")}
                    className="flex items-center justify-center rounded-3xl bg-bg-secondary p-2"
                  >
                    <Pencil className="size-5 text-icon-primary" />
                  </button>
                </div>
              </div>

              <div className="flex w-full flex-col items-start gap-2 rounded-xl bg-bg-primary p-3">
                <span className="text-sm font-semibold text-text-primary">
                  {t("mobileRequestServiceScreen.serviceDescription")}
                </span>
                <div className="dashed-divider" />
                <div className="flex w-full flex-col items-start gap-1">
                  <span className="text-xs text-form-field-label">
                    {t("mobileRequestServiceScreen.serviceTitleLabel")}
                  </span>
                  <input
                    value={draft.title}
                    onChange={(event) => update({ title: event.target.value })}
                    placeholder={t("mobileRequestServiceScreen.serviceTitlePlaceholder")}
                    className="w-full rounded-lg border border-form-field-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-form-field-placeholder"
                  />
                </div>
                <div className="flex w-full flex-col items-start gap-1">
                  <span className="text-xs text-form-field-label">
                    {t("requestServiceModal.descriptionLabel")}
                  </span>
                  <textarea
                    value={draft.description}
                    onChange={(event) => update({ description: event.target.value })}
                    placeholder={t("mobileRequestServiceScreen.descriptionPlaceholder")}
                    className="h-20 w-full resize-none rounded-lg border border-form-field-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-form-field-placeholder"
                  />
                </div>
              </div>

              <div className="flex w-full flex-col items-start gap-2 rounded-xl bg-bg-primary p-3">
                <span className="text-sm font-semibold text-text-primary">
                  {t("mobileRequestServiceScreen.preferredBudget")}
                </span>
                <div className="dashed-divider" />
                <div className="flex w-full items-center gap-2">
                  <div className="flex flex-1 flex-col items-start gap-1">
                    <span className="text-xs text-form-field-label">{t("mobileRequestServiceScreen.minLabel")}</span>
                    <div className="flex w-full items-center gap-2 rounded-lg border border-form-field-border bg-bg-secondary px-3 py-2">
                      <span className="text-sm text-form-field-placeholder">{currencySymbol}</span>
                      <input
                        value={draft.minPrice}
                        onChange={(event) => update({ minPrice: sanitizeDecimalInput(event.target.value) })}
                        inputMode="decimal"
                        className="w-full bg-transparent text-sm text-text-primary outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col items-start gap-1">
                    <span className="text-xs text-form-field-label">{t("mobileRequestServiceScreen.maxLabel")}</span>
                    <div
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg border bg-bg-secondary px-3 py-2",
                        priceError ? "border-border-error" : "border-form-field-border"
                      )}
                    >
                      <span className="text-sm text-form-field-placeholder">{currencySymbol}</span>
                      <input
                        value={draft.maxPrice}
                        onChange={(event) => update({ maxPrice: sanitizeDecimalInput(event.target.value) })}
                        inputMode="decimal"
                        className="w-full bg-transparent text-sm text-text-primary outline-none"
                      />
                    </div>
                  </div>
                </div>
                {priceError && <span className="text-xs text-text-error">{priceError}</span>}
              </div>

              <div className="flex w-full flex-col items-start gap-2 rounded-xl bg-bg-primary p-3">
                <span className="text-sm font-semibold text-text-primary">
                  {t("mobileRequestServiceScreen.requestDuration")}
                </span>
                <div className="dashed-divider" />
                <div className="flex w-full flex-col items-start gap-2">
                  <div className="flex w-full flex-col items-start gap-1">
                    <span className="text-xs text-form-field-label">
                      {t("mobileRequestServiceScreen.startAtLabel")}
                    </span>
                    <div className="flex w-full flex-col gap-2">
                      <DatePickerField
                        value={draft.startDate}
                        onChange={(value) => update({ startDate: value })}
                        disabledBefore={new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                      <TimePickerField
                        value={draft.startTime}
                        onChange={(value) => update({ startTime: value })}
                        minTime={draft.startDate === todayStr ? nowStr : undefined}
                      />
                    </div>
                  </div>
                  <div className="flex w-full flex-col items-start gap-1">
                    <span className="text-xs text-form-field-label">
                      {t("mobileRequestServiceScreen.endAtLabel")}
                    </span>
                    <div className="flex w-full flex-col gap-2">
                      <DatePickerField
                        value={draft.endDate}
                        onChange={(value) => update({ endDate: value })}
                        disabledBefore={
                          draft.startDate ? parse(draft.startDate, "yyyy-MM-dd", new Date()) : undefined
                        }
                      />
                      <TimePickerField
                        value={draft.endTime}
                        onChange={(value) => update({ endTime: value })}
                        minTime={draft.endDate === todayStr ? nowStr : undefined}
                      />
                    </div>
                  </div>
                </div>
                <span className="text-xs text-text-tertiary">
                  {t("mobileRequestServiceScreen.requestDurationHint")}
                </span>
              </div>

              <div className="flex w-full flex-col items-start gap-2 rounded-xl bg-bg-primary p-3">
                <div className="flex w-full items-center gap-2">
                  <span className="flex-1 text-sm font-semibold text-text-primary">
                    {t("mobileRequestServiceScreen.attachReferenceFile")}
                  </span>
                  {attachmentZones.length > 1 && activeZone && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="flex shrink-0 items-center gap-1 rounded-lg border border-border-default bg-bg-secondary px-2 py-1.5 text-xs text-text-primary"
                        >
                          {t(`requestServiceModal.${activeZone.labelKey}`)}
                          <ChevronDownIcon className="size-4 text-icon-primary" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="z-70">
                        {attachmentZones.map((zone) => (
                          <DropdownMenuItem key={zone.key} onSelect={() => setActiveUploadType(zone.key)}>
                            {t(`requestServiceModal.${zone.labelKey}`)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <div className="dashed-divider" />
                <div className="flex w-full flex-col items-start gap-4">
                  {activeZone && (
                    <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-border-default p-3">
                      <input
                        type="file"
                        multiple
                        accept={activeZone.accept}
                        className="hidden"
                        onChange={(event) => addFiles(activeZone.key, event.target.files)}
                      />
                      <span className="flex size-10 items-center justify-center rounded-3xl bg-bg-secondary p-2">
                        <activeZone.icon className="size-6 text-icon-primary" />
                      </span>
                      <span className="text-xs font-medium text-text-primary">
                        {t(`requestServiceModal.${activeZone.labelKey}`)}
                      </span>
                      <span className="text-center text-xs text-text-secondary">
                        {t(`requestServiceModal.${activeZone.hintKey}`, { limit: fileLimitMbFor(activeZone.key) })}
                      </span>
                    </label>
                  )}

                  {draft.images.length > 0 && (
                    <div className="flex w-full flex-wrap items-start gap-3">
                      {visibleImages.map((image, index) => (
                        <button
                          key={image.preview}
                          type="button"
                          onClick={() => setGalleryOpen(true)}
                          className="relative flex size-12 items-center justify-start rounded-lg"
                        >
                          <AppImage
                            src={image.preview}
                            alt={image.file.name}
                            className="size-12 rounded-lg object-cover"
                          />
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(event) => {
                              event.stopPropagation();
                              removeFile("images", index);
                            }}
                            onKeyDown={(event) => {
                              if (event.key !== "Enter" && event.key !== " ") return;
                              event.preventDefault();
                              event.stopPropagation();
                              removeFile("images", index);
                            }}
                            aria-label={t("requestServiceModal.removeFileAriaLabel")}
                            className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-2xl bg-bg-error p-0.5"
                          >
                            <TrashIcon className="size-2.5 text-icon-inverse" />
                          </span>
                        </button>
                      ))}
                      {overflowImageCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setGalleryOpen(true)}
                          className="flex size-12 items-center justify-center rounded-lg bg-black/60 text-sm font-semibold text-text-inverse-light"
                        >
                          +{overflowImageCount}
                        </button>
                      )}
                    </div>
                  )}

                  {(draft.videos.length > 0 || draft.files.length > 0) && (
                    <div className="flex w-full flex-col items-start gap-2">
                      {[...draft.videos, ...draft.files].map((item, index) => {
                        const isVideo = index < draft.videos.length;
                        return (
                          <div
                            key={item.preview}
                            className="flex w-full items-center gap-2 rounded-lg bg-bg-secondary p-2"
                          >
                            <span className="flex items-center justify-center rounded-lg bg-bg-primary p-1">
                              {isVideo ? (
                                <Play className="size-4 text-icon-primary" />
                              ) : (
                                <DocumentAttachmentIcon className="size-4 text-icon-primary" />
                              )}
                            </span>
                            <span className="flex-1 truncate text-xs text-text-primary">{item.file.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                removeFile(isVideo ? "videos" : "files", isVideo ? index : index - draft.videos.length)
                              }
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
              </div>
            </div>
          )}
          </div>

          {step === "details" && (
            <div className="flex w-full shrink-0 flex-col items-center gap-2 bg-bg-primary p-4 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)]">
              <AppButton
                variant="primary"
                size="md"
                className="w-full"
                disabled={!canSubmit || submitting}
                onClick={handleSubmit}
              >
                {submitting ? t("requestServiceModal.submitting") : t("requestServiceModal.submitRequest")}
              </AppButton>
            </div>
          )}

          <Sheet open={galleryOpen} onOpenChange={setGalleryOpen}>
            <SheetContent
              side="bottom"
              showCloseButton={false}
              className="z-70 max-h-[80vh] w-full gap-4 overflow-y-auto rounded-t-2xl p-4 xl:hidden"
            >
              <div className="mx-auto h-1 w-10 shrink-0 rounded-3xl bg-bg-inverse/20" />
              <SheetTitle className="w-full text-center text-base font-medium text-text-primary">
                {t("requestServiceModal.addImages")}
              </SheetTitle>
              <div className="h-px w-full bg-bg-inverse/10" />
              <div className="grid w-full grid-cols-4 gap-3">
                {draft.images.map((image, index) => (
                  <div key={image.preview} className="relative flex items-center justify-start">
                    <AppImage
                      src={image.preview}
                      alt={image.file.name}
                      className="size-20 rounded-2xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile("images", index)}
                      aria-label={t("requestServiceModal.removeFileAriaLabel")}
                      className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-2xl bg-bg-error p-0.5"
                    >
                      <TrashIcon className="size-3 text-icon-inverse" />
                    </button>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
