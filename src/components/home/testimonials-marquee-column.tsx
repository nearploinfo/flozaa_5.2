"use client";

import { useLayoutEffect, useRef } from "react";
import { motion, useAnimationFrame, useMotionValue } from "motion/react";
import type { Testimonial } from "@/lib/home-screen";
import { TestimonialCard } from "@/components/home/testimonial-card";

const SPEED_PX_PER_SEC = 28;
// A column duplicated only once can be shorter than the scroll area when it
// has few testimonials (e.g. an odd/even split leaves one column with 1-2
// cards) - the loop point still lands one copy in, but a rendered gap opens
// up below it before the wrap. Repeat enough copies to comfortably fill the
// tallest (desktop) column height regardless of how few testimonials exist.
const MIN_ITEMS = 8;

export function TestimonialsMarqueeColumn({
  testimonials,
  direction,
}: {
  testimonials: Testimonial[];
  direction: "up" | "down";
}) {
  const repeatCount = Math.max(2, Math.ceil(MIN_ITEMS / Math.max(testimonials.length, 1)));
  const items = Array.from({ length: repeatCount }, () => testimonials).flat();
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef(0);
  const isPausedRef = useRef(false);
  const y = useMotionValue(0);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const marker = markerRef.current;
    if (!container || !marker) return;

    const period = marker.getBoundingClientRect().top - container.getBoundingClientRect().top;
    periodRef.current = period;
    y.set(direction === "down" ? -period : 0);
  }, [direction, y]);

  useAnimationFrame((_, delta) => {
    if (isPausedRef.current || periodRef.current === 0) return;

    const step = (SPEED_PX_PER_SEC * delta) / 1000;
    const next = y.get() + (direction === "up" ? -step : step);

    if (direction === "up" && next <= -periodRef.current) {
      y.set(next + periodRef.current);
    } else if (direction === "down" && next >= 0) {
      y.set(next - periodRef.current);
    } else {
      y.set(next);
    }
  });

  return (
    <div className="h-96 overflow-hidden lg:h-205">
      <motion.div
        ref={containerRef}
        style={{ y }}
        className="flex flex-col gap-6"
        onHoverStart={() => {
          isPausedRef.current = true;
        }}
        onHoverEnd={() => {
          isPausedRef.current = false;
        }}
      >
        {items.map((testimonial, index) => (
          <div
            key={`${testimonial.id}-${index}`}
            ref={index === testimonials.length ? markerRef : undefined}
          >
            <TestimonialCard testimonial={testimonial} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
