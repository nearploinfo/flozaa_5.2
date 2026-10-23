import type { GetServerSideProps } from "next";
import { StaticPageView } from "@/components/static/StaticPageView";
import { MetaData } from "@/components/seo/MetaData";
import { fetchStaticPage } from "@/lib/static-page";
import { fetchSeoSettings, type SeoSettings } from "@/lib/seo";
import { runWithSsrLocale } from "@/lib/i18n/ssr-locale-context";
import { siteConfig } from "@/lib/site-config";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";
import { useTranslation } from "@/lib/i18n/translation-context";
import { LOCATION_COOKIE_NAME, parseLocationCookie } from "@/lib/location-cookie";

const PAGE_KEY = "about_us";

interface PageProps {
  translation: TranslationPageProps;
  content: string | null;
  seo: SeoSettings | null;
}

export default function AboutUsPage(props: Partial<PageProps>) {
  const { languages, lang, defaultLocale } = useTranslation();
  return (
    <>
      {props.seo && (
        <MetaData
          seo={props.seo}
          pageName="/about-us"
          languages={languages}
          lang={lang}
          defaultLocale={defaultLocale}
        />
      )}
      <StaticPageView pageKey={PAGE_KEY} titleKey="nav.aboutUs" initialContent={props.content} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> | undefined = siteConfig.seoEnabled
  ? async (context) => {
      const lang = context.params?.lang as string;
      return runWithSsrLocale(lang, async () => {
        const translation = await getTranslationProps(lang);
        if (!translation) return { notFound: true };

        // fetchStaticPage/fetchSeoSettings are both designed to degrade
        // gracefully rather than throw, but a page's SEO/content data
        // should never be able to 500 the whole page regardless — belt
        // and suspenders around whatever's left unaccounted for.
        const location = parseLocationCookie(context.req.cookies[LOCATION_COOKIE_NAME]);
        const coords = location ? { lat: location.lat, lng: location.lng } : null;
        const [result, seo] = await Promise.all([
          fetchStaticPage(PAGE_KEY).catch(() => ({ content: null, title: null })),
          fetchSeoSettings(PAGE_KEY, null, coords).catch(() => null),
        ]);
        return { props: { translation, content: result.content, seo } };
      });
    }
  : undefined;
