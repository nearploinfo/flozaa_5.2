import type { GetServerSideProps } from "next";
import { FaqsView } from "@/components/static/FaqsView";
import { MetaData } from "@/components/seo/MetaData";
import { fetchFaqs, type FaqItem } from "@/lib/faqs-catalog";
import { fetchSeoSettings, type SeoSettings } from "@/lib/seo";
import { coordsFromCookies } from "@/lib/location-cookie";
import { runWithSsrLocale } from "@/lib/i18n/ssr-locale-context";
import { siteConfig } from "@/lib/site-config";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";
import { useTranslation } from "@/lib/i18n/translation-context";

interface PageProps {
  translation: TranslationPageProps;
  faqs: FaqItem[];
  seo: SeoSettings | null;
}

export default function FaqsPage(props: Partial<PageProps>) {
  const { languages, lang, defaultLocale } = useTranslation();
  return (
    <>
      {props.seo && (
        <MetaData
          seo={props.seo}
          pageName="/faqs"
          languages={languages}
          lang={lang}
          defaultLocale={defaultLocale}
        />
      )}
      <FaqsView initialFaqs={props.faqs} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> | undefined = siteConfig.seoEnabled
  ? async (context) => {
      const lang = context.params?.lang as string;
      return runWithSsrLocale(lang, async () => {
        const translation = await getTranslationProps(lang);
        if (!translation) return { notFound: true };

        const [faqs, seo] = await Promise.all([fetchFaqs(), fetchSeoSettings("faqs", null, coordsFromCookies(context.req.cookies))]);
        return { props: { translation, faqs, seo } };
      });
    }
  : undefined;
