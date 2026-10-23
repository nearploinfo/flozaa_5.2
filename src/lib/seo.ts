import { getSeoSettingsApi } from "@/api/apiRoutes";
import { siteConfig } from "@/lib/site-config";

export interface SeoSettings {
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;  
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  schemaMarkup: Record<string, unknown>;
}

function defaultSchemaMarkup(): Record<string, unknown> {
  const logo = siteConfig.siteUrl
    ? `${siteConfig.siteUrl}${siteConfig.defaultOgImage}`
    : siteConfig.defaultOgImage;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.appName,
    ...(siteConfig.siteUrl ? { url: siteConfig.siteUrl } : {}),
    logo,
  };
}

function fallbackSeoSettings(): SeoSettings {
  return {
    title: siteConfig.title,
    description: siteConfig.description,
    keywords: siteConfig.keywords,
    ogImage: siteConfig.defaultOgImage,
    ogTitle: siteConfig.title,
    ogDescription: siteConfig.description,
    twitterTitle: siteConfig.title,
    twitterDescription: siteConfig.description,
    twitterImage: siteConfig.defaultOgImage,
    schemaMarkup: defaultSchemaMarkup(),
  };
}

function parseSchemaMarkup(raw: unknown): Record<string, unknown> {
  if (typeof raw !== "string" || !raw.trim()) return defaultSchemaMarkup();
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : defaultSchemaMarkup();
  } catch {
    return defaultSchemaMarkup();
  }
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value) return value;
  }
  return null;
}

function toKeywords(raw: unknown, fallback: string[]): string[] {
  if (typeof raw !== "string" || !raw.trim()) return fallback;
  const list = raw.split(",").map((word) => word.trim()).filter(Boolean);
  return list.length > 0 ? list : fallback;
}

/**
 * Never throws — any failure (network, `response.error`, missing row) falls
 * back to a full SeoSettings built from siteConfig's static defaults, so a
 * page's SEO can never break or blank out the page.
 */
export async function fetchSeoSettings(
  page: string,
  slug: string | null,
  coords?: { lat: number; lng: number } | null
): Promise<SeoSettings> {
  const fallback = fallbackSeoSettings();
  try {
    const response = await getSeoSettingsApi({
      page,
      ...(slug ? { slug } : {}),
      ...(coords && !slug ? { latitude: coords.lat, longitude: coords.lng } : {}),
    });
    if (!response || response.error) return fallback;
    const data = (response.data ?? {}) as Record<string, unknown>;

    return {
      title: firstString(data.meta_title, data.title) ?? fallback.title,
      description: firstString(data.meta_description, data.description) ?? fallback.description,
      keywords: toKeywords(data.meta_keywords, fallback.keywords),
      ogImage: firstString(data.og_image, data.image) ?? fallback.ogImage,
      ogTitle: firstString(data.og_title, data.meta_title, data.title) ?? fallback.ogTitle,
      ogDescription:
        firstString(data.og_description, data.meta_description, data.description) ?? fallback.ogDescription,
      twitterTitle: firstString(data.twitter_title, data.meta_title, data.title) ?? fallback.twitterTitle,
      twitterDescription:
        firstString(data.twitter_description, data.meta_description, data.description) ??
        fallback.twitterDescription,
      twitterImage: firstString(data.twitter_image, data.og_image, data.image) ?? fallback.twitterImage,
      schemaMarkup: parseSchemaMarkup(data.schema_markup),
    };
  } catch {
    return fallback;
  }
}
