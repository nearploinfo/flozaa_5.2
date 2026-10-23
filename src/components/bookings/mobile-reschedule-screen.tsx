"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { Calendar, Clock } from "lucide-react";
import { ArrowLeftIcon, LocationPinIcon } from "@/components/icons/icons";
import { AppButton } from "@/components/ui/app-button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAvailableSlotApi } from "@/api/apiRoutes";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const TIME_INPUT_PATTERN = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$/i;

function normalizeTimeInput(value: string): string | null {
  const match = TIME_INPUT_PATTERN.exec(value.trim());
  if (!match) return null;
  const [, hour, minute, period] = match;
  return `${hour.padStart(2, "0")}:${minute} ${period.toUpperCase()}`;
}

interface AvailableSlot {
  time: string;
  is_available: number;
}

function formatSlotLabel(time24: string): string {
  return format(parse(time24, "HH:mm:ss", new Date()), "hh:mm a");
}

/** Mobile-only full-screen reschedule flow — a page takeover (header + back
 * arrow, full month calendar, manual time entry, sticky confirm bar), not a
 * bottom sheet: the desktop DateTimeModal's calendar squeezed into a Dialog
 * is unreadable on a phone, and mobile-date-time-sheet.tsx's day-strip skips
 * the current-booking summary and manual time entry this flow needs. */
