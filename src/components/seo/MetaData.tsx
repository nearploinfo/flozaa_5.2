import Head from "next/head";
import { siteConfig } from "@/lib/site-config";
import { localizePath } from "@/lib/i18n/locale-path";
import type { LanguageListItem } from "@/lib/i18n/language-list";
import type { SeoSettings } from "@/lib/seo";

function absoluteUrl(path: string): string {
  return siteConfig.siteUrl ? `${siteConfig.siteUrl}${path}` : path;
}

function absoluteImage(image: string): string {
  if (image.startsWith("http")) return image;
  return absoluteUrl(image);
}

/**
 * Renders only per-page SEO tags. Deliberately does NOT render manifest,
 * theme-color, apple-touch-icon, splash images, or font preconnects — those
 * already live in pages/_document.tsx and must not be duplicated here.
 */
export function MetaData({
  seo,
  pageName,
  languages,
  lang,
  defaultLocale,
}: {
  seo: SeoSettings;
  pageName: string;
  languages: LanguageListItem[];
  lang: string;
  defaultLocale: string;
}) {
  const canonicalUrl = absoluteUrl(localizePath(pageName, lang, defaultLocale));
  const ogImage = absoluteImage(seo.ogImage);
  const twitterImage = absoluteImage(seo.twitterImage);

  return (
    <Head>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      {seo.keywords.length > 0 && <meta name="keywords" content={seo.keywords.join(", ")} />}
      <meta name="robots" content="index, follow" />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteConfig.appName} />
      <meta property="og:title" content={seo.ogTitle} />
      <meta property="og:description" content={seo.ogDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.twitterTitle} />
      <meta name="twitter:description" content={seo.twitterDescription} />
      <meta name="twitter:image" content={twitterImage} />

      <link rel="canonical" href={canonicalUrl} />
      {languages.map((language) => (
        <link
          key={language.code}
          rel="alternate"
          hrefLang={language.code}
          href={absoluteUrl(localizePath(pageName, language.code, defaultLocale))}
        />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={absoluteUrl(localizePath(pageName, defaultLocale, defaultLocale))}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.schemaMarkup) }}
      />
    </Head>
  );
}
