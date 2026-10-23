"use client";

import { useState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { FaqAccordionItem } from "@/components/home/faq-accordion-item";
import { SectionHeading } from "@/components/become-provider/section-heading";
import { useTranslation } from "@/lib/i18n/translation-context";
import type { FaqSectionApi } from "@/lib/become-provider";

const PAGE_SIZE = 5;

export function FaqsSection({ data }: { data: FaqSectionApi }) {
  const { t } = useTranslation();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [openId, setOpenId] = useState<string | null>(null);
  const faqs = (data.translated_faqs ?? data.faqs ?? []).map((faq) => ({
    id: String(faq.id),
    question: faq.translated_question || faq.question,
    answer: faq.translated_answer || faq.answer,
  }));

  return (
    <section className="bg-bg-primary py-8 md:py-20">
      <div className="container mx-auto">
        <SectionHeading headline={data} />

        <div className="mx-auto mt-5 flex max-w-3xl flex-col justify-center gap-5">
          {faqs.slice(0, visibleCount).map((faq) => (
            <FaqAccordionItem
              key={faq.id}
              faq={faq}
              isOpen={openId === faq.id}
              onToggle={() => setOpenId((current) => (current === faq.id ? null : faq.id))}
            />
          ))}
        </div>

        {visibleCount < faqs.length && (
          <div className="mt-8 flex justify-center">
            <AppButton variant="secondary" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
              {t("becomeProviderPage.loadMore")}
            </AppButton>
          </div>
        )}
      </div>
    </section>
  );
}
