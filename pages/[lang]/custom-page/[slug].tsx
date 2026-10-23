import type { GetServerSideProps } from "next";
import { CustomPageView } from "@/components/static/StaticPageView";
import { MetaData } from "@/components/seo/MetaData";
import { fetchStaticPage } from "@/lib/static-page";
import { fetchSeoSettings, type SeoSettings } from "@/lib/seo";
import { runWithSsrLocale } from "@/lib/i18n/ssr-locale-context";
import { siteConfig } from "@/lib/site-config";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";
import { useTranslation } from "@/lib/i18n/translation-context";
import { usePathnameCompat } from "@/lib/next-router-compat";

interface PageProps {
  translation: TranslationPageProps;
  title: string | null;
  content: string | null;
  seo: SeoSettings | null;
}

export default function CustomPage(props: Partial<PageProps>) {
  // SEO=false (no getServerSideProps ran): props.content is always undefined
  // here — the real slug is read from the live browser URL rather than a
  // build-time prop, then fetched client-side (matches the other detail
  // pages' Loader pattern; see BlogDetailsLoader / ServiceDetailsLoader).
  const pathname = usePathnameCompat();
  const slug = pathname.split("/").filter(Boolean).pop() ?? "";
  const { languages, lang, defaultLocale } = useTranslation();

  return (
    <>
      {props.seo && (
        <MetaData
          seo={props.seo}
          pageName={`/custom-page/${slug}`}
          languages={languages}
          lang={lang}
          defaultLocale={defaultLocale}
        />
      )}
      <CustomPageView slug={slug} initialTitle={props.title} initialContent={props.content} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> | undefined = siteConfig.seoEnabled
  ? async (context) => {
      const lang = context.params?.lang as string;
      return runWithSsrLocale(lang, async () => {
        const translation = await getTranslationProps(lang);
        if (!translation) return { notFound: true };

        const slug = context.params?.slug as string;
        const [result, seo] = await Promise.all([
          fetchStaticPage(slug).catch(() => ({ content: null, title: null })),
          fetchSeoSettings(slug, null).catch(() => null),
        ]);
        return { props: { translation, title: result.title, content: result.content, seo } };
      });
    }
  : undefined;
