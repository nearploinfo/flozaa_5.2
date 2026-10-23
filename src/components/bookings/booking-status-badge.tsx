import { getBookingStatusBadgeClass, getBookingStatusLabel, type BookingStatusKey } from "@/lib/helpers";
import { cn } from "@/lib/utils";

export function BookingStatusBadge({
  statusKey,
  fallbackLabel,
}: {
  statusKey: BookingStatusKey | null;
  fallbackLabel: string;
}) {
  const { bg, text } = statusKey
    ? getBookingStatusBadgeClass(statusKey)
    : { bg: "bg-bg-secondary", text: "text-text-secondary" };
  const label = statusKey ? getBookingStatusLabel(statusKey) : fallbackLabel;

  return (
    <span className={cn("flex shrink-0 items-center gap-2.5 rounded-2xl px-3 py-1 text-sm", bg, text)}>
      {label}
    </span>
  );
}
