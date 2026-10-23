"use client";

import { Link } from "@/components/ui/locale-link";
import { ArrowRight } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { AppButton } from "@/components/ui/app-button";
import { AppTag } from "@/components/ui/app-tag";
import type { BlogPost } from "@/lib/blogs-catalog";
import { useTranslation } from "@/lib/i18n/translation-context";

export function BlogCard({ blog }: { blog: BlogPost }) {
  const { t } = useTranslation();
  return (
    <>
      <BlogCardMobile blog={blog} />

      <Link
        href={blog.href}
        className="group hidden w-full flex-col items-start gap-4 rounded-xl border border-border-default bg-bg-primary p-4 xl:flex"
      >
        <AppImage
          src={blog.image}
          alt={blog.title}
          className="aspect-28/15 w-full rounded-lg border border-border-default object-cover"
        />

        <div className="flex w-full flex-col items-start gap-4">
          <div className="flex w-full items-center gap-2">
            <AppTag
              variant="secondary"
              shape="chip"
              className="min-w-0 truncate border border-border-default"
            >
              {blog.category}
            </AppTag>
            <span className="size-1 shrink-0 rounded-full bg-bg-inverse opacity-40" />
            <span className="shrink-0 whitespace-nowrap text-sm text-text-primary">
              {blog.date}
            </span>
          </div>

          <div className="flex w-full flex-col items-start gap-1">
            <span className="line-clamp-1 text-sm text-text-primary">
              {blog.title}
            </span>
            <span className="line-clamp-1 text-xs text-text-secondary">
              {blog.excerpt}
            </span>
          </div>

          <AppButton
            asChild
            variant="link"
            size="sm"
            className="gap-0 overflow-hidden rounded-md transition-all duration-200 group-hover:gap-1 group-hover:bg-bg-brand"
          >
            <span>
              <span className="text-sm font-normal text-button-link-secondary-text transition-colors duration-200 group-hover:text-white">
                {t("common.readMore")}
              </span>
              <span className="max-w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:max-w-4 group-hover:opacity-100">
                <ArrowRight className="size-4 shrink-0 text-white rtl:rotate-180" />
              </span>
            </span>
          </AppButton>
        </div>
      </Link>
    </>
  );
}

/** max-xl layout: taller image, single-line title and a three-line excerpt, no Read More affordance. */
function BlogCardMobile({ blog }: { blog: BlogPost }) {
  return (
    <Link
      href={blog.href}
      className="flex w-full flex-col items-start gap-3 rounded-xl bg-bg-primary p-3 xl:hidden"
    >
      <AppImage
        src={blog.image}
        alt={blog.title}
        className="aspect-28/15 w-full rounded-lg object-cover"
      />

      <div className="flex w-full items-center gap-2">
        <AppTag variant="brand" shape="chip" className="min-w-0 truncate text-xs text-text-brand">
          {blog.category}
        </AppTag>
        <span className="size-1 shrink-0 rounded-full bg-bg-inverse opacity-40" />
        <span className="shrink-0 whitespace-nowrap text-xs text-text-secondary">{blog.date}</span>
      </div>

      <div className="flex w-full flex-col items-start gap-1">
        <span className="line-clamp-1 text-sm font-semibold text-text-primary">{blog.title}</span>
        <span className="line-clamp-3 text-xs text-text-secondary">{blog.excerpt}</span>
      </div>
    </Link>
  );
}
