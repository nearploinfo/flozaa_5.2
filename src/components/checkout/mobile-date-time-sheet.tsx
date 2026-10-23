"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format, isBefore, isSameDay, isToday, parse, startOfDay } from "date-fns";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { AppButton } from "@/components/ui/app-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Info } from "lucide-react";
import { getAvailableSlotApi } from "@/api/apiRoutes";
import {
  useSlotContinuationLabel,
  type AvailableSlotApi,
} from "@/lib/checkout/slot-continuation";
import { useAppSelector } from "@/store/hooks";
import { useTranslation } from "@/lib/i18n/translation-context";
import { cn } from "@/lib/utils";

const DAY_STRIP_LENGTH = 14;

function formatSlotLabel(time24: string): string {
  return format(parse(time24, "HH:mm:ss", new Date()), "hh:mm a");
}

/** Mobile-only counterpart to date-time-modal.tsx's desktop calendar dialog —
 * a day strip instead of a month grid, otherwise the same underlying data
 * (getAvailableSlotApi) and the same onConfirm/slot-lock flow. A slot the
 * backend marks available is still greyed out here if its time has already
 * passed today — the API doesn't itself account for "now". */
export function MobileDateTimeSheet({
  open,
  onOpenChange,
  providerId,
  advanceBookingDays,
  selectedDate,
  selectedTime,
  lockStatus,
  lockError,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: number;
  /** How many days out this provider can be booked — undefined means no
   * known limit (the full 14-day strip stays selectable). */
  advanceBookingDays?: number;
  selectedDate: Date | null;
  selectedTime: string | null;
  lockStatus: "idle" | "locking" | "locked" | "error";
  lockError: string | null;
  onConfirm: (date: Date, time: string, message: string | null) => Promise<boolean>;
}) {
  const { t } = useTranslation();
  const today = useMemo(() => startOfDay(new Date()), []);
  const days = useMemo(
    () => Array.from({ length: DAY_STRIP_LENGTH }, (_, index) => addDays(today, index)),
    [today]
  );

  const [draftDate, setDraftDate] = useState<Date>(selectedDate ?? today);
  const [draftTime, setDraftTime] = useState<string | null>(selectedTime);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ label: string; available: boolean; message: string | null }[]>([]);
  const [slotsStatus, setSlotsStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const continuationLabel = useSlotContinuationLabel();
  const lat = useAppSelector((state) => state.location.lat);
  const lng = useAppSelector((state) => state.location.lng);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the draft to the current selection each time the sheet opens
    setDraftDate(selectedDate ?? today);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setDraftTime(selectedTime);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setDraftMessage(null);
  }, [open, selectedDate, selectedTime, today]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off the slot fetch for the newly selected day
    setSlotsStatus("loading");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset from the previous date's error before the new fetch resolves
    setSlotsError(null);
    getAvailableSlotApi({
      partner_id: providerId,
      date: format(draftDate, "yyyy-MM-dd"),
      // Without coordinates the provider's country is resolved from the saved
      // profile location, so a provider in another country never shows slots.
      ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
    })
      .then((response) => {
        if (response?.error) throw new Error(response?.message);
        const now = new Date();
        const raw: AvailableSlotApi[] = response?.data?.all_slots ?? [];
        const mapped = raw.map((slot) => {
          const slotTime = parse(slot.time, "HH:mm:ss", draftDate);
          const isPast = isToday(draftDate) && isBefore(slotTime, now);
          return {
            label: formatSlotLabel(slot.time),
            // is_available is 0 when the service runs past closing time AND
            // the following shifts/days have no room for the remainder.
            available: slot.is_available === 1 && !isPast,
            message: continuationLabel(slot.continuation, slot.message),
          };
        });
        setSlots(mapped);
        setSlotsStatus("loaded");
      })
      .catch((error: unknown) => {
        setSlots([]);
        setSlotsStatus("error");
        setSlotsError(error instanceof Error && error.message ? error.message : null);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- continuationLabel is recreated each render; refetching on its identity would loop
  }, [open, draftDate, providerId, lat, lng]);

  const handleConfirm = async () => {
    if (!draftTime) return;
    setConfirming(true);
    const success = await onConfirm(draftDate, draftTime, draftMessage);
    setConfirming(false);
    if (success) onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] bg-bg-primary">
        <div className="flex w-full flex-col items-center gap-2 px-4">
          <DrawerTitle className="w-full text-base font-medium text-text-primary">
            {t("checkoutPage.dateTime.sheet.title")}
          </DrawerTitle>
          <div className="dashed-divider" />
        </div>

        <div className="flex w-full flex-col items-start gap-4 overflow-y-auto px-4 py-4">
          <div className="flex w-full flex-col items-start gap-2">
            <span className="text-sm font-semibold text-text-primary">
              {t("checkoutPage.dateTime.sheet.selectDateForService")}
            </span>
            <div className="no-scrollbar flex w-full items-center gap-2.5 overflow-x-auto">
              {days.map((day, dayIndex) => {
                const active = isSameDay(day, draftDate);
                const disabled = advanceBookingDays != null && dayIndex > advanceBookingDays;
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setDraftDate(day);
                      setDraftTime(null);
                      setDraftMessage(null);
                    }}
                    className={cn(
                      "flex shrink-0 flex-col items-center gap-1 rounded-xl border px-6 py-4",
                      disabled
                        ? "border-transparent bg-bg-brand-disabled text-text-secondary"
                        : active
                          ? "border-border-brand bg-bg-brand-subtle"
                          : "border-border-default bg-bg-primary"
                    )}
                  >
                    <span
                      className={cn(
                        "text-base font-medium",
                        disabled ? "text-text-secondary" : active ? "text-text-brand" : "text-text-primary"
                      )}
                    >
                      {format(day, "d/M")}
                    </span>
                    <span className="text-xs text-text-secondary">{format(day, "EEE")}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex w-full flex-col items-start gap-2">
            <span className="text-sm font-semibold text-text-primary">
              {t("checkoutPage.dateTime.sheet.selectTimeForService")}
            </span>

            {slotsStatus === "loaded" && slots.length === 0 && (
              <span className="text-sm text-text-secondary">{t("checkoutPage.dateTime.modal.slotsEmpty")}</span>
            )}

            {slotsStatus === "error" && (
              <span className="text-sm text-form-field-error">
                {slotsError ?? t("checkoutPage.dateTime.modal.slotsError")}
              </span>
            )}

            {slotsStatus === "loading" ? (
              <div className="grid w-full grid-cols-4 gap-2">
                {Array.from({ length: 16 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : slotsStatus === "error" ? null : (
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
                        setDraftMessage(slot.message);
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 rounded-lg border p-2",
                        !slot.available
                          ? "border-transparent bg-bg-brand-disabled text-text-secondary"
                          : active
                            ? "border-border-brand bg-bg-brand-subtle text-text-brand"
                            : "border-transparent bg-bg-secondary text-text-primary"
                      )}
                    >
                      <span className="text-xs font-normal">{slot.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {draftMessage && (
              <div className="flex w-full items-start gap-2 rounded-xl border border-alert-warning-border bg-alert-warning-bg p-3">
                <Info className="mt-0.5 size-4 shrink-0 text-alert-warning-text" />
                <span className="text-sm leading-snug text-alert-warning-text">{draftMessage}</span>
              </div>
            )}

            {lockStatus === "error" && lockError && (
              <span className="text-sm text-form-field-error">{lockError}</span>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-4 bg-bg-primary p-4 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)]">
          <div className="flex w-full items-center gap-6">
            <div className="flex flex-1 items-center gap-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-3xl bg-bg-secondary">
                <Calendar className="size-5 text-icon-primary" />
              </span>
              <div className="flex flex-1 flex-col items-start gap-1">
                <span className="text-xs text-text-secondary">
                  {t("checkoutPage.dateTime.sheet.selectedDateLabel")}
                </span>
                <span className="text-sm text-text-primary">{format(draftDate, "d MMMM yyyy")}</span>
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

          <div className="flex w-full items-start gap-4">
            <AppButton
              variant="primary-outline"
              size="lg"
              className="flex-1 justify-center"
              onClick={() => onOpenChange(false)}
            >
              {t("common.close")}
            </AppButton>
            <AppButton
              variant="primary"
              size="lg"
              className="flex-1 justify-center"
              disabled={!draftTime || confirming || slotsStatus === "error"}
              onClick={handleConfirm}
            >
              {t("checkoutPage.dateTime.sheet.confirmButton")}
            </AppButton>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
