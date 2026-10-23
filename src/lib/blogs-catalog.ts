import { formatFullDate } from "@/lib/helpers";
import { getBlogDetailsApi } from "@/api/apiRoutes";

export interface BlogPost {
  id: string;
  image: string;
  category: string;
  date: string;
  title: string;
  excerpt: string;
  href: string;
}

const RELATED_LIMIT = 4;

/**
 * get_blogs / get_blog_categories / get_blog_tags responses. Only the fields
 * the listing actually renders are required — the rest are optional because
 * the endpoints return slightly different shapes per install (some send the
 * category as a name, some as an id + slug).
 */
export interface BlogListItemApi {
  id: number | string;
  slug: string;
  title: string;
  image: string;
  short_description: string;
  created_at?: string;
  /** Some installs send the publish date under a different key. */
  date?: string;
  published_at?: string;
  category?: string;
  category_name?: string;
  translated_category_name?: string;
  category_id?: number | string;
  category_slug?: string;
  tags?: (string | { id?: number | string; name?: string; slug?: string })[];
}

export interface BlogCategoryApi {
  id: number | string;
  name?: string;
  title?: string;
  slug?: string;
  total_blogs?: number | string;
}

export interface BlogTagApi {
  id: number | string;
  name?: string;
  title?: string;
  slug?: string;
}

/** API envelopes vary (`data`, or a bare array) — normalize both to a list. */
export function toApiList<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response as T[];
  const data = (response as { data?: unknown } | null)?.data;
  if (Array.isArray(data)) return data as T[];
  // get_blog_tags nests the array one level deeper: { data: { tags: [...] } }.
  const nestedTags = (data as { tags?: unknown } | null)?.tags;
  return Array.isArray(nestedTags) ? (nestedTags as T[]) : [];
}

export function blogCategoryName(category: BlogCategoryApi): string {
  return category.name ?? category.title ?? String(category.id);
}

export function blogTagName(tag: BlogTagApi): string {
  return tag.name ?? tag.title ?? String(tag.id);
}

/** get_blogs filters server-side by this slug (`?tag=<slug>`), not by name. */
export function blogTagSlug(tag: BlogTagApi): string {
  return tag.slug ?? String(tag.id);
}

export function blogTagNames(blog: BlogListItemApi): string[] {
  return (blog.tags ?? []).map((tag) =>
    typeof tag === "string" ? tag : (tag.name ?? tag.slug ?? "")
  );
}

/** True when the blog belongs to the given category, matched by slug or name. */
export function blogMatchesCategory(blog: BlogListItemApi, category: BlogCategoryApi): boolean {
  const name = blogCategoryName(category).toLowerCase();
  return (
    (category.slug != null && blog.category_slug === category.slug) ||
    (blog.category_id != null && String(blog.category_id) === String(category.id)) ||
    (blog.translated_category_name ?? blog.category_name ?? blog.category ?? "").toLowerCase() === name
  );
}

/** Publish date label, tolerant of which key the API used (empty when absent). */
export function blogDateLabel(blog: BlogListItemApi): string {
  return formatFullDate(blog.created_at ?? blog.published_at ?? blog.date);
}

export function toBlogPost(blog: BlogListItemApi): BlogPost {
  return {
    id: blog.slug,
    image: blog.image,
    category: blog.translated_category_name ?? blog.category_name ?? blog.category ?? "",
    date: blogDateLabel(blog),
    title: blog.title,
    excerpt: blog.short_description,
    href: `/blog-details/${blog.slug}`,
  };
}

/** get_blog_details payload — same tolerant approach as the listing types. */
export interface BlogDetailApi extends BlogListItemApi {
  description?: string;
  long_description?: string;
  read_time?: number | string;
  related_blogs?: BlogListItemApi[];
}

/** Unwraps `{ data: {...} }`, `{ data: [ {...} ] }` and bare objects alike. */
export function toApiObject<T>(response: unknown): T | null {
  const data = (response as { data?: unknown } | null)?.data ?? response;
  if (Array.isArray(data)) return (data[0] as T) ?? null;
  // get_blog_details nests the record one level deeper: { data: { blog: {...} } }.
  const nestedBlog = (data as { blog?: unknown } | null)?.blog;
  if (nestedBlog && typeof nestedBlog === "object") return nestedBlog as T;
  return data && typeof data === "object" ? (data as T) : null;
}

/**
 * Shared by SSR (getServerSideProps) and the client loader so both extract
 * get_blog_details identically: `blog` unwrapped, `related_blogs` read as a
 * sibling of `blog` (not nested inside it), self excluded, capped to 4.
 */
export async function fetchBlogDetail(
  slug: string
): Promise<{ blog: BlogDetailApi; related: BlogListItemApi[] } | null> {
  const response = await getBlogDetailsApi({ slug }).catch(() => null);
  const blog = toApiObject<BlogDetailApi>(response);
  if (!blog) return null;

  const apiRelated = (response as { data?: { related_blogs?: BlogListItemApi[] } } | null)?.data
    ?.related_blogs;
  const related = (apiRelated ?? [])
    .filter((item) => item.slug !== slug)
    .slice(0, RELATED_LIMIT);

  return { blog, related };
}

export function blogBody(blog: BlogDetailApi): string {
  return blog.description ?? blog.long_description ?? "";
}

/** Minutes to read, from the API when it sends one, else ~200 words per minute. */
export function blogReadMinutes(blog: BlogDetailApi): number {
  const apiValue = Number(blog.read_time);
  if (Number.isFinite(apiValue) && apiValue > 0) return Math.round(apiValue);
  const words = `${blog.short_description ?? ""} ${blogBody(blog)}`
    .replace(/<[^>]*>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
