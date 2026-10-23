"use client";

import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import type { FaqItem } from "@/lib/faqs-catalog";

export function FaqPageAccordionItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`w-full overflow-hidden rounded-lg border border-border-default bg-bg-primary ${
        isOpen ? "shadow-[0px_4px_8px_0px_rgba(0,0,0,0.06)]" : ""
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-6 p-4 text-start"
      >
        <span className="flex-1 text-base font-medium text-text-primary">{faq.question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex shrink-0 items-center justify-center rounded-sm p-1"
        >
          <ChevronDown className="size-5 text-text-brand" />
        </motion.span>
      </button>

      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="border-t border-border-default p-4">
          <p className="text-sm text-text-secondary">{faq.answer}</p>
        </div>
      </motion.div>
    </div>
  );
}
