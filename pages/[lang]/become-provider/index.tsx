import type { GetServerSideProps } from "next";
import { BecomeProviderView } from "@/components/become-provider/become-provider-view";
import { MetaData } from "@/components/seo/MetaData";
import { getBecomeProviderSetingsApi } from "@/api/apiRoutes";
import type { BecomeProviderData, BecomeProviderResponse } from "@/lib/become-provider";
import { fetchSeoSettings, type SeoSettings } from "@/lib/seo";
import { coordsFromCookies } from "@/lib/location-cookie";
import { runWithSsrLocale } from "@/lib/i18n/ssr-locale-context";
import { siteConfig } from "@/lib/site-config";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";
import { useTranslation } from "@/lib/i18n/translation-context";

interface PageProps {
  translation: TranslationPageProps;
  becomeProviderData: BecomeProviderData | null;
  seo: SeoSettings | null;
}

export default function BecomeProviderPage(props: Partial<PageProps>) {
  const { languages, lang, defaultLocale } = useTranslation();
  return (
    <>
      {props.seo && (
        <MetaData
          seo={props.seo}
          pageName="/become-provider"
          languages={languages}
          lang={lang}
          defaultLocale={defaultLocale}
        />
      )}
      <BecomeProviderView initialData={props.becomeProviderData ?? undefined} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> | undefined = siteConfig.seoEnabled
  ? async (context) => {
      const lang = context.params?.lang as string;
      return runWithSsrLocale(lang, async () => {
        const translation = await getTranslationProps(lang);
        if (!translation) return { notFound: true };

        const [response, seo] = await Promise.all([
          getBecomeProviderSetingsApi({ latitude: "", longitude: "" }).catch(() => null) as Promise<
            BecomeProviderResponse | null
          >,
          fetchSeoSettings("become-provider", null, coordsFromCookies(context.req.cookies)),
        ]);

        return {
          props: {
            translation,
            becomeProviderData: response?.error === false ? response.data : null,
            seo,
          },
        };
      });
    }
  : undefined;
