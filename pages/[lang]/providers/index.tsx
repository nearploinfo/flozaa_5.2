import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { ProvidersView } from "@/components/providers/providers-view";
import { MetaData } from "@/components/seo/MetaData";
import { LOCATION_COOKIE_NAME, coordsFromCookies, parseLocationCookie } from "@/lib/location-cookie";
import { getAllProvidersApi, getCategoriesHierarchicalApi } from "@/api/apiRoutes";
import {
  toNearbyProviderCard,
  type ProviderListResponse,
  type NearbyProvider,
} from "@/lib/providers-catalog";
import {
  expandCategorySlugs,
  toCategoryTreeNode,
  type CategoryHierarchicalApi,
  type CategoriesHierarchicalResponse,
} from "@/lib/categories-tree-api";
import {
  DISTANCE_OPTION_TO_RANGE,
  PRICE_MAX,
  PRICE_MIN,
  SORT_VALUE_TO_API,
  parseProvidersQuery,
  type ProvidersQueryState,
} from "@/lib/providers-query";
import { fetchSeoSettings, type SeoSettings } from "@/lib/seo";
import { runWithSsrLocale } from "@/lib/i18n/ssr-locale-context";
import { siteConfig } from "@/lib/site-config";
import { getTranslationProps, type TranslationPageProps } from "@/lib/i18n/page-props";
import { useTranslation } from "@/lib/i18n/translation-context";

const PAGE_SIZE = 9;

interface PageProps {
  translation: TranslationPageProps;
  initialProviders: NearbyProvider[];
  initialTotal: number;
  initialQuery: ProvidersQueryState;
  initialLat: number | null;
  initialLng: number | null;
  initialPriceBounds: { min: number; max: number };
  seo: SeoSettings | null;
}

function paramGetter(query: Record<string, string | string[] | undefined>) {
  return (key: string): string | null => {
    const value = query[key];
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value[0] ?? null;
    return null;
  };
}

export default function ProvidersPage(props: Partial<PageProps>) {
  const { languages, lang, defaultLocale } = useTranslation();
  const router = useRouter();

  const initialQuery = props.initialQuery ?? (router.isReady ? parseProvidersQuery(paramGetter(router.query)) : null);

  if (!initialQuery) return null;

  return (
    <>
      {props.seo && (
        <MetaData
          seo={props.seo}
          pageName="/providers"
          languages={languages}
          lang={lang}
          defaultLocale={defaultLocale}
        />
      )}
      <ProvidersView
        initialProviders={props.initialProviders ?? []}
        initialTotal={props.initialTotal ?? 0}
        initialQuery={initialQuery}
        initialLat={props.initialLat ?? null}
        initialLng={props.initialLng ?? null}
        initialPriceBounds={props.initialPriceBounds ?? { min: PRICE_MIN, max: PRICE_MAX }}
      />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> | undefined = siteConfig.seoEnabled
  ? async (context) => {
      const lang = context.params?.lang as string;
      return runWithSsrLocale(lang, async () => {
        const translation = await getTranslationProps(lang);
        if (!translation) return { notFound: true };

        const query = parseProvidersQuery(paramGetter(context.query));
        const distanceRanges = query.distanceRanges
          .map((key) => DISTANCE_OPTION_TO_RANGE[key])
          .filter(Boolean);
        const location = parseLocationCookie(context.req.cookies[LOCATION_COOKIE_NAME]);

        // A parent category slug only matches itself in the listing API, not
        // providers tagged under its children — expand to the full subtree
        // before SSR queries it, same as the client-side listing does.
        let categorySlugs = query.categorySlugs;
        if (categorySlugs.length > 0) {
          const categoriesResponse: CategoriesHierarchicalResponse | null =
            await getCategoriesHierarchicalApi().catch(() => null);
          const nodes: CategoryHierarchicalApi[] = categoriesResponse?.data ?? [];
          categorySlugs = expandCategorySlugs(nodes.map(toCategoryTreeNode), categorySlugs);
        }

        const [response, seo]: [ProviderListResponse | null, SeoSettings] = await Promise.all([
          getAllProvidersApi({
            latitude: location?.lat,
            longitude: location?.lng,
            search: query.search || undefined,
            limit: PAGE_SIZE,
            offset: query.page * PAGE_SIZE,
            category_slug: categorySlugs.length > 0 ? categorySlugs : undefined,
            service_mode: query.serviceModes.length > 0 ? query.serviceModes : undefined,
            distance_range: distanceRanges.length > 0 ? distanceRanges : undefined,
            rating_min: query.rating ?? undefined,
            price_min: query.priceMin ?? undefined,
            price_max: query.priceMax ?? undefined,
            sort_by: SORT_VALUE_TO_API[query.sort],
          }),
          fetchSeoSettings("providers-page", null, coordsFromCookies(context.req.cookies)),
        ]);

        return {
          props: {
            translation,
            initialProviders: (response?.data ?? []).map(toNearbyProviderCard),
            initialTotal: response?.total ?? 0,
            initialQuery: query,
            initialLat: location?.lat ?? null,
            initialLng: location?.lng ?? null,
            initialPriceBounds: {
              min: response?.service_min_price ?? PRICE_MIN,
              max: response?.service_max_price ?? PRICE_MAX,
            },
            seo,
          },
        };
      });
    }
  : undefined;
