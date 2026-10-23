"use client";

import { useEffect, useState } from "react";
import { format, isBefore, parse, startOfDay } from "date-fns";
import { Calendar, Info, Pencil } from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { DateTimeModal } from "@/components/checkout/date-time-modal";
import { MobileDateTimeSheet } from "@/components/checkout/mobile-date-time-sheet";
import { ChevronArrowRightIcon } from "@/components/icons/icons";
import { getAvailableSlotApi } from "@/api/apiRoutes";
import { useIsMobile } from "@/lib/use-is-mobile";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useAppSelector } from "@/store/hooks";
import type { AvailableSlotApi } from "@/lib/checkout/slot-continuation";

function formatSlotLabel(time24: string): string {
  return format(parse(time24, "HH:mm:ss", new Date()), "hh:mm a");
}

/** Today's first available slot that hasn't already passed — shown as a
 * quick preview on the mobile summary row before the user opens the picker.
 * The API doesn't return a "next available" field, so this fetches today's
 * slots and filters by the current time client-side. */
function useNextAvailableSlot(providerId: number): string | null {
  const [label, setLabel] = useState<string | null>(null);
  const lat = useAppSelector((state) => state.location.lat);
  const lng = useAppSelector((state) => state.location.lng);

  useEffect(() => {
    const today = startOfDay(new Date());
    getAvailableSlotApi({
      partner_id: providerId,
      date: format(today, "yyyy-MM-dd"),
      // The provider has to be registered in the customer's country for any
      // slot to come back at all — send where the customer actually is.
      ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
    })
      .then((response) => {
        if (response?.error) throw new Error(response?.message);
        const now = new Date();
        const raw: AvailableSlotApi[] = response?.data?.all_slots ?? [];
        const next = raw.find((slot) => {
          if (slot.is_available !== 1) return false;
          return !isBefore(parse(slot.time, "HH:mm:ss", today), now);
        });
        setLabel(next ? formatSlotLabel(next.time) : null);
      })
      .catch(() => setLabel(null));
  }, [providerId, lat, lng]);

  return label;
}

export function DateTimeSection({
  providerId,
  advanceBookingDays,
  selectedDate,
  selectedTime,
  slotMessage,
  lockStatus,
  lockError,
  onConfirm,
}: {
  providerId: number;
  /** How many days out this provider can be booked — undefined means no
   * known limit (every day the picker renders stays selectable). */
  advanceBookingDays?: number;
  selectedDate: Date | null;
  selectedTime: string | null;
  slotMessage: string | null;
  lockStatus: "idle" | "locking" | "locked" | "error";
  lockError: string | null;
  onConfirm: (date: Date, time: string, message: string | null) => Promise<boolean>;
}) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const nextAvailableSlot = useNextAvailableSlot(providerId);

  return (
    <div className="flex w-full flex-col items-start rounded-xl bg-bg-primary xl:rounded-2xl xl:border xl:border-border-default">
      <div className="hidden w-full items-center gap-4 border-b border-border-default p-4 xl:flex">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-3xl border border-border-default bg-bg-secondary p-2">
          <Calendar className="size-6 text-icon-primary" />
        </span>
        <span className="flex-1 text-base font-medium text-text-primary">
          {t("checkoutPage.dateTime.title")}
        </span>
      </div>

      <div className="hidden w-full flex-col gap-3 p-4 xl:flex">
        <div className="flex w-full items-center gap-6">
          <div className="flex flex-1 flex-col items-start justify-center gap-1">
            <span className="line-clamp-1 text-sm text-text-secondary">
              {t("checkoutPage.dateTime.label")}
            </span>
            <span className="text-base font-medium text-text-primary">
              {selectedDate && selectedTime
                ? `${format(selectedDate, "dd - MM - yyyy")}  -  ${selectedTime}`
                : t("checkoutPage.dateTime.placeholder")}
            </span>
          </div>
          <AppButton
            variant="secondary"
            size="md"
            leftIcon={selectedDate && selectedTime ? Pencil : undefined}
            onClick={() => setModalOpen(true)}
          >
            {selectedDate && selectedTime
              ? t("checkoutPage.dateTime.editButton")
              : t("checkoutPage.dateTime.selectButton")}
          </AppButton>
        </div>
        {selectedDate && selectedTime && slotMessage && (
          <div className="flex w-full items-start gap-2 rounded-xl border border-alert-warning-border bg-alert-warning-bg p-3">
            <Info className="mt-0.5 size-4 shrink-0 text-alert-warning-text" />
            <span className="text-sm leading-snug text-alert-warning-text">{slotMessage}</span>
          </div>
        )}
      </div>

      {/* Mobile: compact icon-square + title + "View All" row, plus a quick
          preview of today's next open slot. Opens MobileDateTimeSheet
          instead of the desktop calendar dialog. */}
      <div className="flex w-full flex-col items-start gap-3 p-3 xl:hidden">
        <div className="flex w-full items-center gap-1">
          <button type="button" onClick={() => setModalOpen(true)} className="flex flex-1 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-bg-secondary p-2">
              <Calendar className="size-4 text-icon-primary" />
            </span>
            <span className="flex-1 text-left text-sm font-semibold text-text-primary">
              {t("checkoutPage.dateTime.title")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 p-1 text-sm text-button-link-primary-text"
          >
            {t("checkoutPage.dateTime.viewAll")}
            <ChevronArrowRightIcon className="size-5 text-icon-brand rtl:rotate-180" />
          </button>
        </div>

        <div className="dashed-divider" />

        {selectedDate && selectedTime ? (
          <div className="flex w-full flex-col items-start gap-2">
            <button type="button" onClick={() => setModalOpen(true)} className="flex items-center gap-2 p-2">
              <span className="text-xs text-text-primary">
                {format(selectedDate, "dd/MM/yyyy")}, {selectedTime}
              </span>
              <Pencil className="size-3.5 shrink-0 text-icon-secondary" />
            </button>
            {slotMessage && (
              <div className="flex w-full items-start gap-2 rounded-xl border border-alert-warning-border bg-alert-warning-bg p-3">
                <Info className="mt-0.5 size-4 shrink-0 text-alert-warning-text" />
                <span className="text-sm leading-snug text-alert-warning-text">{slotMessage}</span>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-secondary p-2"
          >
            <span className="text-xs text-text-primary">
              {nextAvailableSlot
                ? t("checkoutPage.dateTime.nextAvailable", { when: `Today, ${nextAvailableSlot}` })
                : t("checkoutPage.dateTime.placeholder")}
            </span>
          </button>
        )}
      </div>

      {isMobile ? (
        <MobileDateTimeSheet
          open={modalOpen}
          onOpenChange={setModalOpen}
          providerId={providerId}
          advanceBookingDays={advanceBookingDays}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          lockStatus={lockStatus}
          lockError={lockError}
          onConfirm={onConfirm}
        />
      ) : (
        <DateTimeModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          providerId={providerId}
          advanceBookingDays={advanceBookingDays}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          lockStatus={lockStatus}
          lockError={lockError}
          onConfirm={onConfirm}
        />
      )}
    </div>
  );
}