export function MobileRescheduleScreen({
  open,
  onOpenChange,
  title,
  providerId,
  currentDate,
  currentTimeRangeLabel,
  address,
  selectedDate,
  selectedTime,
  lockStatus,
  lockError,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  providerId: number;
  currentDate: Date | null;
  currentTimeRangeLabel: string | null;
  address?: string | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  lockStatus: "idle" | "locking" | "locked" | "error";
  lockError: string | null;
  confirmLabel: string;
  onConfirm: (date: Date, time: string) => Promise<boolean>;
}) {
  const { t } = useTranslation();
  const today = useMemo(() => startOfDay(new Date()), []);

  const [visibleMonth, setVisibleMonth] = useState(() => selectedDate ?? today);
  const [draftDate, setDraftDate] = useState<Date | null>(selectedDate);
  const [draftTime, setDraftTime] = useState<string | null>(selectedTime);
  const [timeText, setTimeText] = useState(selectedTime ?? "");
  const [slots, setSlots] = useState<{ label: string; available: boolean }[]>([]);
  const [slotsStatus, setSlotsStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const lat = useAppSelector((state) => state.location.lat);
  const lng = useAppSelector((state) => state.location.lng);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the draft to the current selection each time the screen opens
    setVisibleMonth(selectedDate ?? today);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setDraftDate(selectedDate);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setDraftTime(selectedTime);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setTimeText(selectedTime ?? "");
  }, [open, selectedDate, selectedTime, today]);

  useEffect(() => {
    if (!open || !draftDate) return;
    setSlotsStatus("loading");
    getAvailableSlotApi({
      partner_id: providerId,
      date: format(draftDate, "yyyy-MM-dd"),
      // Same country check as checkout — without coordinates the backend
      // resolves the customer's country from their saved profile location.
      ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
    })
      .then((response) => {
        if (response?.error) throw new Error(response?.message);
        const raw: AvailableSlot[] = response?.data?.all_slots ?? [];
        setSlots(raw.map((slot) => ({ label: formatSlotLabel(slot.time), available: slot.is_available === 1 })));
        setSlotsStatus("loaded");
      })
      .catch(() => {
        setSlots([]);
        setSlotsStatus("error");
      });
  }, [open, draftDate, providerId, lat, lng]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(visibleMonth));
    const end = endOfWeek(endOfMonth(visibleMonth));
    return eachDayOfInterval({ start, end });
  }, [visibleMonth]);

  const handleConfirm = async () => {
    if (!draftDate || !draftTime) return;
    setConfirming(true);
    const success = await onConfirm(draftDate, draftTime);
    setConfirming(false);
    if (success) onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex flex-col items-start bg-bg-secondary xl:hidden"
        >
          <div className="flex w-full shrink-0 items-center gap-2 bg-bg-primary p-4 shadow-[0px_8px_16px_0px_rgba(0,0,0,0.04)]">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label={t("checkoutPage.back")}
              className="flex items-center justify-center rounded-3xl p-2"
            >
              <ArrowLeftIcon className="size-6 text-icon-primary rtl:rotate-180" />
            </button>
            <span className="text-base font-medium text-text-primary">{title}</span>
          </div>

          <div className="flex w-full flex-1 flex-col items-start gap-4 overflow-y-auto p-4">
            <div className="flex w-full flex-col items-start gap-3 rounded-xl bg-bg-primary p-4">
              <div className="flex w-full flex-col items-start gap-4">
                <div className="flex w-full items-start gap-4">
                  {currentDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="size-5 shrink-0 text-icon-primary" />
                      <span className="text-sm text-text-primary">{format(currentDate, "dd/MM/yyyy")}</span>
                    </div>
                  )}
                  {currentTimeRangeLabel && (
                    <div className="flex items-center gap-1">
                      <Clock className="size-5 shrink-0 text-icon-primary" />
                      <span className="text-sm text-text-primary">{currentTimeRangeLabel}</span>
                    </div>
                  )}
                </div>
                {address && (
                  <div className="flex items-center gap-1">
                    <LocationPinIcon className="size-5 shrink-0 text-icon-primary" />
                    <span className="text-xs font-medium text-text-primary">{address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col items-start gap-2">
              <span className="text-base font-medium text-text-primary">
                {t("checkoutPage.dateTime.sheet.selectDateForService")}
              </span>
              <div className="flex w-full flex-col items-center gap-4 rounded-xl bg-bg-primary p-3">
                <div className="flex w-full items-center justify-between">
                  <button
                    type="button"
                    aria-label={t("checkoutPage.dateTime.modal.previousMonthAriaLabel")}
                    onClick={() => setVisibleMonth((month) => subMonths(month, 1))}
                    className="flex items-center gap-1 rounded-lg border border-border-default p-2 disabled:opacity-40"
                    disabled={!isBefore(startOfMonth(today), startOfMonth(visibleMonth))}
                  >
                    <span className="text-xs text-text-primary">‹</span>
                  </button>
                  <span className="text-sm font-semibold text-text-primary">{format(visibleMonth, "MMM yyyy")}</span>
                  <button
                    type="button"
                    aria-label={t("checkoutPage.dateTime.modal.nextMonthAriaLabel")}
                    onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
                    className="flex items-center gap-1 rounded-lg border border-border-default p-2"
                  >
                    <span className="text-xs text-text-primary">›</span>
                  </button>
                </div>
                <div className="dashed-divider" />
                <div className="flex w-full flex-col items-start gap-3">
                  <div className="flex w-full items-center gap-2">
                    {WEEKDAY_KEYS.map((key) => (
                      <span key={key} className="flex-1 text-center text-xs text-text-primary">
                        {t(`checkoutPage.dateTime.modal.weekdayShort.${key}`)}
                      </span>
                    ))}
                  </div>
                  <div className="grid w-full grid-cols-7 gap-2">
                    {days.map((day) => {
                      const disabled = isBefore(day, today) || !isSameMonth(day, visibleMonth);
                      const active = draftDate && isSameDay(day, draftDate);
                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            setDraftDate(day);
                            setDraftTime(null);
                            setTimeText("");
                          }}
                          className={cn(
                            "flex items-center justify-center rounded-lg p-2 text-xs",
                            active
                              ? "border border-border-brand bg-bg-brand-subtle font-medium text-text-brand"
                              : disabled
                                ? "text-text-tertiary"
                                : "bg-bg-secondary text-text-secondary"
                          )}
                        >
                          {format(day, "d")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col items-start gap-2">
              <span className="text-base font-medium text-text-primary">
                {t("checkoutPage.dateTime.sheet.selectTimeForService")}
              </span>
              <div className="flex w-full flex-col items-start gap-3 rounded-xl bg-bg-primary p-4">
                <div className="flex w-full flex-col items-start gap-1">
                  <label htmlFor="reschedule-preferred-time" className="text-xs text-form-field-label">
                    {t("checkoutPage.dateTime.modal.timeLabel")}
                  </label>
                  <div
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border bg-bg-secondary p-3",
                      timeText && !normalizeTimeInput(timeText) ? "border-form-field-error-border" : "border-border-default"
                    )}
                  >
                    <input
                      id="reschedule-preferred-time"
                      type="text"
                      value={timeText}
                      placeholder={t("checkoutPage.dateTime.modal.timePlaceholder")}
                      onChange={(event) => {
                        const value = event.target.value;
                        setTimeText(value);
                        setDraftTime(normalizeTimeInput(value));
                      }}
                      className="w-full flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-form-field-placeholder"
                    />
                    <Clock className="size-5 shrink-0 text-icon-primary" />
                  </div>
                  <span
                    className={cn(
                      "text-xs",
                      timeText && !normalizeTimeInput(timeText) ? "text-form-field-error" : "text-text-tertiary"
                    )}
                  >
                    {t("checkoutPage.dateTime.modal.timeHelper")}
                  </span>
                </div>

                {!draftDate ? (
                  <span className="text-sm text-text-secondary">
                    {t("checkoutPage.dateTime.modal.noDateSelected")}
                  </span>
                ) : slotsStatus === "loading" ? (
                  <div className="grid w-full grid-cols-4 gap-2">
                    {Array.from({ length: 16 }).map((_, index) => (
                      <Skeleton key={index} className="h-10 w-full rounded-lg" />
                    ))}
                  </div>
                ) : slotsStatus === "loaded" && slots.length === 0 ? (
                  <span className="text-sm text-text-secondary">{t("checkoutPage.dateTime.modal.slotsEmpty")}</span>
                ) : (
                  <div className="grid w-full grid-cols-4 gap-2">
                    {slots.map((slot) => {
                      const active = draftTime === slot.label;
                      return (
                        <button
                          key={slot.label}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => {
                            setDraftTime(slot.label);
                            setTimeText(slot.label);
                          }}
                          className={cn(
                            "flex items-center justify-center rounded-lg p-2 text-xs",
                            !slot.available
                              ? "bg-bg-brand-disabled text-text-secondary"
                              : active
                                ? "border border-border-brand bg-bg-brand-subtle font-medium text-text-brand"
                                : "bg-bg-secondary text-text-primary"
                          )}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {lockStatus === "error" && lockError && (
                  <span className="text-sm text-form-field-error">{lockError}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col items-start gap-4 bg-bg-primary p-4 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)]">
            <div className="flex w-full items-center gap-6">
              <div className="flex flex-1 items-center gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-3xl bg-bg-secondary">
                  <Calendar className="size-5 text-icon-primary" />
                </span>
                <div className="flex flex-1 flex-col items-start gap-1">
                  <span className="text-xs text-text-secondary">
                    {t("checkoutPage.dateTime.sheet.selectedDateLabel")}
                  </span>
                  <span className="text-sm text-text-primary">
                    {draftDate ? format(draftDate, "d MMM yyyy") : "—"}
                  </span>
                </div>
              </div>
              <div className="h-6 w-px bg-border-black" />
              <div className="flex flex-1 items-center gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-3xl bg-bg-secondary">
                  <Clock className="size-5 text-icon-primary" />
                </span>
                <div className="flex flex-1 flex-col items-start gap-1">
                  <span className="text-xs text-text-secondary">
                    {t("checkoutPage.dateTime.sheet.selectedTimeLabel")}
                  </span>
                  <span className="text-sm text-text-primary">{draftTime ?? "—"}</span>
                </div>
              </div>
            </div>

            <AppButton
              variant="primary"
              size="lg"
              className="w-full justify-center"
              disabled={!draftDate || !draftTime || confirming}
              onClick={handleConfirm}
            >
              {confirmLabel}
            </AppButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
