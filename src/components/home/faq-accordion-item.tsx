"use client";

import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import type { FaqApi } from "@/lib/home-screen";
import { AppButton } from "@/components/ui/app-button";

export function FaqAccordionItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: FaqApi;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`w-full overflow-hidden rounded-lg ${isOpen ? "shadow-[0px_4px_8px_0px_rgba(0,0,0,0.06)]" : ""}`}>
      <AppButton
        variant="link"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between gap-6 rounded-t-lg p-4 text-start ${
          isOpen
            ? "bg-bg-inverse"
            : "rounded-b-lg border border-border-default bg-bg-primary shadow-[0px_4px_8px_0px_rgba(0,0,0,0.06)]"
        }`}
      >
        <span
          className={`flex-1 text-base font-medium ${isOpen ? "text-text-inverse-dark" : "text-text-primary"}`}
        >
          {faq.question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex shrink-0 items-center justify-center rounded-sm p-1"
        >
          <ChevronDown
            className={`size-5 ${isOpen ? "text-icon-inverse" : "text-icon-primary"}`}
          />
        </motion.span>
      </AppButton>

      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="rounded-b-lg border-r border-b border-l border-border-default bg-bg-primary p-4">
          <p className="text-sm text-text-primary">{faq.answer}</p>
        </div>
      </motion.div>
    </div>
  );
}
