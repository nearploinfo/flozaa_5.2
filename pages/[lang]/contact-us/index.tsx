import type { GetServerSideProps } from "next";
import { ContactUsView } from "@/components/static/ContactUsView";
import { MetaData } from "@/components/seo/MetaData";
import { fetchSeoSettings, type SeoSettings } from "@/lib/seo";
import { runWithSsrLocale } from "@/lib/i18n/ssr-locale-context";
import { siteConfig } from "@/lib/site-config";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";
import { useTranslation } from "@/lib/i18n/translation-context";
import { LOCATION_COOKIE_NAME, parseLocationCookie } from "@/lib/location-cookie";

interface PageProps {
  translation: TranslationPageProps;
  seo: SeoSettings | null;
}

export default function ContactUsPage(props: Partial<PageProps>) {
  const { languages, lang, defaultLocale } = useTranslation();
  // Contact info (phone/email/hours/address/map) comes from the global
  // settings slice — fetched once by AppBootstrap client-side, same as the
  // header/footer — not re-fetched per page, so no SSR data-fetch here.
  return (
    <>
      {props.seo && (
        <MetaData
          seo={props.seo}
          pageName="/contact-us"
          languages={languages}
          lang={lang}
          defaultLocale={defaultLocale}
        />
      )}
      <ContactUsView />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> | undefined = siteConfig.seoEnabled
  ? async (context) => {
      const lang = context.params?.lang as string;
      return runWithSsrLocale(lang, async () => {
        const translation = await getTranslationProps(lang);
        if (!translation) return { notFound: true };
        const location = parseLocationCookie(context.req.cookies[LOCATION_COOKIE_NAME]);
        const coords = location ? { lat: location.lat, lng: location.lng } : null;
        const seo = await fetchSeoSettings("contact-us", null, coords);
        return { props: { translation, seo } };
      });
    }
  : undefined;
