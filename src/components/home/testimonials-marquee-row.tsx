"use client";

import { useLayoutEffect, useRef } from "react";
import { motion, useAnimationFrame, useMotionValue } from "motion/react";
import type { Testimonial } from "@/lib/home-screen";
import { TestimonialCard } from "@/components/home/testimonial-card";

const SPEED_PX_PER_SEC = 28;

export function TestimonialsMarqueeRow({
  testimonials,
  direction,
}: {
  testimonials: Testimonial[];
  direction: "left" | "right";
}) {
  const items = [...testimonials, ...testimonials];
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef(0);
  const isPausedRef = useRef(false);
  const x = useMotionValue(0);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const marker = markerRef.current;
    if (!container || !marker) return;

    const period = marker.getBoundingClientRect().left - container.getBoundingClientRect().left;
    periodRef.current = period;
    x.set(direction === "right" ? -period : 0);
  }, [direction, x]);

  useAnimationFrame((_, delta) => {
    if (isPausedRef.current || periodRef.current === 0) return;

    const step = (SPEED_PX_PER_SEC * delta) / 1000;
    const next = x.get() + (direction === "left" ? -step : step);

    if (direction === "left" && next <= -periodRef.current) {
      x.set(next + periodRef.current);
    } else if (direction === "right" && next >= 0) {
      x.set(next - periodRef.current);
    } else {
      x.set(next);
    }
  });

  return (
    <div className="w-full overflow-hidden">
      <motion.div
        ref={containerRef}
        style={{ x }}
        className="flex w-max flex-row gap-6"
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
            className="w-80 shrink-0"
          >
            <TestimonialCard testimonial={testimonial} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
