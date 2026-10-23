"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { FacebookShareButton, WhatsappShareButton, XShareButton } from "react-share";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { AppImage } from "@/components/ui/app-image";
import { AppTag } from "@/components/ui/app-tag";
import { ShareModal } from "@/components/ui/share-modal";
import { BlogCard } from "@/components/home/blog-card";
import RichTextContent from "@/components/common/RichText";
import MobileBreadcrum from "@/components/common/MobileBreadcrumb";
import {
  ClockIcon,
  FacebookIcon,
  InstagramIcon,
  ShareIcon,
  TwitterIcon,
  WhatsAppIcon,
} from "@/components/icons/icons";
import {
  blogBody,
  blogDateLabel,
  blogReadMinutes,
  blogTagNames,
  toBlogPost,
  type BlogDetailApi,
  type BlogListItemApi,
} from "@/lib/blogs-catalog";
import { useTranslation } from "@/lib/i18n/translation-context";

const SHARE_ICON_CLASS =
  "inline-flex items-center justify-center gap-3 rounded-3xl bg-bg-secondary p-2 outline outline-1 outline-border-default transition-colors duration-200 hover:bg-bg-tertiary";

export default function BlogDetailsView({
  blog,
  related,
}: {
  blog: BlogDetailApi;
  related: BlogListItemApi[];
}) {
  const { t } = useTranslation();
  const [shareOpen, setShareOpen] = useState(false);
  const [instagramCopied, setInstagramCopied] = useState(false);

  const shareUrl = typeof window === "undefined" ? "" : window.location.href;

  // Instagram has no web share-intent URL — copy the link, then hand off to
  // Instagram so the user can paste it into a post/story/DM themselves.
  const shareToInstagram = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setInstagramCopied(true);
      setTimeout(() => setInstagramCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  };

  const readMinutes = blogReadMinutes(blog);
  const dateLabel = blogDateLabel(blog);
  const tags = blogTagNames(blog).filter(Boolean);
  const body = blogBody(blog);
  const categoryLabel = blog.translated_category_name ?? blog.category_name ?? blog.category;

  const meta = (
    <>
      {categoryLabel && (
        <AppTag variant="brand" shape="chip" className="text-xs text-text-brand">
          {categoryLabel}
        </AppTag>
      )}
      {dateLabel && (
        <span className="flex items-center gap-1.5 text-xs text-text-secondary xl:text-sm">
          <CalendarDays className="size-4 shrink-0 text-icon-secondary" />
          {dateLabel}
        </span>
      )}
      <span className="flex items-center gap-1.5 text-xs text-text-secondary xl:text-sm">
        <ClockIcon className="size-4 shrink-0 text-icon-secondary" />
        {t("blogs.readMinutes", { count: readMinutes })}
      </span>
    </>
  );

  return (
    <div className="flex flex-col">
      <PageBreadcrumb
        title={t("blogs.title")}
        items={[
          { label: t("blogs.breadcrumb"), href: "/blogs" },
          { label: t("blogs.detailsTitle") },
        ]}
        hideMobileBar
      />

      {/* max-lg: header bar, stacked article, no side chrome. */}
      <div className="flex flex-col xl:hidden">
        <MobileBreadcrum
          title={t("blogs.detailsMobileTitle")}
          headerAction={
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              aria-label={t("common.share")}
            >
              <ShareIcon className="size-5 text-icon-primary" />
            </button>
          }
        />

        <div className="flex flex-col gap-4 bg-bg-secondary pb-8">
          <article className="container flex flex-col gap-3 bg-bg-primary py-4">
            <h1 className="text-base font-semibold text-text-primary">{blog.title}</h1>
            <div className="flex flex-wrap items-center gap-3">{meta}</div>
            <AppImage
              src={blog.image}
              alt={blog.title}
              className="aspect-28/15 w-full rounded-lg object-cover"
            />
            {blog.short_description && (
              <p className="text-sm text-text-secondary">{blog.short_description}</p>
            )}
            {body && <RichTextContent content={body} className="text-sm text-text-primary" />}
          </article>

          {tags.length > 0 && (
            <div className="container">
              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-bg-primary p-4">
                <span className="text-sm font-semibold text-text-primary">
                  {t("blogs.tagsLabel")}
                </span>
                {tags.map((tag) => (
                  <AppTag key={tag} variant="secondary" shape="chip" className="text-xs">
                    {tag}
                  </AppTag>
                ))}
              </div>
            </div>
          )}

          {related.length > 0 && (
            <div className="container flex flex-col gap-3">
              <h2 className="text-base font-semibold text-text-primary">
                {t("blogs.relatedBlogs")}
              </h2>
              {related.map((item) => (
                <BlogCard key={item.slug} blog={toBlogPost(item)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="hidden w-full xl:block">
        <div className="w-full bg-bg-secondary">
          <div className="container py-10">
            <article className="flex flex-col gap-6 rounded-2xl border border-border-default bg-bg-primary p-6">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-6">
                  <div className="flex flex-1 flex-wrap items-center gap-3">{meta}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium text-text-primary">{t("blogs.share")}</span>
                    <WhatsappShareButton
                      url={shareUrl}
                      title={blog.title}
                      aria-label={t("share.whatsapp")}
                      className={SHARE_ICON_CLASS}
                      resetButtonStyle={false}
                    >
                      <WhatsAppIcon className="size-5 text-icon-primary" />
                    </WhatsappShareButton>
                    <button
                      type="button"
                      onClick={shareToInstagram}
                      aria-label={instagramCopied ? t("share.instagramCopied") : t("share.instagram")}
                      className={SHARE_ICON_CLASS}
                    >
                      <InstagramIcon className="size-5 text-icon-primary" />
                    </button>
                    <FacebookShareButton
                      url={shareUrl}
                      aria-label={t("share.facebook")}
                      className={SHARE_ICON_CLASS}
                      resetButtonStyle={false}
                    >
                      <FacebookIcon className="size-5 text-icon-primary" />
                    </FacebookShareButton>
                    <XShareButton
                      url={shareUrl}
                      title={blog.title}
                      aria-label={t("share.twitter")}
                      className={SHARE_ICON_CLASS}
                      resetButtonStyle={false}
                    >
                      <TwitterIcon className="size-5 text-icon-primary" />
                    </XShareButton>
                  </div>
                </div>

                <div className="dashed-divider" />

                <div className="flex flex-col gap-4">
                  <h1 className="text-2xl font-medium text-text-primary">{blog.title}</h1>
                  {blog.short_description && (
                    <p className="text-base text-text-primary opacity-80">{blog.short_description}</p>
                  )}
                </div>
              </div>

              <AppImage
                src={blog.image}
                alt={blog.title}
                className="h-[520px] w-full rounded-xl object-cover"
              />
            </article>
          </div>
        </div>

        <div className="w-full bg-bg-primary">
          <div className="container py-10">
            {body && <RichTextContent content={body} className="text-base text-text-primary" />}
          </div>
        </div>

        {tags.length > 0 && (
          <div className="w-full border-t border-b border-border-default">
            <div className="container flex flex-wrap items-center gap-3 py-6">
              <span className="text-base font-medium text-text-primary">
                {t("blogs.tagsLabel")}
              </span>
              {tags.map((tag) => (
                <AppTag key={tag} variant="secondary" shape="chip" className="text-sm">
                  {tag}
                </AppTag>
              ))}
            </div>
          </div>
        )}

        {related.length > 0 && (
          <div className="w-full bg-bg-secondary">
            <div className="container flex flex-col gap-6 py-16">
              <h2 className="text-xl font-medium text-text-primary">
                {t("blogs.relatedBlogs")}
              </h2>
              <div className="grid grid-cols-2 gap-6 xl:grid-cols-4">
                {related.map((item) => (
                  <BlogCard key={item.slug} blog={toBlogPost(item)} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        url={shareUrl}
        title={blog.title}
      />
    </div>
  );
}

