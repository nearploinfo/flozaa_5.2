"use client";

import { useEffect, useState } from "react";
import { usePathnameCompat } from "@/lib/next-router-compat";
import BlogDetailsView from "@/components/blogs/BlogDetailsView";
import { fetchBlogDetail, type BlogDetailApi, type BlogListItemApi } from "@/lib/blogs-catalog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { BrochureIcon } from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";

// Used when siteConfig.seoEnabled is false (static export/shared hosting).
// The HTML file actually served may be the shared fallback shell (built for
// a placeholder slug, since real slugs aren't enumerable at build time) —
// so the real slug is read from the live browser URL, not a build-time prop,
// then fetched client-side.
export function BlogDetailsLoader() {
  const { t } = useTranslation();
  const pathname = usePathnameCompat();
  const slug = pathname.split("/").filter(Boolean).pop() ?? "";

  const [blog, setBlog] = useState<BlogDetailApi | null>(null);
  const [related, setRelated] = useState<BlogListItemApi[]>([]);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchBlogDetail(slug).then((result) => {
      if (cancelled) return;
      if (!result) {
        setNotFoundState(true);
        return;
      }
      setBlog(result.blog);
      setRelated(result.related);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (notFoundState) {
    return (
      <div className="w-full bg-bg-secondary py-16">
        <div className="container">
          <EmptyState
            icon={BrochureIcon}
            title={t("blogs.emptyTitle")}
            description={t("blogs.notFound")}
          />
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="w-full bg-bg-secondary">
        <div className="container flex flex-col gap-4 py-6 lg:py-10">
          <Skeleton className="h-10 w-2/3 rounded-lg" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return <BlogDetailsView blog={blog} related={related} />;
}
