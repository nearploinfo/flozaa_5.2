import type { GetServerSideProps } from "next";
import { HomeView } from "@/components/home/home-view";
import { MetaData } from "@/components/seo/MetaData";
import { getHomeScreenDataApi } from "@/api/apiRoutes";
import type { HomeScreenResponse, SliderItem, FeaturedSection } from "@/lib/home-screen";
import { fetchSeoSettings, type SeoSettings } from "@/lib/seo";
import { runWithSsrLocale } from "@/lib/i18n/ssr-locale-context";
import { siteConfig } from "@/lib/site-config";
import { LOCATION_COOKIE_NAME, coordsFromCookies, parseLocationCookie } from "@/lib/location-cookie";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";
import { useTranslation } from "@/lib/i18n/translation-context";

interface PageProps {
  translation: TranslationPageProps;
  sliders: SliderItem[];
  featuredSections: FeaturedSection[];
  initialLat: number | null;
  initialLng: number | null;
  seo: SeoSettings | null;
}

export default function HomePage(props: Partial<PageProps>) {
  const { languages, lang, defaultLocale } = useTranslation();
  return (
    <>
      {props.seo && (
        <MetaData
          seo={props.seo}
          pageName="/"
          languages={languages}
          lang={lang}
          defaultLocale={defaultLocale}
        />
      )}
      <HomeView
        sliders={props.sliders ?? []}
        featuredSections={props.featuredSections ?? []}
        initialLat={props.initialLat ?? null}
        initialLng={props.initialLng ?? null}
      />
    </>
  );
}

// SEO=false: no data-fetching export at all — Automatic Static
// Optimization kicks in, HomeView fetches client-side instead (matches
// what the App Router version did when siteConfig.seoEnabled was false).
export const getServerSideProps: GetServerSideProps<PageProps> | undefined = siteConfig.seoEnabled
  ? async (context) => {
      const lang = context.params?.lang as string;
      return runWithSsrLocale(lang, async () => {
        const translation = await getTranslationProps(lang);
        if (!translation) return { notFound: true };

        const location = parseLocationCookie(context.req.cookies[LOCATION_COOKIE_NAME]);
        const [response, seo]: [HomeScreenResponse | null, SeoSettings] = await Promise.all([
          getHomeScreenDataApi({
            platform: "web",
            latitude: location?.lat,
            longitude: location?.lng,
          }),
          fetchSeoSettings("home", null, coordsFromCookies(context.req.cookies)),
        ]);

        return {
          props: {
            translation,
            sliders: response?.data?.sliders ?? [],
            featuredSections: response?.data?.featured_sections ?? [],
            initialLat: location?.lat ?? null,
            initialLng: location?.lng ?? null,
            seo,
          },
        };
      });
    }
  : undefined;
