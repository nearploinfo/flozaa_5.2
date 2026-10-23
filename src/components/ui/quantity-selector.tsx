"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AppButton } from "@/components/ui/app-button";
import { MinusIcon, PlusIcon } from "@/components/icons/icons";
import { cn } from "@/lib/utils";

export function QuantitySelector({
  quantity,
  onIncrease,
  onDecrease,
  decreaseLabel,
  increaseLabel,
  className,
}: {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  decreaseLabel: string;
  increaseLabel: string;
  className?: string;
}) {
  const [direction, setDirection] = useState(1);

  return (
    <div
      className={cn(
        "flex h-10 shrink-0 items-center justify-between gap-3 rounded-lg border border-border-brand bg-bg-brand-subtle px-2 py-1",
        className
      )}
    >
      <AppButton
        variant="link"
        size="sm"
        iconOnly
        leftIcon={MinusIcon}
        aria-label={decreaseLabel}
        onClick={(event) => {
          event.preventDefault();
          setDirection(-1);
          onDecrease();
        }}
        className="p-0 text-icon-brand "
      >
        {decreaseLabel}
      </AppButton>
      <div className="relative h-6 w-4 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.span
            key={quantity}
            custom={direction}
            initial={{ y: -direction * 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: direction * 20, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center text-base font-medium text-text-primary"
          >
            {quantity}
          </motion.span>
        </AnimatePresence>
      </div>
      <AppButton
        variant="link"
        size="sm"
        iconOnly
        leftIcon={PlusIcon}
        aria-label={increaseLabel}
        onClick={(event) => {
          event.preventDefault();
          setDirection(1);
          onIncrease();
        }}
        className="p-0 text-icon-brand"
      >
        {increaseLabel}
      </AppButton>
    </div>
  );
}
