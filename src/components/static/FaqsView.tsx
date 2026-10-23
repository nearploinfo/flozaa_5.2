"use client";

import { useEffect, useState } from "react";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import MobileBreadcrum from "@/components/common/MobileBreadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { BrochureIcon } from "@/components/icons/icons";
import { FaqPageAccordionItem } from "@/components/static/faq-page-accordion-item";
import { fetchFaqs, type FaqItem } from "@/lib/faqs-catalog";
import { useTranslation } from "@/lib/i18n/translation-context";

export function FaqsView({
  initialFaqs,
}: {
  /** Passed when SSR (siteConfig.seoEnabled) already fetched the list —
   * skips the client-side fetch. Undefined (not just empty) means "no SSR
   * data", so the client fetch below still runs in that case. */
  initialFaqs?: FaqItem[];
}) {
  const { t } = useTranslation();
  const hasSSRData = initialFaqs !== undefined;
  const [faqs, setFaqs] = useState<FaqItem[]>(initialFaqs ?? []);
  const [loading, setLoading] = useState(!hasSSRData);
  const [openId, setOpenId] = useState<string | null>(initialFaqs?.[0]?.id ?? null);

  useEffect(() => {
    if (hasSSRData) return;
    let cancelled = false;
    fetchFaqs().then((result) => {
      if (cancelled) return;
      setFaqs(result);
      setOpenId(result[0]?.id ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // hasSSRData is derived from a prop that never changes after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col">
      <PageBreadcrumb title={t("faqsPage.title")} items={[{ label: t("faqsPage.title") }]} hideMobileBar />
      <MobileBreadcrum title={t("faqsPage.title")} />

      <div className="w-full bg-bg-secondary xl:bg-bg-primary">
        <div className="container flex flex-col items-center gap-7 py-8 xl:py-16">
          <div className="flex w-full max-w-2xl flex-col items-center gap-2 text-center max-xl:hidden">
            <h1 className="text-xl font-medium text-text-primary xl:text-2xl">
              {t("faqsPage.title")}
            </h1>
            <p className="text-base text-text-secondary xl:text-lg">{t("faqsPage.subtitle")}</p>
          </div>

          <div className="flex w-full max-w-4xl flex-col gap-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-lg" />
              ))
            ) : faqs.length === 0 ? (
              <EmptyState
                icon={BrochureIcon}
                title={t("faqsPage.emptyTitle")}
                description={t("faqsPage.emptyDescription")}
              />
            ) : (
              faqs.map((faq) => (
                <FaqPageAccordionItem
                  key={faq.id}
                  faq={faq}
                  isOpen={openId === faq.id}
                  onToggle={() => setOpenId((current) => (current === faq.id ? null : faq.id))}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
