import type { GetServerSideProps } from "next";
import { ServiceDetailsView } from "@/components/services/service-details-view";
import { ServiceDetailsLoader } from "@/components/services/service-details-loader";
import { MetaData } from "@/components/seo/MetaData";
import { getServiceDetailsApi } from "@/api/apiRoutes";
import type { ServiceDetailApi, ServiceDetailResponse } from "@/lib/services-catalog";
import { fetchSeoSettings, type SeoSettings } from "@/lib/seo";
import { runWithSsrLocale } from "@/lib/i18n/ssr-locale-context";
import { siteConfig } from "@/lib/site-config";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";
import { useTranslation } from "@/lib/i18n/translation-context";
import { LOCATION_COOKIE_NAME, parseLocationCookie } from "@/lib/location-cookie";

interface PageProps {
  translation: TranslationPageProps;
  service: ServiceDetailApi | null;
  seo: SeoSettings | null;
  slug: string;
}

export default function ServiceDetailsPage(props: Partial<PageProps>) {
  const { languages, lang, defaultLocale } = useTranslation();
  // SEO=false (no getServerSideProps ran): service is always undefined
  // here — ServiceDetailsLoader reads the real slug from the live browser
  // URL and fetches client-side (matches the App Router version).
  if (!props.service) return <ServiceDetailsLoader />;
  return (
    <>
      {props.seo && props.slug && (
        <MetaData
          seo={props.seo}
          pageName={`/service-details/${props.slug}`}
          languages={languages}
          lang={lang}
          defaultLocale={defaultLocale}
        />
      )}
      <ServiceDetailsView service={props.service} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> | undefined = siteConfig.seoEnabled
  ? async (context) => {
      const lang = context.params?.lang as string;
      return runWithSsrLocale(lang, async () => {
        const translation = await getTranslationProps(lang);
        if (!translation) return { notFound: true };

        const slugParts = context.params?.slug as string[];
        const lastSlug = slugParts[slugParts.length - 1];
        const cookieLocation = parseLocationCookie(context.req.cookies[LOCATION_COOKIE_NAME]);
        const [response, seo] = await Promise.all([
          getServiceDetailsApi({
            slug: lastSlug,
            latitude: cookieLocation?.lat,
            longitude: cookieLocation?.lng,
          }) as Promise<ServiceDetailResponse | null>,
          fetchSeoSettings("service-details", lastSlug),
        ]);

        if (!response || response.error || !response.data) return { notFound: true };

        return { props: { translation, service: response.data, seo, slug: lastSlug } };
      });
    }
  : undefined;
