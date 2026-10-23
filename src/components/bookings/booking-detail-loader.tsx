"use client";

import { useEffect, useState } from "react";
import { usePathnameCompat } from "@/lib/next-router-compat";
import { BookingDetailView } from "@/components/bookings/booking-detail-view";
import { Skeleton } from "@/components/ui/skeleton";
import { NoDataFoundState } from "@/components/ui/no-data-found-state";
import { getBookingDetailsApi } from "@/api/apiRoutes";
import type { BookingDetailApi, BookingDetailResponse } from "@/lib/orders-catalog";
import { useTranslation } from "@/lib/i18n/translation-context";

export function BookingDetailLoader() {
  const pathname = usePathnameCompat();
  const id = pathname.split("/").filter(Boolean).pop() ?? "";
  const { t } = useTranslation();

  const [booking, setBooking] = useState<BookingDetailApi | null>(null);
  const [notFoundState, setNotFoundState] = useState(false);

  const refetch = () =>
    getBookingDetailsApi({ id }).then((response: BookingDetailResponse | null) => {
      if (!response || response.error || !response.data) {
        setNotFoundState(true);
        return;
      }
      setBooking(response.data);
    });

  useEffect(() => {
    let cancelled = false;
    getBookingDetailsApi({ id }).then((response: BookingDetailResponse | null) => {
      if (cancelled) return;
      if (!response || response.error || !response.data) {
        setNotFoundState(true);
        return;
      }
      setBooking(response.data);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (notFoundState) {
    return (
      <NoDataFoundState
        title={t("bookings.detail.noDataFoundTitle")}
        description={t("bookings.detail.notFound")}
      />
    );
  }

  if (!booking) {
    return (
      <div className="container flex flex-col gap-6 py-16">
        <Skeleton className="h-16 w-full rounded-xl bg-bg-tertiary" />
        <Skeleton className="h-96 w-full rounded-xl bg-bg-tertiary" />
      </div>
    );
  }

  return <BookingDetailView booking={booking} onBookingUpdated={refetch} />;
}
