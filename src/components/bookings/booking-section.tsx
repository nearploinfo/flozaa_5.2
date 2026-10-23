"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDownIcon, ChevronUpIcon } from "@/components/icons/icons";
import { BookingCard } from "@/components/bookings/booking-card";
import type { BookingCardData } from "@/lib/orders-catalog";

export function BookingSection({
  title,
  bookings,
  CardComponent = BookingCard,
}: {
  title: string;
  bookings: BookingCardData[];
  CardComponent?: (props: { booking: BookingCardData }) => React.JSX.Element;
}) {
  const [expanded, setExpanded] = useState(true);

  if (bookings.length === 0) return null;

  return (
    <div className="flex w-full flex-col items-start gap-4">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2"
      >
        <span className="text-lg font-medium text-text-primary">{title}</span>
        {expanded ? (
          <ChevronUpIcon className="size-5 text-icon-primary" />
        ) : (
          <ChevronDownIcon className="size-5 text-icon-primary" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="w-full overflow-hidden"
          >
            <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
              {bookings.map((booking) => (
                <CardComponent key={booking.id} booking={booking} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
