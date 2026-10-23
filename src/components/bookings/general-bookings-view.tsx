"use client";

import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { BookingsTabsNav } from "@/components/bookings/bookings-tabs-nav";
import { MobileBookingsTabsNav } from "@/components/bookings/mobile-bookings-tabs-nav";
import { MobileStatusFilterChips } from "@/components/bookings/mobile-status-filter-chips";
import { BookingBucketsSections } from "@/components/bookings/booking-buckets-sections";
import { MobileBookingBucketsSections } from "@/components/bookings/mobile-booking-buckets-sections";
import { Dropdown } from "@/components/ui/dropdown";
import { useBookingBuckets } from "@/lib/use-booking-buckets";
import { BOOKING_STATUS_META, type BookingStatusKey } from "@/lib/helpers";
import { useTranslation } from "@/lib/i18n/translation-context";
import ProfileLayout from "../account/ProfileLayout";

const STATUS_FILTER_OPTIONS: BookingStatusKey[] = [
  "awaiting",
  "confirmed",
  "rescheduled",
  "started",
  "onTheWay",
  "arrived",
  "completed",
  "bookingEnded",
  "cancelled",
];

export function GeneralBookingsView() {
  const { t } = useTranslation();
  const title = t("bookings.title");
  const { buckets, status, statusFilter, setStatusFilter } = useBookingBuckets(0);

  return (
    <>
      <PageBreadcrumb title={title} items={[{ label: title }]} hideMobileDivider hideBack />

      {/* Mobile — flat layout, no sidebar/card border. Desktop unchanged below. */}
      <div className="flex w-full flex-col items-start pb-6 xl:hidden">
        <MobileBookingsTabsNav />
        <div className="w-full bg-bg-primary px-4 py-3 shadow-[0px_8px_16px_0px_rgba(0,0,0,0.04)]">
          <MobileStatusFilterChips value={statusFilter} onChange={setStatusFilter} />
        </div>
        <div className="mt-4 w-full">
          <MobileBookingBucketsSections buckets={buckets} status={status} />
        </div>
      </div>

      <div className="hidden xl:block">
        <ProfileLayout title={title}>
          <div className="flex w-full flex-1 flex-col items-start rounded-xl border border-border-default bg-bg-primary">
            <div className="flex w-full items-center justify-center gap-4 border-b border-border-default p-6">
              <span className="flex-1 text-xl font-medium text-text-primary">{title}</span>
            </div>

            <div className="flex w-full flex-col items-start gap-6 p-6">
              <div className="flex w-full items-center gap-6">
                <BookingsTabsNav />
                <div className="flex items-center gap-3">
                  <span className="text-lg text-text-primary">{t("bookings.sortBy")}</span>
                  <Dropdown
                    className="w-52"
                    options={[
                      { label: t("bookings.sortAll"), value: "all" },
                      ...STATUS_FILTER_OPTIONS.map((key) => ({
                        label: BOOKING_STATUS_META[key].label,
                        value: key,
                      })),
                    ]}
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value as BookingStatusKey | "all")}
                  />
                </div>
              </div>

              <BookingBucketsSections buckets={buckets} status={status} />
            </div>
          </div>
        </ProfileLayout>
      </div>
    </>
  );
}
