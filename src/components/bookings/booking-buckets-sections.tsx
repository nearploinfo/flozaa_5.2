import { BookingSection } from "@/components/bookings/booking-section";
import { BookingCard } from "@/components/bookings/booking-card";
import { Skeleton } from "@/components/ui/skeleton";
import { NoDataFoundState } from "@/components/ui/no-data-found-state";
import { toBookingCardData, type BookingBucketsApi, type BookingCardData } from "@/lib/orders-catalog";
import { useTranslation } from "@/lib/i18n/translation-context";

const OngoingBookingCard = ({ booking }: { booking: BookingCardData }) => <BookingCard booking={booking} />;
const InvoiceBookingCard = ({ booking }: { booking: BookingCardData }) => (
  <BookingCard booking={booking} showInvoiceNumber />
);
const CompletedBookingCard = ({ booking }: { booking: BookingCardData }) => (
  <BookingCard booking={booking} showInvoiceNumber showRebook />
);

export function BookingBucketsSections({
  buckets,
  status,
  CardComponent,
}: {
  buckets: BookingBucketsApi;
  status: "loading" | "loaded" | "error";
  CardComponent?: (props: { booking: BookingCardData }) => React.JSX.Element;
}) {
  const { t } = useTranslation();

  if (status === "loading") {
    return (
      <div className="flex w-full flex-col gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const ongoing = buckets.ongoing_bookings.map(toBookingCardData);
  const upcoming = buckets.upcoming_bookings.map(toBookingCardData);
  const completed = buckets.completed_bookings.map(toBookingCardData);
  const cancelled = buckets.cancelled_bookings.map(toBookingCardData);
  const hasAny = ongoing.length + upcoming.length + completed.length + cancelled.length > 0;

  if (!hasAny) {
    return (
      <NoDataFoundState
        title={t("bookings.emptyTitle")}
        description={t("bookings.emptyDescription")}
        className="w-full"
      />
    );
  }

  return (
    <>
      <BookingSection
        title={t("bookings.ongoing")}
        bookings={ongoing}
        CardComponent={CardComponent ?? OngoingBookingCard}
      />
      {ongoing.length > 0 && upcoming.length + completed.length + cancelled.length > 0 && (
        <div className="dashed-divider" />
      )}
      <BookingSection
        title={t("bookings.upcoming")}
        bookings={upcoming}
        CardComponent={CardComponent ?? InvoiceBookingCard}
      />
      {upcoming.length > 0 && completed.length + cancelled.length > 0 && (
        <div className="dashed-divider" />
      )}
      <BookingSection
        title={t("bookings.completed")}
        bookings={completed}
        CardComponent={CardComponent ?? CompletedBookingCard}
      />
      {completed.length > 0 && cancelled.length > 0 && <div className="dashed-divider" />}
      <BookingSection
        title={t("bookings.cancelled")}
        bookings={cancelled}
        CardComponent={CardComponent ?? InvoiceBookingCard}
      />
    </>
  );
}
