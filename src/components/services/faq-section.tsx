"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { FaqAccordionItem } from "@/components/home/faq-accordion-item";
import { EmptyState } from "@/components/ui/empty-state";
import { ChevronDownIcon, FaqIcon } from "@/components/icons/icons";
import type { ServiceFaqApi } from "@/lib/services-catalog";
import { useTranslation } from "@/lib/i18n/translation-context";

export function FaqSection({ faqs }: { faqs: ServiceFaqApi[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(faqs.length > 0 ? 0 : null);
  const { t } = useTranslation();

  return (
    <>
      <FaqSectionMobile faqs={faqs} />

      <div className="hidden flex-col items-start gap-4 self-stretch rounded-xl border border-border-default bg-bg-primary p-6 xl:flex">
        <h2 className="self-stretch text-lg font-medium text-text-primary">
          {t("services.faqs.title")}
        </h2>
        <div className="dashed-divider" />

        {faqs.length === 0 ? (
          <EmptyState
            icon={FaqIcon}
            title={t("services.faqs.emptyTitle")}
            description={t("services.faqs.emptyDescription")}
          />
        ) : (
          <div className="flex w-full flex-col gap-4">
            {faqs.map((faq, index) => (
              <FaqAccordionItem
                key={`${faq.question}-${index}`}
                faq={{ id: String(index), ...faq }}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex((current) => (current === index ? null : index))}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/** max-lg layout: no card, light accordion tiles instead of the inverse-header desktop one. */
function FaqSectionMobile({ faqs }: { faqs: ServiceFaqApi[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(faqs.length > 0 ? 0 : null);
  const { t } = useTranslation();

  return (
    <section className="flex flex-col items-start gap-4 py-6 xl:hidden">
      <h2 className="text-lg font-semibold text-text-primary">
        {t("services.faqs.serviceTitle")}
      </h2>

      {faqs.length === 0 ? (
        <EmptyState
          icon={FaqIcon}
          title={t("services.faqs.emptyTitle")}
          description={t("services.faqs.emptyDescription")}
        />
      ) : (
        <div className="flex w-full flex-col gap-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={`${faq.question}-${index}`}
                className="w-full overflow-hidden rounded-lg border border-border-default bg-bg-primary"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setOpenIndex((current) => (current === index ? null : index))
                  }
                  className={`flex w-full items-center justify-between gap-4 p-4 text-start transition-colors duration-200 ${
                    isOpen ? "bg-bg-secondary" : "bg-bg-primary"
                  }`}
                >
                  <span className="flex-1 text-sm font-medium text-text-primary">
                    {faq.question}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex shrink-0 items-center justify-center"
                  >
                    <ChevronDownIcon className="size-5 text-icon-primary" />
                  </motion.span>
                </button>

                <motion.div
                  initial={false}
                  animate={{ height: isOpen ? "auto" : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="border-t border-border-default p-4 text-sm text-text-secondary">
                    {faq.answer}
                  </p>
                </motion.div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
