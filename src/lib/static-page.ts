import { getPageSettingsApi } from "@/api/apiRoutes";

/**
 * get_page_setting keys its HTML by the `page` param itself — e.g. calling
 * with page=about_us returns { about_us: "<...>" } (or translated_about_us
 * once a non-default Content-Language is sent). Custom pages (admin-created,
 * addressed by slug) instead return a fixed { title, content } shape.
 */
export function extractPageContent(data: unknown, pageKey: string): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;

  const translated = record[`translated_${pageKey}`];
  if (typeof translated === "string" && translated) return translated;

  const direct = record[pageKey];
  if (typeof direct === "string" && direct) return direct;

  const translatedContent = record.translated_content;
  if (typeof translatedContent === "string" && translatedContent) return translatedContent;

  const content = record.content;
  return typeof content === "string" && content ? content : null;
}

/** Custom pages only — { title } / { translated_title }, absent on the fixed pages. */
export function extractPageTitle(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;

  const translatedTitle = record.translated_title;
  if (typeof translatedTitle === "string" && translatedTitle) return translatedTitle;

  const title = record.title;
  return typeof title === "string" && title ? title : null;
}

/** Shared by SSR (getServerSideProps) and the client view for both the fixed
 * pages (about_us, customer_privacy_policy, customer_terms_conditions) and
 * admin-created custom pages (page = the page's slug).
 *
 * `coords` is required by the backend for country-specific pages (the
 * privacy policy / terms variants) so the right country's content comes
 * back — omit it for global pages (about_us, contact_us) and custom page
 * slugs, which don't need it. */
export async function fetchStaticPage(
  pageKey: string,
  coords?: { lat: number; lng: number } | null
): Promise<{ content: string | null; title: string | null }> {
  const response = await getPageSettingsApi({
    page: pageKey,
    ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
  }).catch(() => null);
  const data = (response as { data?: unknown } | null)?.data;
  return { content: extractPageContent(data, pageKey), title: extractPageTitle(data) };
}
