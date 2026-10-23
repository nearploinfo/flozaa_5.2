"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AppImage } from "@/components/ui/app-image";
import { CloseIcon, LocationPinIcon } from "@/components/icons/icons";
import { RouteMap } from "@/components/maps/route-map";
import { getLiveTrackingDataApi } from "@/api/apiRoutes";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useGeocode } from "@/lib/use-geocode";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 5000;

interface LiveTrackingDataApi {
  latitude?: string | number;
  longitude?: string | number;
}

/** Desktop "Track On Map" — polls get_live_tracking_data every 5s (stops once
 * arrived) for the provider's live lat/lng. The "Last Updated" time is
 * computed client-side from the last successful poll — same as the legacy
 * Next.js app's LiveTrackingMap — the backend response here is just lat/lng,
 * it doesn't carry its own timestamp.
 *
 * get_booking_details never returns the customer's coordinates (only a
 * free-text address), so the destination point for the route line is
 * geocoded client-side from that address text (useGeocode, via Nominatim —
 * no API key). A garbage/incomplete address won't resolve, in which case
 * only the provider's marker shows and "Your Location" below stays text-only. */
export function TrackOnMapModal({
  open,
  onOpenChange,
  orderId,
  isArrived,
  providerName,
  providerImage,
  customerAddress,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number | string;
  isArrived: boolean;
  providerName: string;
  providerImage: string;
  customerAddress: string;
}) {
  const { t } = useTranslation();
  const destination = useGeocode(customerAddress);
  const [tracking, setTracking] = useState<LiveTrackingDataApi | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    const response = await getLiveTrackingDataApi({ order_id: orderId });
    if (response?.error === false && response?.data?.latitude != null) {
      setTracking(response.data);
      setLastUpdated(new Date());
      setUnavailable(false);
    } else if (response?.error) {
      setUnavailable(true);
    }
  }, [orderId]);

  useEffect(() => {
    if (!open) return;
    poll();
    if (!isArrived) {
      intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open, isArrived, poll]);

  const providerLocationLabel =
    tracking?.latitude != null && tracking?.longitude != null
      ? `${tracking.latitude}, ${tracking.longitude}`
      : t("bookings.detail.trackModal.unavailable");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] w-[1620px] max-w-[calc(100%-2rem)] flex-col items-center gap-0 overflow-hidden rounded-xl bg-bg-primary p-0 ring-1 ring-border-default sm:max-w-[calc(100%-2rem)]"
      >
        <div className="flex w-full shrink-0 items-center gap-6 rounded-t-xl border-b border-border-default px-6 py-4">
          <DialogTitle className="flex-1 text-xl font-medium text-text-primary">
            {t("bookings.detail.trackModal.title")}
          </DialogTitle>
          <button
            type="button"
            aria-label={t("checkoutPage.dateTime.modal.closeAriaLabel")}
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center rounded-lg border border-button-secondary-outline-border bg-bg-secondary p-2 text-button-secondary-outline-text hover:opacity-90"
          >
            <CloseIcon className="size-3.5" />
          </button>
        </div>

        <div className="flex w-full flex-1 flex-col items-start gap-6 overflow-y-auto p-6">
          <div className="flex w-full flex-col items-start gap-2">
            <div className="flex w-full items-center gap-6">
              <span className="flex-1 text-xl font-medium text-text-primary">
                {t("bookings.detail.trackModal.locationUpdate")}
              </span>
              {!unavailable && (
                <span className="flex items-center gap-2 rounded-2xl bg-bg-success px-3 py-1">
                  <span className="size-2 rounded-full bg-white ring-4 ring-white/20" />
                  <span className="text-base text-text-inverse-light">{t("bookings.detail.trackModal.live")}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg text-text-secondary">{t("bookings.detail.trackModal.lastUpdated")}</span>
              <span className="text-lg text-text-secondary">
                {lastUpdated
                  ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
                  : "—"}
              </span>
            </div>
          </div>

          <div className="flex w-full items-center gap-4 rounded-xl border border-border-default bg-bg-secondary p-4">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-lg">
              <AppImage src={providerImage} alt={providerName} fill className="object-cover" />
            </div>
            <div className="flex flex-1 flex-col items-start gap-1">
              <span className="text-xl font-medium text-text-primary">{providerName}</span>
              <span className="text-lg font-medium text-text-brand">
                {isArrived ? t("bookings.detail.trackModal.arrived") : t("bookings.detail.trackModal.onTheWay")}
              </span>
            </div>
            <span
              className={cn(
                "rounded-lg px-3 py-1 text-base",
                isArrived ? "bg-bg-success text-text-inverse-light" : "bg-bg-brand text-text-inverse-dark"
              )}
            >
              {isArrived ? t("bookings.timeline.arrived") : t("bookings.timeline.onTheWay")}
            </span>
          </div>

          {tracking?.latitude != null && tracking?.longitude != null ? (
            <RouteMap
              from={{ lat: Number(tracking.latitude), lng: Number(tracking.longitude) }}
              to={destination}
              className="h-[652px] w-full rounded-xl"
            />
          ) : (
            <div className="flex h-[652px] w-full items-center justify-center rounded-xl bg-bg-secondary text-sm text-text-secondary">
              {t("bookings.detail.trackModal.unavailable")}
            </div>
          )}

          <div className="flex w-full items-end gap-6">
            <div className="flex flex-1 items-center gap-4 rounded-xl border border-border-default bg-bg-secondary p-3">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-border-default bg-bg-primary p-3">
                <LocationPinIcon className="size-7 text-icon-primary" />
              </span>
              <div className="flex flex-1 flex-col items-start gap-1">
                <span className="text-lg text-text-secondary">{t("bookings.detail.trackModal.providerLocation")}</span>
                <span className="line-clamp-1 text-lg font-medium text-text-primary">{providerLocationLabel}</span>
              </div>
            </div>
            <div className="flex flex-1 items-center gap-4 rounded-xl border border-border-default bg-bg-secondary p-3">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-border-default bg-bg-primary p-3">
                <LocationPinIcon className="size-7 text-icon-primary" />
              </span>
              <div className="flex flex-1 flex-col items-start gap-1">
                <span className="text-lg text-text-secondary">{t("bookings.detail.trackModal.yourLocation")}</span>
                <span className="line-clamp-1 text-lg font-medium text-text-primary">{customerAddress}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
