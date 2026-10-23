"use client";

import { useState } from "react";
import { Link } from "@/components/ui/locale-link";
import type { FaqApi } from "@/lib/home-screen";
import { QuestionMarkCircleIcon } from "@/components/icons/icons";
import { FaqAccordionItem } from "@/components/home/faq-accordion-item";
import { AppButton } from "@/components/ui/app-button";
import { useTranslation } from "@/lib/i18n/translation-context";

export function FaqSection({
  title,
  description,
  faqs,
}: {
  title: string;
  description: string;
  faqs: FaqApi[];
}) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);
  const { t } = useTranslation();

  return (
    <section className="container hidden flex-col items-center commonPY xl:flex">
      <div className="flex w-full flex-col gap-7 lg:flex-row lg:items-start lg:justify-center">
        <div className="flex w-full flex-col gap-11">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-medium text-text-primary sm:text-2xl">{title}</h2>
            <p className="text-base text-text-secondary sm:text-lg">{description}</p>
          </div>

          <div className="flex flex-col gap-6 rounded-2xl border border-border-muted bg-bg-secondary p-6">
            <div className="flex size-16 items-center justify-center rounded-xl bg-bg-brand p-3">
              <QuestionMarkCircleIcon className="size-10 text-icon-inverse" />
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-medium text-text-primary">{t("home.faq.stillNeedHelp")}</h3>
                <p className="text-base text-text-secondary">
                  {t("home.faq.helpDescription")}
                </p>
              </div>
              <AppButton asChild variant="secondary" size="md" className="w-fit">
                <Link href="/contact">{t("home.faq.contactUs")}</Link>
              </AppButton>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 lg:max-w-2xl">
          {faqs.map((faq) => (
            <FaqAccordionItem
              key={faq.id}
              faq={faq}
              isOpen={openId === faq.id}
              onToggle={() => setOpenId((current) => (current === faq.id ? null : faq.id))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
