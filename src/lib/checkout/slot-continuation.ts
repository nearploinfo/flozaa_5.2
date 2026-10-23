"use client";

import { format, parse } from "date-fns";
import { useTranslation } from "@/lib/i18n/translation-context";

/**
 * The LAST part of a booking whose service runs past the provider's closing
 * time (2.19/2.20). Before v5.2.0 such a slot came back as an ordinary one and
 * the booking was placed ending after midnight; now it either carries this, or
 * is marked unavailable when the following shifts/days have no room.
 *
 * A service needing several extra shifts or days still sends ONE continuation:
 * its date/ending_time are when the service finally ends, so the booking runs
 * from the selected slot straight through to here. Days in between can be
 * skipped (provider on leave, closed, fully booked), so the date can be
 * further out than the number of working days suggests.
 */
export interface SlotContinuationApi {
  /** "cross_shift" = a later shift the same day; "multi_day" = a later day. */
  kind: "cross_shift" | "multi_day" | string;
  date: string;
  starting_time: string;
  ending_time: string;
  shift_id?: number;
  shift_number?: number;
}

export interface AvailableSlotApi {
  time: string;
  is_available: number;
  remaining_capacity?: number;
  shift_id?: number;
  /** Backend note attached to a slot — e.g. "Order scheduled for the multiple days". */
  message?: string | null;
  /** Null/absent when the service fits in the selected shift. */
  continuation?: SlotContinuationApi | null;
}

function formatTime(time24: string): string {
  try {
    return format(parse(time24, "HH:mm:ss", new Date()), "hh:mm a");
  } catch {
    return time24;
  }
}

function formatDate(date: string): string {
  try {
    return format(parse(date, "yyyy-MM-dd", new Date()), "dd MMM yyyy");
  } catch {
    return date;
  }
}

/**
 * Turns a continuation into the one line the customer needs: when the booking
 * actually finishes. Falls back to the backend's own `message` when there's no
 * continuation object (older responses), and to null when there's neither.
 */
export function useSlotContinuationLabel() {
  const { t } = useTranslation();

  return (
    continuation: SlotContinuationApi | null | undefined,
    fallbackMessage?: string | null
  ): string | null => {
    if (!continuation) return fallbackMessage ?? null;
    if (continuation.kind === "cross_shift") {
      return t("checkoutPage.dateTime.continuation.crossShift", {
        time: formatTime(continuation.ending_time),
      });
    }
    return t("checkoutPage.dateTime.continuation.multiDay", {
      date: formatDate(continuation.date),
      time: formatTime(continuation.ending_time),
    });
  };
}
