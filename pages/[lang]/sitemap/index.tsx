import type { GetServerSideProps } from "next";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { Link } from "@/components/ui/locale-link";
import { MetaData } from "@/components/seo/MetaData";
import { fetchSeoSettings, type SeoSettings } from "@/lib/seo";
import { coordsFromCookies } from "@/lib/location-cookie";
import { runWithSsrLocale } from "@/lib/i18n/ssr-locale-context";
import { siteConfig } from "@/lib/site-config";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";
import { getHumanSitemapData, type HumanSitemapData } from "@/lib/sitemap-builder";
import { useTranslation } from "@/lib/i18n/translation-context";
import { localizePath } from "@/lib/i18n/locale-path";

interface PageProps {
  translation: TranslationPageProps;
  sitemap: HumanSitemapData;
  seo: SeoSettings | null;
}

function SitemapSection({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex w-full flex-col items-start gap-3">
      <h2 className="text-lg font-medium text-text-primary">{title}</h2>
      <div className="flex w-full flex-col items-start gap-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="text-sm text-text-brand hover:underline">
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function SitemapPage(props: Partial<PageProps>) {
  const { t, languages, lang, defaultLocale } = useTranslation();
  const sitemap = props.sitemap ?? { pages: [], categories: [], services: [], providers: [], blogs: [] };
  const languageItems = languages.map((language) => ({
    label: language.name,
    href: localizePath("/sitemap", language.code, defaultLocale),
  }));

  return (
    <>
      {props.seo && (
        <MetaData
          seo={props.seo}
          pageName="/sitemap"
          languages={languages}
          lang={lang}
          defaultLocale={defaultLocale}
        />
      )}
      <PageBreadcrumb title={t("sitemapPage.title")} items={[{ label: t("sitemapPage.title") }]} />
      <div className="container grid grid-cols-1 items-start gap-8 py-16 md:grid-cols-2 lg:grid-cols-4">
        <SitemapSection title={t("sitemapPage.pages")} items={sitemap.pages} />
        <SitemapSection title={t("sitemapPage.categories")} items={sitemap.categories} />
        <SitemapSection title={t("sitemapPage.services")} items={sitemap.services} />
        <SitemapSection title={t("sitemapPage.providers")} items={sitemap.providers} />
        <SitemapSection title={t("sitemapPage.blogs")} items={sitemap.blogs} />
        <SitemapSection title={t("sitemapPage.languages")} items={languageItems} />
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> | undefined = siteConfig.seoEnabled
  ? async (context) => {
      const lang = context.params?.lang as string;
      return runWithSsrLocale(lang, async () => {
        const translation = await getTranslationProps(lang);
        if (!translation) return { notFound: true };
        const [sitemap, seo] = await Promise.all([getHumanSitemapData(), fetchSeoSettings("sitemap", null, coordsFromCookies(context.req.cookies))]);
        return { props: { translation, sitemap, seo } };
      });
    }
  : undefined;
