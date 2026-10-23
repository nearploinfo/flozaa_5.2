"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { BlogCard } from "@/components/home/blog-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { AppButton } from "@/components/ui/app-button";
import MobileBreadcrum from "@/components/common/MobileBreadcrumb";
import { BrochureIcon } from "@/components/icons/icons";
import { getBlogCategoriesApi, getBlogTagsApi, getBlogsApi } from "@/api/apiRoutes";
import {
  blogCategoryName,
  blogMatchesCategory,
  blogTagName,
  blogTagSlug,
  toApiList,
  toBlogPost,
  type BlogCategoryApi,
  type BlogListItemApi,
  type BlogTagApi,
} from "@/lib/blogs-catalog";
import { useTranslation } from "@/lib/i18n/translation-context";

const BLOGS_PAGE_SIZE = 30;
/** Tags shown before the sidebar's "View More" / the mobile card's "View All". */
const COLLAPSED_TAG_COUNT = 6;

const ALL_CATEGORY = "all";

export default function BlogsView({
  initialBlogs,
  initialCategories,
  initialTags,
}: {
  /** Passed when SSR (siteConfig.seoEnabled) already fetched the catalog —
   * skips the client-side fetch entirely. Undefined (not just empty) means
   * "no SSR data", so the client fetch below still runs in that case. */
  initialBlogs?: BlogListItemApi[];
  initialCategories?: BlogCategoryApi[];
  initialTags?: BlogTagApi[];
} = {}) {
  const { t } = useTranslation();
  const hasSSRData = initialBlogs !== undefined;
  const [blogs, setBlogs] = useState<BlogListItemApi[]>(initialBlogs ?? []);
  const [categories, setCategories] = useState<BlogCategoryApi[]>(initialCategories ?? []);
  const [tags, setTags] = useState<BlogTagApi[]>(initialTags ?? []);
  const [loading, setLoading] = useState(!hasSSRData);
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY);
  const [activeTagSlug, setActiveTagSlug] = useState<string | null>(null);
  const [tagSearch, setTagSearch] = useState("");
  const [showAllTags, setShowAllTags] = useState(false);
  const [tagsSheetOpen, setTagsSheetOpen] = useState(false);

  useEffect(() => {
    if (hasSSRData) return;
    let cancelled = false;
    Promise.all([
      getBlogsApi({ limit: BLOGS_PAGE_SIZE, offset: 0 }).catch(() => null),
      getBlogCategoriesApi().catch(() => null),
      getBlogTagsApi().catch(() => null),
    ]).then(([blogsResponse, categoriesResponse, tagsResponse]) => {
      if (cancelled) return;
      setBlogs(toApiList<BlogListItemApi>(blogsResponse));
      setCategories(toApiList<BlogCategoryApi>(categoriesResponse));
      setTags(toApiList<BlogTagApi>(tagsResponse));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // hasSSRData is derived from a prop that never changes after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // get_blogs filters by tag server-side (`?tag=<slug>`) — the list response
  // never carries a per-blog `tags` array, so client-side matching can't work.
  // Skips the first render: the mount effect above already loaded the
  // (untagged) initial list, whether from SSR or its own client fetch.
  const isFirstTagRender = useRef(true);
  useEffect(() => {
    if (isFirstTagRender.current) {
      isFirstTagRender.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    getBlogsApi({
      limit: BLOGS_PAGE_SIZE,
      offset: 0,
      ...(activeTagSlug ? { tag: activeTagSlug } : {}),
    })
      .catch(() => null)
      .then((response) => {
        if (cancelled) return;
        setBlogs(toApiList<BlogListItemApi>(response));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTagSlug]);

  // Category filtering still runs client-side: the loaded list carries
  // category_name/category_id, and the catalog is small enough to page once.
  const visibleBlogs = useMemo(() => {
    const category = categories.find(
      (item) => String(item.id) === activeCategory
    );
    if (!category) return blogs;
    return blogs.filter((blog) => blogMatchesCategory(blog, category));
  }, [blogs, categories, activeCategory]);

  const categoryCount = (category: BlogCategoryApi): number => {
    const apiCount = Number(category.total_blogs);
    if (Number.isFinite(apiCount) && apiCount > 0) return apiCount;
    return blogs.filter((blog) => blogMatchesCategory(blog, category)).length;
  };

  const filteredTags = tags.filter((tag) =>
    blogTagName(tag).toLowerCase().includes(tagSearch.trim().toLowerCase())
  );
  const visibleTags = showAllTags ? filteredTags : filteredTags.slice(0, COLLAPSED_TAG_COUNT);

  const toggleTag = (slug: string) =>
    setActiveTagSlug((current) => (current === slug ? null : slug));

  const blogGrid = loading ? (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-80 w-full rounded-xl" />
      ))}
    </div>
  ) : visibleBlogs.length === 0 ? (
    <EmptyState
      icon={BrochureIcon}
      title={t("blogs.emptyTitle")}
      description={t("blogs.emptyDescription")}
    />
  ) : (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {visibleBlogs.map((blog) => (
        <BlogCard key={blog.slug} blog={toBlogPost(blog)} />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col">
      <PageBreadcrumb
        title={t("blogs.title")}
        items={[{ label: t("blogs.breadcrumb") }]}
        hideMobileBar
      />

      {/* max-lg: header, category chips and a popular-tags card above the list. */}
      <div className="flex flex-col xl:hidden">
        <MobileBreadcrum title={t("blogs.mobileTitle")} />

        <div className="flex flex-col gap-4 bg-bg-secondary pb-6">
          <div className="container flex items-center gap-2 overflow-x-auto bg-bg-primary py-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-24 shrink-0 rounded-full" />
              ))
            ) : (
              <>
                <CategoryChip
                  active={activeCategory === ALL_CATEGORY}
                  label={`${t("blogs.all")} (${blogs.length})`}
                  onClick={() => setActiveCategory(ALL_CATEGORY)}
                />
                {categories.map((category) => (
                  <CategoryChip
                    key={category.id}
                    active={activeCategory === String(category.id)}
                    label={blogCategoryName(category)}
                    onClick={() => setActiveCategory(String(category.id))}
                  />
                ))}
              </>
            )}
          </div>

          {loading ? (
            <div className="container">
              <div className="flex flex-col gap-3 rounded-xl bg-bg-primary p-4">
                <Skeleton className="h-5 w-32" />
                <div className="flex flex-wrap items-center gap-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-8 w-20 rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          ) : tags.length > 1 && (
            <div className="container">
              <div className="flex flex-col gap-3 rounded-xl bg-bg-primary p-4">
                <div className="flex items-center gap-3">
                  <span className="flex-1 text-sm font-semibold text-text-primary">
                    {t("blogs.popularTags")}
                  </span>
                  {filteredTags.length > COLLAPSED_TAG_COUNT && (
                    <button
                      type="button"
                      onClick={() => setTagsSheetOpen(true)}
                      className="text-sm font-medium text-text-brand"
                    >
                      {t("blogs.viewAll")}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {filteredTags.slice(0, COLLAPSED_TAG_COUNT).map((tag) => {
                    const slug = blogTagSlug(tag);
                    return (
                      <TagChip
                        key={tag.id}
                        active={activeTagSlug === slug}
                        label={blogTagName(tag)}
                        onClick={() => toggleTag(slug)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <Drawer open={tagsSheetOpen} onOpenChange={setTagsSheetOpen}>
            <DrawerContent className="bg-bg-primary xl:hidden">
              <DrawerHeader className="border-b border-border-default px-4 pb-3">
                <DrawerTitle className="text-base font-semibold text-text-primary">
                  {t("blogs.popularTags")}
                </DrawerTitle>
              </DrawerHeader>
              <div className="flex flex-wrap items-center gap-2 overflow-y-auto p-4">
                {filteredTags.map((tag) => {
                  const slug = blogTagSlug(tag);
                  return (
                    <TagChip
                      key={tag.id}
                      active={activeTagSlug === slug}
                      label={blogTagName(tag)}
                      onClick={() => {
                        toggleTag(slug);
                        setTagsSheetOpen(false);
                      }}
                    />
                  );
                })}
              </div>
            </DrawerContent>
          </Drawer>

          <div className="container grid grid-cols-1 gap-4 md:grid-cols-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-72 w-full rounded-xl" />
              ))
            ) : visibleBlogs.length === 0 ? (
              <EmptyState
                icon={BrochureIcon}
                title={t("blogs.emptyTitle")}
                description={t("blogs.emptyDescription")}
              />
            ) : (
              visibleBlogs.map((blog) => (
                <BlogCard key={blog.slug} blog={toBlogPost(blog)} />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="hidden w-full bg-bg-secondary xl:block">
        <div className="container flex items-start gap-6 pt-10 pb-16">
          <aside className="flex w-72 shrink-0 flex-col gap-6">
            <div className="flex flex-col gap-3 rounded-xl border border-border-default bg-bg-primary p-4">
              <span className="text-sm font-medium text-text-primary">
                {t("blogs.categories")}
              </span>
              <div className="flex flex-col gap-2">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-10 w-full rounded-lg" />
                  ))
                ) : (
                  <>
                    <CategoryRow
                      active={activeCategory === ALL_CATEGORY}
                      label={t("blogs.all")}
                      count={blogs.length}
                      onClick={() => setActiveCategory(ALL_CATEGORY)}
                    />
                    {categories.map((category) => (
                      <CategoryRow
                        key={category.id}
                        active={activeCategory === String(category.id)}
                        label={blogCategoryName(category)}
                        count={categoryCount(category)}
                        onClick={() => setActiveCategory(String(category.id))}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col gap-3 rounded-xl border border-border-default bg-bg-primary p-4">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-9 w-full rounded-lg" />
                <div className="flex flex-wrap items-center gap-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-8 w-20 rounded-lg" />
                  ))}
                </div>
              </div>
            ) : (
              tags.length > 0 && (
                <div className="flex flex-col gap-3 rounded-xl border border-border-default bg-bg-primary p-4">
                  <span className="text-sm font-medium text-text-primary">
                    {t("blogs.tags")}
                  </span>
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-icon-secondary" />
                    <input
                      type="text"
                      value={tagSearch}
                      onChange={(event) => setTagSearch(event.target.value)}
                      placeholder={t("blogs.searchTags")}
                      className="w-full rounded-lg border border-border-default bg-bg-primary py-2 pr-3 pl-9 text-sm text-text-primary outline-none placeholder:text-text-secondary"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {visibleTags.map((tag) => {
                      const slug = blogTagSlug(tag);
                      return (
                        <TagChip
                          key={tag.id}
                          active={activeTagSlug === slug}
                          label={blogTagName(tag)}
                          onClick={() => toggleTag(slug)}
                        />
                      );
                    })}
                  </div>
                  {filteredTags.length > COLLAPSED_TAG_COUNT && (
                    <AppButton
                      variant="link"
                      size="sm"
                      rightIcon={Plus}
                      onClick={() => setShowAllTags((value) => !value)}
                      className="h-auto self-start p-0 text-sm font-medium text-text-brand hover:text-text-brand"
                    >
                      {showAllTags ? t("blogs.viewLess") : t("blogs.viewMore")}
                    </AppButton>
                  )}
                </div>
              )
            )}
          </aside>

          <div className="flex-1">{blogGrid}</div>
        </div>
      </div>
    </div>
  );
}

function CategoryRow({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-start transition-colors duration-200 ${
        active
          ? "bg-bg-brand text-text-inverse-light"
          : "bg-bg-secondary text-text-primary"
      }`}
    >
      <span className="flex-1 truncate text-sm">{label}</span>
      <span className={`text-sm ${active ? "text-text-inverse-light" : "text-text-secondary"}`}>
        ({count})
      </span>
    </button>
  );
}

function CategoryChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap transition-colors duration-200 ${
        active
          ? "border-border-brand bg-bg-brand-subtle text-text-brand"
          : "border-border-default bg-bg-primary text-text-primary"
      }`}
    >
      {label}
    </button>
  );
}

function TagChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm transition-colors duration-200 ${
        active
          ? "bg-bg-brand-subtle text-text-brand"
          : "bg-bg-secondary text-text-primary"
      }`}
    >
      {label}
    </button>
  );
}
