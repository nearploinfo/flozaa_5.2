"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getAllBookingsApi } from "@/api/apiRoutes";
import type { AllBookingsResponse, BookingBucketsApi } from "@/lib/orders-catalog";
import type { BookingStatusKey } from "@/lib/helpers";

const RAW_STATUS_BY_KEY: Record<BookingStatusKey, string> = {
  awaiting: "awaiting",
  confirmed: "confirmed",
  completed: "completed",
  rescheduled: "rescheduled",
  cancelled: "cancelled",
  bookingEnded: "booking_ended",
  started: "started",
  onTheWay: "on_the_way",
  arrived: "arrived",
};

const EMPTY_BUCKETS: BookingBucketsApi = {
  ongoing_bookings: [],
  upcoming_bookings: [],
  completed_bookings: [],
  cancelled_bookings: [],
};

export function useBookingBuckets(customRequestOrder: 0 | 1) {
  const [statusFilter, setStatusFilter] = useState<BookingStatusKey | "all">("all");

  // Cached per (customRequestOrder, statusFilter) tuple — revisiting a tab/
  // filter already fetched in this session serves the cached buckets
  // instantly instead of refetching, while a genuinely new filter still
  // fetches once.
  const query = useQuery({
    queryKey: ["bookings", customRequestOrder, statusFilter],
    queryFn: async (): Promise<BookingBucketsApi> => {
      const response: AllBookingsResponse | null = await getAllBookingsApi({
        custom_request_order: customRequestOrder,
        ...(statusFilter === "all" ? {} : { status: RAW_STATUS_BY_KEY[statusFilter] }),
      });
      if (response?.error) throw new Error(response?.message);
      return response?.data ?? EMPTY_BUCKETS;
    },
    placeholderData: keepPreviousData,
  });

  return {
    buckets: query.data ?? EMPTY_BUCKETS,
    status: query.isPending ? "loading" : query.isError ? "error" : "loaded",
    statusFilter,
    setStatusFilter,
  } as const;
}
