import { siteConfig } from "@/lib/site-config";
import { localizePath } from "@/lib/i18n/locale-path";
import { fetchLanguageList, fetchDefaultLocale } from "@/lib/i18n/language-list";
import { getSiteMapDataApi } from "@/api/apiRoutes";

/** Every public, non-auth-gated static page. Dynamic entries (categories,
 * services, providers, blogs) are appended in generateSitemapXml()/
 * getHumanSitemapData() below, from the same single get_site_map_data
 * call — both outputs list the same content. */
const STATIC_ROUTES = [
  "/",
  "/about-us",
  "/become-provider",
  "/blogs",
  "/categories",
  "/contact-us",
  "/custom-page",
  "/faqs",
  "/privacy-policy",
  "/providers",
  "/search",
  "/services",
  "/terms-and-conditions",
];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getPriority(route: string): string {
  if (route === "/") return "1.0";
  if (route === "/services" || route === "/providers" || route === "/blogs") return "0.9";
  if (
    route.startsWith("/service-details/") ||
    route.startsWith("/provider-details/") ||
    route.startsWith("/blog-details/") ||
    route === "/about-us" ||
    route === "/contact-us"
  ) {
    return "0.8";
  }
  return "0.7";
}

interface SiteMapItem {
  title: string;
  slug: string;
}

interface ServiceSiteMapItem extends SiteMapItem {
  provider_company_name?: string;
  provider_slug?: string;
}

interface SiteMapData {
  categories: SiteMapItem[];
  providers: SiteMapItem[];
  blogs: SiteMapItem[];
  services: ServiceSiteMapItem[];
}

/** Single call — no pagination, backend returns everything at once
 * (confirmed against the live API: categories/providers/blogs/services
 * arrays, no limit/offset params, no `total` field). */
async function fetchSiteMapData(): Promise<SiteMapData> {
  try {
    const response = await getSiteMapDataApi();
    return {
      categories: response?.data?.categories ?? [],
      providers: response?.data?.providers ?? [],
      blogs: response?.data?.blogs ?? [],
      services: response?.data?.services ?? [],
    };
  } catch {
    return { categories: [], providers: [], blogs: [], services: [] };
  }
}

export async function generateSitemapXml(): Promise<string> {
  const [languages, defaultLocale] = await Promise.all([fetchLanguageList(), fetchDefaultLocale()]);
  const languageCodes = languages.length > 0 ? languages.map((lang) => lang.code) : [defaultLocale];

  const siteMapData = siteConfig.seoEnabled
    ? await fetchSiteMapData()
    : { categories: [], providers: [], blogs: [], services: [] };

  const dynamicRoutes = [
    ...siteMapData.services.map((item) => `/service-details/${item.slug}`),
    ...siteMapData.providers.map((item) => `/provider-details/${item.slug}`),
    ...siteMapData.blogs.map((item) => `/blog-details/${item.slug}`),
    ...siteMapData.categories.map((item) => `/services?categories=${item.slug}`),
  ];
  const routes = [...new Set([...STATIC_ROUTES, ...dynamicRoutes])].sort((a, b) =>
    a === "/" ? -1 : b === "/" ? 1 : a.localeCompare(b)
  );

  const today = new Date().toISOString().split("T")[0];

  const urlEntries = routes.map((route) => {
    const alternates = languageCodes
      .map(
        (code) =>
          `<xhtml:link rel="alternate" hreflang="${code}" href="${escapeXml(siteConfig.siteUrl + localizePath(route, code, defaultLocale))}" />`
      )
      .join("");
    const xDefault = `<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(siteConfig.siteUrl + localizePath(route, defaultLocale, defaultLocale))}" />`;
    const loc = escapeXml(siteConfig.siteUrl + localizePath(route, defaultLocale, defaultLocale));
    return `<url><loc>${loc}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${getPriority(route)}</priority>${alternates}${xDefault}</url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urlEntries.join("")}</urlset>`;
}

export interface HumanSitemapSection {
  label: string;
  href: string;
}

export interface HumanSitemapData {
  pages: HumanSitemapSection[];
  categories: HumanSitemapSection[];
  services: HumanSitemapSection[];
  providers: HumanSitemapSection[];
  blogs: HumanSitemapSection[];
}

const STATIC_PAGE_LABELS: Record<string, string> = {
  "/": "Home",
  "/about-us": "About Us",
  "/become-provider": "Become a Provider",
  "/blogs": "Blogs",
  "/categories": "Categories",
  "/contact-us": "Contact Us",
  "/faqs": "FAQs",
  "/privacy-policy": "Privacy Policy",
  "/providers": "Providers",
  "/services": "Services",
  "/terms-and-conditions": "Terms and Conditions",
};

export async function getHumanSitemapData(): Promise<HumanSitemapData> {
  const siteMapData = siteConfig.seoEnabled
    ? await fetchSiteMapData()
    : { categories: [], providers: [], blogs: [], services: [] };

  return {
    pages: Object.entries(STATIC_PAGE_LABELS).map(([href, label]) => ({ label, href })),
    categories: siteMapData.categories.map((item) => ({
      label: item.title,
      href: `/services?categories=${item.slug}`,
    })),
    services: siteMapData.services.map((item) => ({ label: item.title, href: `/service-details/${item.slug}` })),
    providers: siteMapData.providers.map((item) => ({ label: item.title, href: `/provider-details/${item.slug}` })),
    blogs: siteMapData.blogs.map((item) => ({ label: item.title, href: `/blog-details/${item.slug}` })),
  };
}
