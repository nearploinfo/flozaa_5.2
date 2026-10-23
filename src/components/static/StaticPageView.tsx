"use client";

import { useEffect, useState } from "react";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import RichTextContent from "@/components/common/RichText";
import { BrochureIcon } from "@/components/icons/icons";
import { fetchStaticPage } from "@/lib/static-page";
import { useTranslation } from "@/lib/i18n/translation-context";
import { readLocationCookieFromDocument } from "@/lib/location-cookie";

/** Country-specific pages need coords to resolve the right country's content; about_us/contact_us don't. */
const COUNTRY_SPECIFIC_PAGE_KEYS = new Set(["customer_privacy_policy", "customer_terms_conditions"]);

function StaticPageShell({
  title,
  loading,
  content,
}: {
  title: string;
  loading: boolean;
  content: string | null;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col">
      <PageBreadcrumb title={title} items={[{ label: title }]} />

      <div className="w-full bg-bg-primary">
        <div className="container flex flex-col items-center gap-6 py-8 xl:py-16">
          <div className="flex w-full items-center max-xl:hidden">
            <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
          </div>

          <div className="flex w-full flex-col items-center gap-7">
            {loading ? (
              <div className="flex w-full flex-col gap-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            ) : content ? (
              <RichTextContent content={content} className="w-full text-lg text-text-primary" />
            ) : (
              <EmptyState
                icon={BrochureIcon}
                title={t("staticPage.noDataTitle")}
                description={t("staticPage.noDataDescription")}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Fixed pages — about_us, customer_privacy_policy, customer_terms_conditions.
 * Title comes from an i18n key (it's known at build time); content is fetched
 * by `pageKey`, or passed as `initialContent` when SSR already fetched it. */
export function StaticPageView({
  pageKey,
  titleKey,
  initialContent,
}: {
  pageKey: string;
  titleKey: string;
  /** Passed when SSR (siteConfig.seoEnabled) already fetched the content —
   * skips the client-side fetch. Undefined (not just null) means "no SSR
   * data", so the client fetch below still runs in that case. */
  initialContent?: string | null;
}) {
  const { t } = useTranslation();
  const hasSSRData = initialContent !== undefined;
  const [content, setContent] = useState<string | null>(initialContent ?? null);
  const [loading, setLoading] = useState(!hasSSRData);

  useEffect(() => {
    if (hasSSRData) return;
    let cancelled = false;
    const location = COUNTRY_SPECIFIC_PAGE_KEYS.has(pageKey) ? readLocationCookieFromDocument() : null;
    const coords = location ? { lat: location.lat, lng: location.lng } : null;
    fetchStaticPage(pageKey, coords).then((result) => {
      if (cancelled) return;
      setContent(result.content);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // hasSSRData is derived from a prop that never changes after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey]);

  return <StaticPageShell title={t(titleKey)} loading={loading} content={content} />;
}

/** Admin-created custom pages, addressed by slug — title comes from the API
 * response itself (unknown until fetched), unlike the fixed pages above. */
export function CustomPageView({
  slug,
  initialTitle,
  initialContent,
}: {
  slug: string;
  initialTitle?: string | null;
  initialContent?: string | null;
}) {
  const hasSSRData = initialContent !== undefined;
  const [title, setTitle] = useState<string | null>(initialTitle ?? null);
  const [content, setContent] = useState<string | null>(initialContent ?? null);
  const [loading, setLoading] = useState(!hasSSRData);

  useEffect(() => {
    if (hasSSRData) return;
    let cancelled = false;
    fetchStaticPage(slug).then((result) => {
      if (cancelled) return;
      setTitle(result.title);
      setContent(result.content);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // hasSSRData is derived from a prop that never changes after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return <StaticPageShell title={title ?? slug} loading={loading} content={content} />;
}
